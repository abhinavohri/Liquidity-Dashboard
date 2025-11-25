import os
import json
from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
from psycopg2 import sql
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from backend import config

load_dotenv()

app = Flask(__name__)
CORS(app)

def get_db_connection():
    return psycopg2.connect(config.DATABASE_URL)

@app.route('/liquidations', methods=['GET'])
def get_liquidations():
    limit = request.args.get('limit', 10, type=int)
    offset = request.args.get('offset', 0, type=int)

    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                sql.SQL('SELECT COUNT(*) as count FROM {}.{}').format(
                    sql.Identifier(config.DATABASE_SCHEMA),
                    sql.Identifier('LiquidationCall')
                )
            )
            total_count = cur.fetchone()['count']

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
                    LEFT JOIN {}.{} la ON lc.id = la.id
                    ORDER BY lc.block_timestamp DESC
                    LIMIT %s OFFSET %s
                """).format(
                    sql.Identifier(config.DATABASE_SCHEMA),
                    sql.Identifier('LiquidationCall'),
                    sql.Identifier(config.DATABASE_SCHEMA),
                    sql.Identifier('LiquidationAnalysis')
                ),
                (limit, offset)
            )

            records = cur.fetchall()
            liquidations = [dict(record) for record in records]

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


if __name__ == '__main__':
    port = int(os.getenv('API_PORT', 5001))
    debug = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'

    app.run(host='0.0.0.0', port=port, debug=debug)
