import os
import json
from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv('.env.local')

app = Flask(__name__)
CORS(app)

DATABASE_URL = os.getenv('DATABASE_URL')
DATABASE_SCHEMA = os.getenv('DATABASE_SCHEMA', 'ponder')

def get_db_connection():
    return psycopg2.connect(DATABASE_URL)

@app.route('/api/liquidations', methods=['GET'])
def get_liquidations():
    """
    Get liquidations with analysis data joined
    Query params:
        - limit: number of records (default 10)
        - offset: pagination offset (default 0)
    """
    limit = request.args.get('limit', 10, type=int)
    offset = request.args.get('offset', 0, type=int)

    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(f"SET search_path TO {DATABASE_SCHEMA}")

            # Get total count
            cur.execute('SELECT COUNT(*) as count FROM "LiquidationCall"')
            total_count = cur.fetchone()['count']

            # Get paginated data with LEFT JOIN to include records without analysis
            cur.execute("""
                SELECT
                    lc.id,
                    lc."user",
                    lc.liquidator,
                    lc.collateral_asset,
                    lc.debt_asset,
                    lc.debt_to_cover,
                    lc.liquidated_collateral_amount,
                    lc.block_timestamp,
                    lc.block_number::text as block_number,
                    lc.transaction_hash,
                    lc.analysis_status,
                    la.first_liquidatable_block::text as first_liquidatable_block,
                    la.first_liquidatable_time,
                    la.latency_seconds,
                    la.blocks_liquidatable::text as blocks_liquidatable,
                    la.collateral_symbol,
                    la.collateral_decimals,
                    la.collateral_price_usd,
                    la.debt_symbol,
                    la.debt_decimals,
                    la.debt_price_usd
                FROM "LiquidationCall" lc
                LEFT JOIN "LiquidationAnalysis" la ON lc.id = la.id
                ORDER BY lc.block_timestamp DESC
                LIMIT %s OFFSET %s
            """, (limit, offset))

            records = cur.fetchall()

            # Convert to JSON-serializable format
            liquidations = []
            for record in records:
                liq = dict(record)
                # Handle timestamp conversion
                if liq.get('first_liquidatable_time'):
                    liq['first_liquidatable_time'] = liq['first_liquidatable_time'].isoformat()
                liquidations.append(liq)

            return jsonify({
                'data': liquidations,
                'totalCount': total_count,
                'limit': limit,
                'offset': offset
            })

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    port = int(os.getenv('API_PORT', 5001))
    debug = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'

    print(f"Starting API server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)
