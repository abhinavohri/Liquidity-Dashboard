import psycopg2
from psycopg2 import sql
import config
import traceback
import argparse
import sys

def init_db(reset_table=False):
    conn = None
    try:
        print(f"🔌 Connecting to database at {config.DATABASE_URL}...")
        conn = psycopg2.connect(config.DATABASE_URL)
        
        with conn.cursor() as cur:
            print(f"Checking schema '{config.DATABASE_SCHEMA}'...")
            cur.execute(
                sql.SQL("CREATE SCHEMA IF NOT EXISTS {}").format(
                    sql.Identifier(config.DATABASE_SCHEMA)
                )
            )

            if reset_table:
                print("⚠️  RESET FLAG DETECTED: Dropping existing 'LiquidationAnalysis' table...")
                cur.execute(
                    sql.SQL("DROP TABLE IF EXISTS {}.{}").format(
                        sql.Identifier(config.DATABASE_SCHEMA),
                        sql.Identifier("LiquidationAnalysis"),
                    )
                )
                print("✓ Table dropped.")

            print("Checking table 'LiquidationAnalysis'...")
            cur.execute(
                sql.SQL("""
                    CREATE TABLE IF NOT EXISTS {}.{} (
                        id TEXT PRIMARY KEY,
                        first_liquidatable_block BIGINT,
                        first_liquidatable_time TIMESTAMP,
                        latency_seconds INTEGER,
                        blocks_liquidatable BIGINT,
                        collateral_symbol TEXT,
                        collateral_decimals INTEGER,
                        collateral_price_usd REAL,
                        debt_symbol TEXT,
                        debt_decimals INTEGER,
                        debt_price_usd REAL,
                        analysis_status TEXT DEFAULT 'PENDING',
                        error_message TEXT 
                    )
                """).format(
                    sql.Identifier(config.DATABASE_SCHEMA),
                    sql.Identifier("LiquidationAnalysis"),
                )
            )
            
            conn.commit()
            print("✓ LiquidationAnalysis table ready (Schema matched)")

    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        traceback.print_exc()
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()
            print("🔌 Connection closed.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Setup the Ponder Liquidation Analysis database.')
    parser.add_argument('--reset', action='store_true', help='Danger: Drops the existing table and recreates it.')
    
    args = parser.parse_args()

    print("=== Starting Database Setup ===")
    init_db(reset_table=args.reset)
    print("\n✅ Database initialization script finished successfully.")