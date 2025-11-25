import os
from dotenv import load_dotenv

load_dotenv()

RPC_URL_ETHEREUM = os.getenv("RPC_URL_ETHEREUM")
DATABASE_URL = os.getenv("DATABASE_URL")
DATABASE_SCHEMA = os.getenv("DATABASE_SCHEMA", "ponder")

CHAIN_ID = int(os.getenv("CHAIN_ID", "1"))
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "100"))
SEARCH_BLOCKS_BACK = int(os.getenv("SEARCH_BLOCKS_BACK", "50000"))
LOOP_INTERVAL = int(os.getenv("LOOP_INTERVAL", "10"))
MAX_WORKERS = int(os.getenv("MAX_WORKERS", "5"))

if not RPC_URL_ETHEREUM:
    print("⚠️ WARNING: RPC_URL_ETHEREUM missing")

if not DATABASE_URL:
    print("Missing DATABASE_URL in environment")
