import traceback
import os
from datetime import datetime
from web3 import Web3
from typing import Dict, List, Optional
import time

from web3.middleware import ExtraDataToPOAMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

LIQUIDATION_CALL_EVENT_ABI = {
    "anonymous": False,
    "inputs": [
        {"indexed": True, "internalType": "address", "name": "collateralAsset", "type": "address"},
        {"indexed": True, "internalType": "address", "name": "debtAsset", "type": "address"},
        {"indexed": True, "internalType": "address", "name": "user", "type": "address"},
        {"indexed": False, "internalType": "uint256", "name": "debtToCover", "type": "uint256"},
        {"indexed": False, "internalType": "uint256", "name": "liquidatedCollateralAmount", "type": "uint256"},
        {"indexed": False, "internalType": "address", "name": "liquidator", "type": "address"},
        {"indexed": False, "internalType": "bool", "name": "receiveAToken", "type": "bool"},
    ],
    "name": "LiquidationCall",
    "type": "event",
}

GET_USER_ACCOUNT_DATA_ABI = {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "getUserAccountData",
    "outputs": [
        {"internalType": "uint256", "name": "totalCollateralBase", "type": "uint256"},
        {"internalType": "uint256", "name": "totalDebtBase", "type": "uint256"},
        {"internalType": "uint256", "name": "availableBorrowsBase", "type": "uint256"},
        {"internalType": "uint256", "name": "currentLiquidationThreshold", "type": "uint256"},
        {"internalType": "uint256", "name": "ltv", "type": "uint256"},
        {"internalType": "uint256", "name": "healthFactor", "type": "uint256"},
    ],
    "stateMutability": "view",
    "type": "function",
}

UI_POOL_DATA_PROVIDER = "0x3F78BBD206e4D3c504Eb854232EdA7e47E9Fd8FC"

POOL_DATA_PROVIDER = "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e"

GET_PRICE_ORACLE_ABI = {
    "inputs": [],
    "name": "getPriceOracle",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function",
}

GET_RESERVES_DATA_ABI = {
  "inputs": [
    {
      "internalType": "contract IPoolAddressesProvider",
      "name": "provider",
      "type": "address"
    }
  ],
  "name": "getReservesData",
  "outputs": [
    {
      "components": [
        {
          "internalType": "address",
          "name": "underlyingAsset",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "symbol",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "decimals",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "baseLTVasCollateral",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "reserveLiquidationThreshold",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "reserveLiquidationBonus",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "reserveFactor",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "usageAsCollateralEnabled",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "borrowingEnabled",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "isActive",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "isFrozen",
          "type": "bool"
        },
        {
          "internalType": "uint128",
          "name": "liquidityIndex",
          "type": "uint128"
        },
        {
          "internalType": "uint128",
          "name": "variableBorrowIndex",
          "type": "uint128"
        },
        {
          "internalType": "uint128",
          "name": "liquidityRate",
          "type": "uint128"
        },
        {
          "internalType": "uint128",
          "name": "variableBorrowRate",
          "type": "uint128"
        },
        {
          "internalType": "uint40",
          "name": "lastUpdateTimestamp",
          "type": "uint40"
        },
        {
          "internalType": "address",
          "name": "aTokenAddress",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "variableDebtTokenAddress",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "interestRateStrategyAddress",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "availableLiquidity",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "totalScaledVariableDebt",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "priceInMarketReferenceCurrency",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "priceOracle",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "variableRateSlope1",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "variableRateSlope2",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "baseVariableBorrowRate",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "optimalUsageRatio",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "isPaused",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "isSiloedBorrowing",
          "type": "bool"
        },
        {
          "internalType": "uint128",
          "name": "accruedToTreasury",
          "type": "uint128"
        },
        {
          "internalType": "uint128",
          "name": "unbacked",
          "type": "uint128"
        },
        {
          "internalType": "uint128",
          "name": "isolationModeTotalDebt",
          "type": "uint128"
        },
        {
          "internalType": "bool",
          "name": "flashLoanEnabled",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "debtCeiling",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "debtCeilingDecimals",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "borrowCap",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "supplyCap",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "borrowableInIsolation",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "virtualAccActive",
          "type": "bool"
        },
        {
          "internalType": "uint128",
          "name": "virtualUnderlyingBalance",
          "type": "uint128"
        }
      ],
      "internalType": "struct IUiPoolDataProviderV3.AggregatedReserveData[]",
      "name": "",
      "type": "tuple[]"
    },
    {
      "components": [
        {
          "internalType": "uint256",
          "name": "marketReferenceCurrencyUnit",
          "type": "uint256"
        },
        {
          "internalType": "int256",
          "name": "marketReferenceCurrencyPriceInUsd",
          "type": "int256"
        },
        {
          "internalType": "int256",
          "name": "networkBaseTokenPriceInUsd",
          "type": "int256"
        },
        {
          "internalType": "uint8",
          "name": "networkBaseTokenPriceDecimals",
          "type": "uint8"
        }
      ],
      "internalType": "struct IUiPoolDataProviderV3.BaseCurrencyInfo",
      "name": "",
      "type": "tuple"
    }
  ],
  "stateMutability": "view",
  "type": "function"
}


GET_ASSET_PRICE_ABI = {
    "inputs": [{"internalType": "address", "name": "asset", "type": "address"}],
    "name": "getAssetPrice",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function",
}

class AaveLiquidationAnalyzer:
    def __init__(self, chain_id: int = 1):
        """
        Initialize the analyzer with RPC connection

        Args:
            chain_id: Chain ID (1 for mainnet, 137 for Polygon, etc.)
        """
        self.rpc_urls = {
            1: "https://ethereum.blockpi.network/v1/rpc/85461383f782dd69cdba6ec4fb8cb52bf7c06aab",
            137: "https://polygon.blockpi.network/v1/rpc/ea47c8a6ff881200f48a4e1e1c4f93e424730cb7",
            42161: "https://arbitrum.blockpi.network/v1/rpc/c41b70d95f97f22e121c8a2ad569479de6b254a9",
            43114: "https://avalanche.blockpi.network/v1/rpc/5f177cc088522e4e94be242f74368ff9c7644b01",
            10: "https://optimism.blockpi.network/v1/rpc/12c72e6c551918922e82fb0cb088cc427f85ce67",
            100: "https://gnosis.blockpi.network/v1/rpc/627d0c7e00b8ce88f62b3631d98931fb3c70bd43",
            999: "http://65.21.85.180:8545"
        }

        self.reserves_data_cache = {}
        load_dotenv('.env.local')
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_urls[chain_id]))
        self.w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
        self.chain_id = chain_id
        self.pool_addresses = {
            1: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",  # Ethereum
            137: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",  # Polygon
            43114: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",  # Avalanche
            42161: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",  # Arbitrum
            10: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",  # Optimism
            100: "0xb50201558b00496a145fe76f7424749556e326d8",  # Gnosis
            999: "0xceCcE0EB9DD2Ef7996e01e25DD70e461F918A14b"
        }

        self.database_url = os.getenv('DATABASE_URL')
        if not self.database_url:
            print("Warning: DATABASE_URL not set in .env.local. DB functions will fail.")

        self.pool_address = self.pool_addresses.get(chain_id)
        if not self.pool_address:
            raise ValueError(f"Unsupported chain ID: {chain_id}")

        # Create contract instance for event decoding
        self.pool_contract = self.w3.eth.contract(
            address=self.w3.to_checksum_address(self.pool_address),
            abi=[LIQUIDATION_CALL_EVENT_ABI, GET_USER_ACCOUNT_DATA_ABI]
        )

        self.ui_pool_data_provider_contract = self.w3.eth.contract(
            address=self.w3.to_checksum_address(UI_POOL_DATA_PROVIDER),
            abi=[GET_RESERVES_DATA_ABI]
        )

        self.fetch_all_reserves_data()

        self.provider_contract = self.w3.eth.contract(
            address=self.w3.to_checksum_address(POOL_DATA_PROVIDER),
            abi=[GET_PRICE_ORACLE_ABI]
        )

        self.price_oracle_address = self.provider_contract.functions.getPriceOracle().call()

        self.price_oracle_contract = self.w3.eth.contract(
            address=self.w3.to_checksum_address(self.price_oracle_address),
            abi=[GET_ASSET_PRICE_ABI]
        )

    def fetch_all_reserves_data(self):
        try:
            reserves_data = self.ui_pool_data_provider_contract.functions.getReservesData(
                self.w3.to_checksum_address(POOL_DATA_PROVIDER)
            ).call()

            reserves_list = reserves_data[0]

            for reserve in reserves_list:
                asset_address = reserve[0]
                asset_symbol = reserve[2]
                asset_decimals = reserve[3]

                print(f"Found: {asset_symbol} (Decimals: {asset_decimals}) at {asset_address}")
                
                self.reserves_data_cache[asset_address.lower()] = {
                    "symbol": asset_symbol,
                    "decimals": asset_decimals
                }
        except Exception as e:
            with open('reserves_error.log', 'w') as f:
                f.write(f"Error fetching reserves data:\n")
                f.write(f"Exception type: {type(e).__name__}\n")
                f.write(f"Exception message: {str(e)}\n\n")
                f.write("Full traceback:\n")
                traceback.print_exc(file=f)

            error_msg = str(e)
            if len(error_msg) > 200:
                error_msg = error_msg[:200] + "... (see reserves_error.log for full details)"

            print(f"✗ Error fetching reserves data: {error_msg}")
            print(f"  Full error written to: reserves_error.log")
            exit()

    def fetch_liquidations_from_db(self, limit: int = 5) -> List[Dict]:
        """
        Fetch pending liquidations from the Ponder Postgres database
        """
        if not self.database_url:
            print("Error: DATABASE_URL is not configured.")
            return []

        formatted_events = []
        conn = None
        try:
            conn = psycopg2.connect(self.database_url)
            with conn.cursor() as cur:
                cur.execute("SET search_path TO public")

            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT * FROM "LiquidationCall"
                    WHERE analysis_status = 'PENDING' OR analysis_status IS NULL
                    ORDER BY "block_number" ASC
                    LIMIT %s
                """, (limit,))

                records = cur.fetchall()

            if not records:
                return []

            # Format the DB records to match what analyze_liquidation_timeline expects
            for record in records:
                formatted_events.append({
                    'tx_hash': record['transaction_hash'],
                    'block_number': int(record['block_number']),
                    'user_address': record['user'],
                    'collateral_asset': record['collateral_asset'],
                    'debt_asset': record['debt_asset'],
                    'debt_covered': int(record['debt_to_cover']),
                    'liquidated_collateral_amount': int(record['liquidated_collateral_amount']),
                    'liquidator': record['liquidator'],
                    'receive_atoken': record.get('receiveAToken'), # Use .get() for safety
                    # 'liquidation_time': datetime.fromtimestamp(record['blockTimestamp'])
                })
            return formatted_events

        except Exception as e:
            print(f"Error fetching from database: {e}")
            traceback.print_exc()
            return []
        finally:
            if conn:
                conn.close()

    def update_liquidation_analysis(self, tx_hash: str, analysis_result: Dict) -> bool:
        """
        Update the liquidation record with analysis results
        """
        if not self.database_url:
            print("Error: DATABASE_URL is not configured.")
            return False

        conn = None
        try:
            conn = psycopg2.connect(self.database_url)
            with conn.cursor() as cur:
                cur.execute("SET search_path TO public")

                # Update the liquidation record with analysis data
                cur.execute("""
                    UPDATE "LiquidationCall"
                    SET
                        analysis_status = %s,
                        first_liquidatable_block = %s,
                        first_liquidatable_time = %s,
                        latency_seconds = %s,
                        blocks_liquidatable = %s,
                        collateral_symbol = %s,
                        collateral_decimals = %s,
                        collateral_price_usd = %s,
                        debt_symbol = %s,
                        debt_decimals = %s,
                        debt_price_usd = %s
                    WHERE transaction_hash = %s
                """, (
                    'ANALYZED',
                    analysis_result.get('first_liquidatable_block'),
                    analysis_result.get('first_liquidatable_time'),
                    int(analysis_result.get('time_liquidatable').total_seconds()) if analysis_result.get('time_liquidatable') else None,
                    analysis_result.get('blocks_liquidatable'),

                    analysis_result.get('collateral_symbol'),
                    analysis_result.get('collateral_decimals'),
                    analysis_result.get('collateral_price_usd'),
                    analysis_result.get('debt_symbol'),
                    analysis_result.get('debt_decimals'),
                    analysis_result.get('debt_price_usd'),
                    tx_hash
                ))

                conn.commit()
                print(f"✓ Updated analysis for tx: {tx_hash}")
                return True

        except Exception as e:
            print(f"Error updating database for tx {tx_hash}: {e}")
            traceback.print_exc()
            if conn:
                conn.rollback()
            return False
        finally:
            if conn:
                conn.close()

    def mark_liquidation_failed(self, tx_hash: str, error_message: str) -> bool:
        """
        Mark a liquidation analysis as failed
        """
        if not self.database_url:
            print("Error: DATABASE_URL is not configured.")
            return False

        conn = None
        try:
            conn = psycopg2.connect(self.database_url)
            with conn.cursor() as cur:
                cur.execute("SET search_path TO public")

                cur.execute("""
                    UPDATE "LiquidationCall"
                    SET
                        analysis_status = %s
                    WHERE transaction_hash = %s
                """, (
                    'FAILED',
                    tx_hash
                ))

                conn.commit()
                print(f"✓ Marked tx as failed: {tx_hash}")
                return True

        except Exception as e:
            print(f"Error marking tx as failed {tx_hash}: {e}")
            traceback.print_exc()
            if conn:
                conn.rollback()
            return False
        finally:
            if conn:
                conn.close()

    def find_latest_liquidation_events(self, max_blocks_to_search: int = 500000,
                                       chunk_size: int = 10000, n_events: int = 5) -> List[Dict]:
        """
        Find the latest liquidation events by searching backwards from the latest block

        Args:
            max_blocks_to_search: Maximum number of blocks to search backwards
            chunk_size: Number of blocks to search in each chunk

        Returns:
            List of liquidation events found
        """
        latest_block = self.w3.eth.block_number
        print(f"Latest block: {latest_block}")
        print(f"Searching for liquidation events in chunks of {chunk_size} blocks...")

        all_events = []

        # Search backwards in chunks
        for start_offset in range(0, max_blocks_to_search, chunk_size):
            to_block = latest_block - start_offset
            from_block = max(1, to_block - chunk_size + 1)

            print(f"Searching blocks {from_block} to {to_block}...")

            try:
                events = self.fetch_liquidations_from_db()
                if events:
                    print(f"Found {len(events)} liquidation events in blocks {from_block}-{to_block}")

                    # Process events and add block info
                    for event_data in events:
                        block = self.w3.eth.get_block(event_data['block_number'])
                        event_data['timestamp'] = block.timestamp
                        event_data['liquidation_time'] = datetime.fromtimestamp(block.timestamp)

                        all_events.append(event_data)

                time.sleep(0.1)
                if all_events and len(all_events) >= n_events:
                    print(f"Found {len(all_events)} events, stopping search.")
                    break

            except Exception as e:
                traceback.print_exc()
                print(f"Error searching blocks {from_block}-{to_block}: {e}")
                continue

        # Sort events by block number (most recent first)
        all_events.sort(key=lambda x: x['block_number'], reverse=True)

        return all_events

    def get_user_account_data_at_block(self, user_address: str, block_number: int) -> Dict:
        """
        Get user account data at a specific block using the ABI
        """
        try:
            result = self.pool_contract.functions.getUserAccountData(
                self.w3.to_checksum_address(user_address)
            ).call(
                block_identifier=block_number
            )

            # Unpack the tuple result
            (total_collateral, total_debt, available_borrows,
             liquidation_threshold, ltv, health_factor) = result

            # Health factor is in 18 decimals, convert to float
            health_factor_float = health_factor / 1e18 if health_factor > 0 else 0

            return {
                'total_collateral': total_collateral / 1e8,  # Base currency (USD) with 8 decimals
                'total_debt': total_debt / 1e8,
                'available_borrows': available_borrows / 1e8,
                'liquidation_threshold': liquidation_threshold / 100,  # Convert from basis points
                'ltv': ltv / 100,
                'health_factor': health_factor_float,
                'block_number': block_number
            }
        except Exception as e:
            traceback.print_exc()
            print(f"Error getting account data at block {block_number}: {e}")
            return None

    def binary_search_liquidatable_block(self, user_address: str, liquidation_block: int,
                                         search_blocks_back: int = 10000) -> Optional[int]:
        """
        Use binary search to find the first block where health factor < 1.0
        """
        start_block = max(1, liquidation_block - search_blocks_back)
        end_block = liquidation_block
        first_liquidatable_block = None

        print(f"Searching for first liquidatable block between {start_block} and {end_block}")

        while start_block <= end_block:
            mid_block = (start_block + end_block) // 2
            account_data = self.get_user_account_data_at_block(user_address, mid_block)

            if account_data is None:
                print('WARN: couldnt fetch account data')
                start_block = mid_block + 1
                continue

            health_factor = account_data['health_factor']
            print(f"Block {mid_block}: Health Factor = {health_factor:.4f}")

            if health_factor < 1.0:
                first_liquidatable_block = mid_block
                end_block = mid_block - 1
            else:
                start_block = mid_block + 1

            # Small delay to avoid rate limiting
            time.sleep(0.1)
        print('first', first_liquidatable_block)
        return first_liquidatable_block if first_liquidatable_block else liquidation_block

    def get_block_timestamp(self, block_number: int) -> datetime:
        """
        Get timestamp for a block
        """
        block = self.w3.eth.get_block(block_number)
        return datetime.fromtimestamp(block.timestamp)

    def analyze_liquidation_timeline(self, liquidation_event: Dict, search_blocks_back: int = 10000) -> Dict:
        """
        Analyze how long a position was liquidatable for a given liquidation event

        Args:
            liquidation_event: Event data from find_latest_liquidation_events
            search_blocks_back: How many blocks to search back for first liquidatable block
        """
        print(f"\nAnalyzing liquidation transaction: {liquidation_event['tx_hash']}")
        print(f"User: {liquidation_event['user_address']}")
        print(f"Liquidation block: {liquidation_event['block_number']}")
        print(f"Liquidation time: {liquidation_event['liquidation_time']}")

        historical_block = liquidation_event['block_number']

        raw_collateral_price = self.price_oracle_contract.functions.getAssetPrice(
            self.w3.to_checksum_address(liquidation_event['collateral_asset'])
        ).call(block_identifier=historical_block)

        raw_debt_price = self.price_oracle_contract.functions.getAssetPrice(
            self.w3.to_checksum_address(liquidation_event['debt_asset'])
        ).call(block_identifier=historical_block)

        collateral_price_usd = raw_collateral_price / (10**8)
        debt_price_usd = raw_debt_price / (10**8)
        
        collateral_info = self.reserves_data_cache.get(liquidation_event['collateral_asset'].lower(), {})
        debt_info = self.reserves_data_cache.get(liquidation_event['debt_asset'].lower(), {})

        collateral_decimals = collateral_info.get('decimals')
        collateral_symbol = collateral_info.get('symbol')
        debt_decimals = debt_info.get('decimals')
        debt_symbol = debt_info.get('symbol')
        
        # Find first block where position became liquidatable
        first_liquidatable_block = self.binary_search_liquidatable_block(
            liquidation_event['user_address'],
            liquidation_event['block_number'],
            search_blocks_back
        )


        if first_liquidatable_block:
            first_liquidatable_time = self.get_block_timestamp(first_liquidatable_block)
            time_liquidatable = liquidation_event['liquidation_time'] - first_liquidatable_time
            blocks_liquidatable = liquidation_event['block_number'] - first_liquidatable_block

            result = {
                'liquidation_tx': liquidation_event['tx_hash'],
                'user_address': liquidation_event['user_address'],
                'liquidation_block': liquidation_event['block_number'],
                'liquidation_time': liquidation_event['liquidation_time'],
                'first_liquidatable_block': first_liquidatable_block,
                'first_liquidatable_time': first_liquidatable_time,
                'time_liquidatable': time_liquidatable,
                'blocks_liquidatable': blocks_liquidatable,
                'collateral_asset': liquidation_event['collateral_asset'],
                'collateral_symbol': collateral_symbol,
                'collateral_decimals': collateral_decimals,
                'collateral_price_usd': collateral_price_usd,
                'debt_asset': liquidation_event['debt_asset'],
                'debt_covered': liquidation_event['debt_covered'],
                'debt_symbol': debt_symbol,
                'debt_decimals': debt_decimals,
                'debt_price_usd': debt_price_usd,
                'liquidated_collateral_amount': liquidation_event['liquidated_collateral_amount'],
            }

            print("\n=== RESULTS ===")
            print(f"Position became liquidatable at block: {first_liquidatable_block}")
            print(f"First liquidatable time: {first_liquidatable_time}")
            print(f"Liquidation occurred at block: {liquidation_event['block_number']}")
            print(f"Liquidation time: {liquidation_event['liquidation_time']}")
            print(f"Position was liquidatable for: {time_liquidatable}")
            print(f"Blocks liquidatable: {blocks_liquidatable}")

            return result
        else:
            return {"error": "Could not find when position became liquidatable"}

    def analyze_latest_liquidations(self, num_liquidations: int = 5) -> List[Dict]:
        """
        Find and analyze the latest liquidations automatically

        Args:
            num_liquidations: Number of latest liquidations to analyze
        """
        print("=== FINDING LATEST LIQUIDATION EVENTS ===")

        # Find latest liquidation events
        events = self.find_latest_liquidation_events(n_events=num_liquidations)

        if not events:
            print("No liquidation events found!")
            return []

        print(f"\nFound {len(events)} liquidation events")
        print("=== ANALYZING LIQUIDATION TIMELINES ===")

        results = []

        # Analyze up to num_liquidations events
        for i, event in enumerate(events[:num_liquidations]):
            print(f"\n--- Analyzing Liquidation {i + 1}/{min(num_liquidations, len(events))} ---")

            try:
                result = self.analyze_liquidation_timeline(event)
                if "error" not in result:
                    results.append(result)
                    print(f"✓ Analysis complete for tx: {event['tx_hash']}")

                    self.update_liquidation_analysis(event['tx_hash'], result)
                else:
                    traceback.print_exc()
                    print(f"✗ Error analyzing tx {event['tx_hash']}: {result['error']}")

                    self.mark_liquidation_failed(event['tx_hash'], result['error'])
            except Exception as e:
                traceback.print_exc()
                print(f"✗ Exception analyzing tx {event['tx_hash']}: {e}")
                self.mark_liquidation_failed(event['tx_hash'], str(e))
                continue

        return results


def main():

    CHAIN_ID = int(os.getenv('CHAIN_ID', '1'))  # Default to Ethereum mainnet
    BATCH_SIZE = int(os.getenv('BATCH_SIZE', '100'))
    SEARCH_BLOCKS_BACK = int(os.getenv('SEARCH_BLOCKS_BACK', '50000'))
    LOOP_INTERVAL = int(os.getenv('LOOP_INTERVAL', '60'))
    RUN_ONCE = os.getenv('RUN_ONCE', 'false').lower() == 'true'
    print("Configuration:")
    print(f"  Chain ID: {CHAIN_ID}")
    print(f"  Batch Size: {BATCH_SIZE}")
    print(f"  Search Blocks Back: {SEARCH_BLOCKS_BACK}")
    print(f"  Loop Interval: {LOOP_INTERVAL} seconds")
    print(f"  Run Once: {RUN_ONCE}")

    try:
        analyzer = AaveLiquidationAnalyzer(CHAIN_ID)

        iteration = 0
        while True:
            iteration += 1
            print(f"\n{'='*60}")
            print(f"=== ITERATION {iteration} - {datetime.now()} ===")
            print(f"{'='*60}\n")

            # Analyze pending liquidations from database
            results = analyzer.analyze_latest_liquidations(
                num_liquidations=BATCH_SIZE,
            )

            print("\n=== ITERATION SUMMARY ===")
            print(f"Analyzed {len(results)} liquidations successfully:")

            for i, result in enumerate(results, 1):
                print(f"\nLiquidation {i}:")
                print(f"  TX: {result['liquidation_tx']}")
                print(f"  User: {result['user_address']}")
                print(f"  Time liquidatable: {result['time_liquidatable']}")
                print(f"  Blocks liquidatable: {result['blocks_liquidatable']}")

            if not results:
                print("No liquidations were successfully analyzed.")

            if RUN_ONCE:
                print("\nRUN_ONCE is enabled, exiting...")
                break

            print(f"\nSleeping for {LOOP_INTERVAL} seconds before next iteration...")
            time.sleep(LOOP_INTERVAL)

    except KeyboardInterrupt:
        print("\n\nReceived interrupt signal, shutting down gracefully...")
    except Exception as e:
        print(f"Error: {e}")
        traceback.print_exc()


if __name__ == "__main__":
    main()
