import time
import traceback
from concurrent.futures import ThreadPoolExecutor, as_completed
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Dict, List, Optional
import config
from abis.constants import (
    GET_ASSET_PRICE_ABI,
    GET_PRICE_ORACLE_ABI,
    GET_USER_ACCOUNT_DATA_ABI,
    LIQUIDATION_CALL_EVENT_ABI,
    POOL_ADDRESS,
    POOL_DATA_PROVIDER,
    UI_POOL_DATA_PROVIDER,
    GET_RESERVES_DATA_ABI,
)
from psycopg2 import pool, sql
from psycopg2.extras import RealDictCursor
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware



class AaveLiquidationAnalyzer:
    def __init__(self, chain_id: int = 1):
        self._load_config()

        if chain_id not in self.pool_addresses:
            raise ValueError(f"Unsupported chain ID: {chain_id}")

        self.chain_id = chain_id
        self.pool_address = self.pool_addresses[self.chain_id]

        self._init_web3()
        self._init_contracts()
        self.reserves_data_cache = self.fetch_all_reserves_data()

    def _load_config(self):
        self.rpc_urls = {
            1: config.RPC_URL_ETHEREUM,
        }
        self.pool_addresses = {
            1: POOL_ADDRESS,
        }
        self.database_url = config.DATABASE_URL
        self.database_schema = config.DATABASE_SCHEMA
        self.db_pool = pool.ThreadedConnectionPool(
            minconn=1, maxconn=10, dsn=self.database_url
        )

    def _init_web3(self):
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_urls[self.chain_id]))
        self.w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)

    def _init_contracts(self):
        self.pool_contract = self.w3.eth.contract(
            address=self.w3.to_checksum_address(self.pool_address),
            abi=[LIQUIDATION_CALL_EVENT_ABI, GET_USER_ACCOUNT_DATA_ABI],
        )

        self.provider_contract = self.w3.eth.contract(
            address=self.w3.to_checksum_address(POOL_DATA_PROVIDER),
            abi=[GET_PRICE_ORACLE_ABI],
        )

        self.price_oracle_address = (
            self.provider_contract.functions.getPriceOracle().call()
        )

        self.price_oracle_contract = self.w3.eth.contract(
            address=self.w3.to_checksum_address(self.price_oracle_address),
            abi=[GET_ASSET_PRICE_ABI],
        )


    def fetch_all_reserves_data(self):
        try:
            ui_pool_data_provider_contract = self.w3.eth.contract(
                address=self.w3.to_checksum_address(UI_POOL_DATA_PROVIDER),
                abi=[GET_RESERVES_DATA_ABI],
            )
            reserves_data = ui_pool_data_provider_contract.functions.getReservesData(
                self.w3.to_checksum_address(POOL_DATA_PROVIDER)
            ).call()

            reserves_list = reserves_data[0]
            all_reserves_data = {}
            for reserve in reserves_list:
                asset_address = reserve[0]
                asset_symbol = reserve[2]
                asset_decimals = reserve[3]

                all_reserves_data[asset_address.lower()] = {
                    "symbol": asset_symbol,
                    "decimals": asset_decimals,
                }
            return all_reserves_data
        except Exception as e:
            print(f"✗ Error fetching reserves data: {e}")
            traceback.print_exc()

    @contextmanager
    def get_db_cursor(self):
        conn = self.db_pool.getconn()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        try:
            yield cursor

            conn.commit()

        except Exception as e:
            conn.rollback()
            raise e

        finally:
            self.db_pool.putconn(conn)

    def fetch_liquidations_from_db(self, limit: int = 5) -> List[Dict]:
        """
        Fetch liquidations from the Ponder Postgres database
        """
        formatted_events = []
        try:
            with self.get_db_cursor() as cur:
                cur.execute(
                    sql.SQL("""
                        SELECT lc.* FROM {}.{} lc
                        LEFT JOIN {}.{} la ON lc.id = la.id
                        WHERE la.id IS NULL
                        ORDER BY lc.block_number ASC
                        LIMIT %s
                    """).format(
                        sql.Identifier(self.database_schema),
                        sql.Identifier("LiquidationCall"),
                        sql.Identifier(self.database_schema),
                        sql.Identifier("LiquidationAnalysis"),
                    ),
                    (limit,),
                )

                records = cur.fetchall()

            if not records:
                return []

            for record in records:
                formatted_events.append(
                    {
                        **record,
                        "block_number": int(record["block_number"]),
                        "debt_to_cover": int(record["debt_to_cover"]),
                        "liquidated_collateral_amount": int(
                            record["liquidated_collateral_amount"]
                        ),
                        "liquidation_time": datetime.fromtimestamp(
                            record["block_timestamp"], timezone.utc
                        ),
                    }
                )
            return formatted_events

        except Exception as e:
            print(f"Error fetching from database: {e}")
            traceback.print_exc()
            return []

    def update_liquidation_analysis(
        self, liquidation_id: str, tx_hash: str, analysis_result: Dict
    ) -> bool:
        """
        Insert analysis results into LiquidationAnalysis table and update status
        """
        try:
            with self.get_db_cursor() as cur:
                cur.execute(
                    sql.SQL("""
                        INSERT INTO {}.{} (
                            id,
                            analysis_status,
                            first_liquidatable_block,
                            first_liquidatable_time,
                            latency_seconds,
                            blocks_liquidatable,
                            collateral_symbol,
                            collateral_decimals,
                            collateral_price_usd,
                            debt_symbol,
                            debt_decimals,
                            debt_price_usd
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (id) DO UPDATE SET
                            analysis_status = EXCLUDED.analysis_status,
                            first_liquidatable_block = EXCLUDED.first_liquidatable_block,
                            first_liquidatable_time = EXCLUDED.first_liquidatable_time,
                            latency_seconds = EXCLUDED.latency_seconds,
                            blocks_liquidatable = EXCLUDED.blocks_liquidatable,
                            collateral_symbol = EXCLUDED.collateral_symbol,
                            collateral_decimals = EXCLUDED.collateral_decimals,
                            collateral_price_usd = EXCLUDED.collateral_price_usd,
                            debt_symbol = EXCLUDED.debt_symbol,
                            debt_decimals = EXCLUDED.debt_decimals,
                            debt_price_usd = EXCLUDED.debt_price_usd
                    """).format(
                        sql.Identifier(self.database_schema),
                        sql.Identifier("LiquidationAnalysis"),
                    ),
                    (
                        liquidation_id,
                        "ANALYZED",
                        analysis_result.get("first_liquidatable_block"),
                        analysis_result.get("first_liquidatable_time"),
                        int(analysis_result.get("time_liquidatable").total_seconds())
                        if analysis_result.get("time_liquidatable")
                        else None,
                        analysis_result.get("blocks_liquidatable"),
                        analysis_result.get("collateral_symbol"),
                        analysis_result.get("collateral_decimals"),
                        analysis_result.get("collateral_price_usd"),
                        analysis_result.get("debt_symbol"),
                        analysis_result.get("debt_decimals"),
                        analysis_result.get("debt_price_usd"),
                    ),
                )

                print(f"✓ Updated status for tx: {tx_hash}")
                return True

        except Exception as e:
            print(f"Error updating database for tx {tx_hash}: {e}")
            traceback.print_exc()
            return False

    def mark_liquidation_failed(
        self, liquidation_id: str, tx_hash: str, error_message: str
    ) -> bool:
        """
        Mark a liquidation analysis status as failed
        """
        try:
            with self.get_db_cursor() as cur:
                cur.execute(
                    sql.SQL("""
                        INSERT INTO {}.{} (id, analysis_status, error_message)
                        VALUES (%s, %s, %s)
                        ON CONFLICT (id) DO UPDATE SET
                            analysis_status = EXCLUDED.analysis_status,
                            error_message = EXCLUDED.error_message
                    """).format(
                        sql.Identifier(self.database_schema),
                        sql.Identifier("LiquidationAnalysis"),
                    ),
                    (liquidation_id, "FAILED", error_message),
                )
                print(f"✓ Recorded failure for tx: {tx_hash}")
                return True

        except Exception as e:
            print(f"Error marking tx as failed {tx_hash}: {e}")
            traceback.print_exc()
            return False

    def get_user_account_data_at_block(
        self, user_address: str, block_number: int
    ) -> Dict:
        """
        Get user account data at a specific block using the ABI
        """
        try:
            result = self.pool_contract.functions.getUserAccountData(
                self.w3.to_checksum_address(user_address)
            ).call(block_identifier=block_number)

            (
                total_collateral,
                total_debt,
                available_borrows,
                liquidation_threshold,
                ltv,
                health_factor,
            ) = result

            health_factor_float = health_factor / 1e18 if health_factor > 0 else 0

            return {
                "total_collateral": total_collateral / 1e8,
                "total_debt": total_debt / 1e8,
                "available_borrows": available_borrows / 1e8,
                "liquidation_threshold": liquidation_threshold / 100,
                "ltv": ltv / 100,
                "health_factor": health_factor_float,
                "block_number": block_number,
            }
        except Exception as e:
            traceback.print_exc()
            print(f"Error getting account data at block {block_number}: {e}")
            return None

    def binary_search_liquidatable_block(
        self, user_address: str, liquidation_block: int, search_blocks_back: int = 10000
    ) -> Optional[int]:
        """
        Use binary search to find the first block where health factor < 1.0
        """
        start_block = max(1, liquidation_block - search_blocks_back)
        end_block = liquidation_block
        first_liquidatable_block = None

        while start_block <= end_block:
            mid_block = (start_block + end_block) // 2
            account_data = self.get_user_account_data_at_block(user_address, mid_block)

            if account_data is None:
                print("WARN: couldnt fetch account data")
                start_block = mid_block + 1
                continue

            health_factor = account_data["health_factor"]

            if health_factor < 1.0:
                first_liquidatable_block = mid_block
                end_block = mid_block - 1
            else:
                start_block = mid_block + 1

            time.sleep(0.1)
        return (
            first_liquidatable_block if first_liquidatable_block else liquidation_block
        )

    def get_block_timestamp(self, block_number: int) -> datetime:
        """
        Get timestamp for a block
        """
        block = self.w3.eth.get_block(block_number)
        return datetime.fromtimestamp(block.timestamp, timezone.utc)

    def get_asset_info(self, block_number, asset):
        historical_price_oracle_address = (
            self.provider_contract.functions.getPriceOracle().call(
                block_identifier=block_number
            )
        )
        historical_price_oracle_contract = self.w3.eth.contract(
            address=self.w3.to_checksum_address(historical_price_oracle_address),
            abi=[GET_ASSET_PRICE_ABI],
        )

        raw_asset_price = historical_price_oracle_contract.functions.getAssetPrice(
            self.w3.to_checksum_address(asset)
        ).call(block_identifier=block_number)

        info = self.reserves_data_cache.get(asset.lower(), {})
        return {
            "decimals": info.get("decimals"),
            "symbol": info.get("symbol"),
            "asset_price_usd": raw_asset_price / (10**8),
        }

    def analyze_liquidation_timeline(
        self, liquidation_event: Dict, search_blocks_back: int = 10000
    ) -> Dict:
        """
        Analyze how long a position was liquidatable for a given liquidation event

        Args:
            liquidation_event: Event data from find_latest_liquidation_events
            search_blocks_back: How many blocks to search back for first liquidatable block
        """
        collateral_info = self.get_asset_info(
            liquidation_event["block_number"], liquidation_event["collateral_asset"]
        )
        debt_info = self.get_asset_info(
            liquidation_event["block_number"], liquidation_event["debt_asset"]
        )

        first_liquidatable_block = self.binary_search_liquidatable_block(
            liquidation_event["user_address"],
            liquidation_event["block_number"],
            search_blocks_back,
        )

        if first_liquidatable_block:
            first_liquidatable_time = self.get_block_timestamp(first_liquidatable_block)
            time_liquidatable = (
                liquidation_event["liquidation_time"] - first_liquidatable_time
            )
            blocks_liquidatable = (
                liquidation_event["block_number"] - first_liquidatable_block
            )

            result = {
                "first_liquidatable_block": first_liquidatable_block,
                "first_liquidatable_time": first_liquidatable_time,
                "time_liquidatable": time_liquidatable,
                "blocks_liquidatable": blocks_liquidatable,
                "collateral_symbol": collateral_info["symbol"],
                "collateral_decimals": collateral_info["decimals"],
                "collateral_price_usd": collateral_info["asset_price_usd"],
                "debt_symbol": debt_info["symbol"],
                "debt_decimals": debt_info["decimals"],
                "debt_price_usd": debt_info["asset_price_usd"],
            }

            return result
        else:
            return {"error": "Could not find when position became liquidatable"}

    def _process_single_liquidation(self, event: Dict) -> Dict:
        """
        Process a single liquidation event (used for parallel processing)

        Returns:
            Dict with 'success', 'result', 'event', and optionally 'error'
        """
        try:
            result = self.analyze_liquidation_timeline(event)
            if "error" not in result:
                self.update_liquidation_analysis(event["id"], event["tx_hash"], result)
                return {"success": True, "result": result, "event": event}
            else:
                self.mark_liquidation_failed(
                    event["id"], event["tx_hash"], result["error"]
                )
                return {"success": False, "event": event, "error": result["error"]}
        except Exception as e:
            error_msg = str(e)
            self.mark_liquidation_failed(event["id"], event["tx_hash"], error_msg)
            return {
                "success": False,
                "event": event,
                "error": error_msg,
                "traceback": traceback.format_exc(),
            }

    def analyze_latest_liquidations(
        self, num_liquidations: int = 5, max_workers: int = 5
    ) -> List[Dict]:
        """
        Find and analyze the latest liquidations automatically using parallel processing

        Args:
            num_liquidations: Number of latest liquidations to analyze
            max_workers: Maximum number of parallel workers (default 5)
        """
        print("=== FINDING LATEST LIQUIDATION EVENTS ===")

        events = self.fetch_liquidations_from_db(limit=num_liquidations)

        if not events:
            print("No liquidation events found!")
            return []

        print(f"\nFound {len(events)} liquidation events")
        print(
            f"=== ANALYZING LIQUIDATION TIMELINES (using {max_workers} parallel workers) ==="
        )

        results = []
        failed_count = 0

        actual_workers = min(max_workers, len(events))

        with ThreadPoolExecutor(max_workers=actual_workers) as executor:
            future_to_event = {
                executor.submit(self._process_single_liquidation, event): event
                for event in events[:num_liquidations]
            }

            completed = 0
            total = len(future_to_event)

            for future in as_completed(future_to_event):
                completed += 1
                event = future_to_event[future]

                try:
                    process_result = future.result()

                    if process_result["success"]:
                        results.append(process_result["result"])
                        print(
                            f"[{completed}/{total}] ✓ Analysis complete for tx: {event['tx_hash'][:16]}..."
                        )
                    else:
                        failed_count += 1
                        print(
                            f"[{completed}/{total}] ✗ Failed tx {event['tx_hash'][:16]}...: {process_result.get('error', 'Unknown error')}"
                        )
                        if "traceback" in process_result:
                            print(f"Traceback: {process_result['traceback'][:200]}...")

                except Exception as e:
                    failed_count += 1
                    print(
                        f"[{completed}/{total}] ✗ Exception for tx {event['tx_hash'][:16]}...: {e}"
                    )
                    traceback.print_exc()

        print("\n=== PARALLEL PROCESSING COMPLETE ===")
        print(f"Successfully analyzed: {len(results)}")
        if failed_count > 0:
            print(f"Failed: {failed_count}")

        return results
