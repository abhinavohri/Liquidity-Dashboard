import os
import time
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware
from typing import Dict, Optional
import traceback
import sys

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


class LiquidationWorker:
    def __init__(self, chain_id: int = 1):
        """Initialize the worker with database and RPC connections"""
        # Load configuration from environment variables
        self.database_url = os.getenv('DATABASE_URL')
        if not self.database_url:
            raise ValueError("DATABASE_URL environment variable is required")
            
        self.rpc_url = os.getenv('PONDER_RPC_URL_1')
        if not self.rpc_url:
            raise ValueError("RPC_URL environment variable is required")
            
        self.chain_id = chain_id

        
        # Setup Web3
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        if chain_id in [137, 10, 42161, 100]:  # PoA chains
            self.w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
        
        # Aave v3 Pool addresses
        self.pool_addresses = {
            1: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",  # Ethereum
            137: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",  # Polygon
            43114: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",  # Avalanche
            42161: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",  # Arbitrum
            10: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",  # Optimism
            100: "0xb50201558b00496a145fe76f7424749556e326d8",  # Gnosis
            999: "0xceCcE0EB9DD2Ef7996e01e25DD70e461F918A14b"
        }

        self.pool_address = self.pool_addresses.get(chain_id)
        if not self.pool_address:
            raise ValueError(f"Unsupported chain ID: {chain_id}")

        # Create contract instance for event decoding
        self.pool_contract = self.w3.eth.contract(
            address=self.w3.to_checksum_address(self.pool_address),
            abi=[LIQUIDATION_CALL_EVENT_ABI, GET_USER_ACCOUNT_DATA_ABI]
        )
        
        print(f"✓ Worker initialized for chain {chain_id}")
        print(f"✓ Pool address: {self.pool_address}")

    def get_db_connection(self):
        """Get a database connection"""
        return psycopg2.connect(self.database_url, options="-c search_path=ponder_default")

    def fetch_pending_liquidations(self, limit: int = 10):
        """Fetch liquidations with PENDING analysis status"""
        conn = self.get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT * FROM "LiquidationCall"
                    WHERE analysis_status = 'PENDING' OR analysis_status IS NULL
                    ORDER BY block_number ASC
                    LIMIT %s
                """, (limit,))
                return cur.fetchall()
        finally:
            conn.close()

    def get_user_account_data_at_block(self, user_address: str, block_number: int) -> Optional[Dict]:
        """Get user account data at a specific block"""
        try:
            user_address = self.w3.to_checksum_address(user_address)
            result = self.pool_contract.functions.getUserAccountData(user_address).call(
                block_identifier=block_number
            )
            
            (total_collateral, total_debt, available_borrows,
             liquidation_threshold, ltv, health_factor) = result
            
            health_factor_float = health_factor / 1e18 if health_factor > 0 else 0

            # --- THIS IS THE 36-HOUR BUG FIX ---
            # If a user has no debt, their HF is "infinite", not 0.
            # A HF of 0 is only < 1.0 if total_debt is > 0.
            if total_debt == 0:
                health_factor_float = 999999999.0 # A very large number > 1.0
            
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
            print(f"Error getting account data at block {block_number}: {e}")
            return None

    def binary_search_liquidatable_block(self, user_address: str, liquidation_block: int,
                                        search_blocks_back: int = 10000) -> Optional[int]:
        """Binary search to find first block where health factor < 1.0"""
        start_block = max(1, liquidation_block - search_blocks_back)
        end_block = liquidation_block
        first_liquidatable_block = None

        while start_block <= end_block:
            mid_block = (start_block + end_block) // 2
            account_data = self.get_user_account_data_at_block(user_address, mid_block)

            if account_data is None:
                start_block = mid_block + 1
                continue

            health_factor = account_data['health_factor']
            print(f"Block {mid_block}: Health Factor = {health_factor:.4f}")

            if health_factor < 1.0:
                first_liquidatable_block = mid_block
                end_block = mid_block - 1 # Keep searching earlier
            else:
                start_block = mid_block + 1 # Search later
            
            time.sleep(0.1)  # Rate limiting
        
        return first_liquidatable_block

    def get_block_timestamp(self, block_number: int) -> datetime:
        """Get timestamp for a block"""
        block = self.w3.eth.get_block(block_number)
        return datetime.fromtimestamp(block.timestamp)

    def analyze_liquidation(self, liquidation_record: Dict) -> Optional[Dict]:
        """Analyze a single liquidation record"""
        print(f"\n  Analyzing liquidation: {liquidation_record['id']}")
        print(f"  User: {liquidation_record['user']}")
        print(f"  Block: {liquidation_record['block_number']}")
        
        try:
            # Find first liquidatable block
            first_liquidatable_block = self.binary_search_liquidatable_block(
                liquidation_record['user'],
                int(liquidation_record['block_number']),
                search_blocks_back=10000 # ~33 hours
            )
            
            # --- CRITICAL FIX ---
            # 'block_timestamp' from Postgres (via psycopg2) is ALREADY a datetime object.
            # We just use it directly.
            liquidation_time = liquidation_record['block_timestamp']

            if first_liquidatable_block:
                first_liquidatable_time = self.get_block_timestamp(first_liquidatable_block)
                
                time_liquidatable = liquidation_time - first_liquidatable_time
                blocks_liquidatable = int(liquidation_record['block_number']) - first_liquidatable_block
                
                result = {
                    'first_liquidatable_block': first_liquidatable_block,
                    'first_liquidatable_time': int(first_liquidatable_time.timestamp()),
                    'latency_seconds': int(time_liquidatable.total_seconds()), # Renamed from 'time_liquidatable_seconds'
                    'blocks_liquidatable': blocks_liquidatable
                }
                
                print(f"  ✓ Analysis Complete:")
                print(f"    Liquidation block: {liquidation_record['block_number']} ({liquidation_time})")
                print(f"    First liquidatable block: {first_liquidatable_block} ({first_liquidatable_time})")
                print(f"    Calculated Latency: {time_liquidatable}")
                                
                return result
            else:
                # This means HF was > 1.0 for all 10,000 blocks.
                # This implies a flash-liquidation or self-liquidation. Latency is 0.
                print(f"  ✓ Analysis Complete: Position was not liquidatable in search window. Assuming 0s latency.")
                return {
                    'first_liquidatable_block': liquidation_record['block_number'],
                    'first_liquidatable_time': int(liquidation_time.timestamp()),
                    'latency_seconds': 0,
                    'blocks_liquidatable': 0
                }
                
        except Exception as e:
            print(f"  ✗ Error analyzing liquidation: {e}")
            traceback.print_exc()
            return None

    def update_liquidation_analysis(self, liquidation_id: str, analysis_result: Optional[Dict]):
        """Update the database with analysis results"""
        
        # --- CRITICAL FIX ---
        # Removed all `ALTER TABLE` commands.
        # Ponder's schema migration (`ponder.schema.ts`) already did this.
        
        conn = self.get_db_connection()
        try:
            with conn.cursor() as cur:
                if analysis_result:
                    cur.execute("""
                        UPDATE "LiquidationCall"
                        SET analysis_status = 'COMPLETE',
                            first_liquidatable_block = %s,
                            first_liquidatable_timestamp = %s,
                            latency_seconds = %s,
                            blocks_liquidatable = %s
                        WHERE id = %s
                    """, (
                        analysis_result['first_liquidatable_block'],
                        analysis_result['first_liquidatable_time'],
                        analysis_result['latency_seconds'],
                        analysis_result['blocks_liquidatable'],
                        liquidation_id
                    ))
                else:
                    # Mark as failed
                    cur.execute("""
                        UPDATE "LiquidationCall"
                        SET analysis_status = 'FAILED'
                        WHERE id = %s
                    """, (liquidation_id,))
                
                conn.commit()
                print(f"  ✓ Database updated for {liquidation_id}")
                
        except Exception as e:
            conn.rollback()
            print(f"  ✗ Error updating database: {e}")
            traceback.print_exc()
        finally:
            conn.close()

    def process_batch(self, batch_size: int = 5):
        """Process a batch of pending liquidations"""
        liquidations = self.fetch_pending_liquidations(limit=batch_size)
        
        if not liquidations:
            print("No pending liquidations found")
            return 0
        
        print(f"\n=== Processing {len(liquidations)} liquidations ===")
        
        processed = 0
        for liquidation in liquidations:
            analysis_result = self.analyze_liquidation(liquidation)
            self.update_liquidation_analysis(liquidation['id'], analysis_result)
            processed += 1
            
            # Small delay between analyses to be kind to RPC
            time.sleep(1) 
        
        return processed

    def run_continuously(self, batch_size: int = 5, sleep_interval: int = 30):
        """Run the worker continuously"""
        print(f"\n=== Starting Liquidation Analysis Worker ===")
        print(f"Batch size: {batch_size}")
        print(f"Sleep interval: {sleep_interval}s")
        
        while True:
            try:
                processed = self.process_batch(batch_size)
                
                if processed == 0:
                    print(f"\nNo work to do. Sleeping for {sleep_interval}s...")
                else:
                    print(f"\n✓ Processed {processed} liquidations")
                    print(f"Sleeping for {sleep_interval}s...")
                
                time.sleep(sleep_interval)
                
            except KeyboardInterrupt:
                print("\n\nShutting down worker...")
                break
            except Exception as e:
                print(f"\n✗ Unexpected error: {e}")
                traceback.print_exc()
                print(f"Sleeping for {sleep_interval}s before retry...")
                time.sleep(sleep_interval)


def main():
    # Load configuration from environment variables

    CHAIN_ID = int(os.getenv('CHAIN_ID', '1')) # Default to Ethereum
    BATCH_SIZE = int(os.getenv('BATCH_SIZE', '5'))
    SLEEP_INTERVAL = int(os.getenv('SLEEP_INTERVAL', '30'))
    
    
    # Initialize and run worker
    worker = LiquidationWorker(CHAIN_ID)
    worker.run_continuously(batch_size=BATCH_SIZE, sleep_interval=SLEEP_INTERVAL)


if __name__ == "__main__":
    main()