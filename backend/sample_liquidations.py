"""
Script to export 500 rows from the liquidation analysis table to a JSON file.
This data will be used by the frontend instead of making API calls.
"""
import json
import os
import psycopg2
from psycopg2 import sql
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
import config
from datetime import datetime, date

load_dotenv()

def json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")

def export_liquidations():
    """Export 500 liquidation records to JSON file"""
    conn = None
    try:
        print("🔌 Connecting to database...")
        conn = psycopg2.connect(config.DATABASE_URL)

        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Get total count of records with analysis data
            print("📊 Getting count of records with analysis data...")
            cur.execute(
                sql.SQL("""
                    SELECT COUNT(*) as count
                    FROM {}.{} lc
                    INNER JOIN {}.{} la ON lc.id = la.id
                    WHERE la.latency_seconds IS NOT NULL
                """).format(
                    sql.Identifier(config.DATABASE_SCHEMA),
                    sql.Identifier('LiquidationCall'),
                    sql.Identifier(config.DATABASE_SCHEMA),
                    sql.Identifier('LiquidationAnalysis')
                )
            )
            total_count = cur.fetchone()['count']
            print(f"✓ Total liquidations with analysis data: {total_count}")

            # Fetch all records with completed analysis (no limit)
            print("📥 Fetching all liquidation records with analysis data...")
            cur.execute(
                sql.SQL("""
                    SELECT
                        lc.id,
                        lc."user_address" as "user",
                        lc.liquidator,
                        lc.collateral_asset,
                        lc.debt_asset,
                        lc.debt_to_cover,
                        lc.liquidated_collateral_amount,
                        lc.block_timestamp,
                        la.latency_seconds,
                        la.collateral_symbol,
                        la.collateral_decimals,
                        la.collateral_price_usd,
                        la.debt_symbol,
                        la.debt_decimals,
                        la.debt_price_usd
                    FROM {}.{} lc
                    INNER JOIN {}.{} la ON lc.id = la.id
                    WHERE la.latency_seconds IS NOT NULL
                    ORDER BY lc.block_timestamp DESC
                """).format(
                    sql.Identifier(config.DATABASE_SCHEMA),
                    sql.Identifier('LiquidationCall'),
                    sql.Identifier(config.DATABASE_SCHEMA),
                    sql.Identifier('LiquidationAnalysis')
                )
            )

            records = cur.fetchall()
            liquidations = [dict(record) for record in records]

            print(f"✓ Fetched {len(liquidations)} records")

            # Create output data structure
            output_data = {
                'data': liquidations,
                'totalCount': total_count,
                'limit': len(liquidations),
                'offset': 0,
                'exportedAt': datetime.now().isoformat()
            }

            # Determine output path
            # Go up one level from backend, then into frontend/public
            backend_dir = os.path.dirname(os.path.abspath(__file__))
            project_root = os.path.dirname(backend_dir)
            frontend_public_dir = os.path.join(project_root, 'frontend', 'public')

            # Create public directory if it doesn't exist
            os.makedirs(frontend_public_dir, exist_ok=True)

            output_file = os.path.join(frontend_public_dir, 'liquidations-data.json')

            # Write to JSON file
            print(f"💾 Writing data to {output_file}...")
            with open(output_file, 'w') as f:
                json.dump(output_data, f, indent=2, default=json_serial)

            print(f"✅ Successfully exported {len(liquidations)} liquidation records to {output_file}")
            print(f"📦 File size: {os.path.getsize(output_file) / 1024:.2f} KB")

    except Exception as e:
        print(f"❌ Error exporting liquidations: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if conn:
            conn.close()
            print("🔌 Connection closed.")

if __name__ == "__main__":
    print("=== Starting Liquidation Data Export ===")
    export_liquidations()
    print("\n✅ Export complete!")
