from check import AaveLiquidationAnalyzer
import config
import time
import traceback
from datetime import datetime

def main():
    try:
        analyzer = AaveLiquidationAnalyzer(config.CHAIN_ID)

        iteration = 0
        while True:
            iteration += 1
            print(f"\n{'=' * 60}")
            print(f"=== ITERATION {iteration} - {datetime.now()} ===")
            print(f"{'=' * 60}\n")

            results = analyzer.analyze_latest_liquidations(
                num_liquidations=config.BATCH_SIZE,
                max_workers=config.MAX_WORKERS,
            )

            if not results:
                print("No liquidations were successfully analyzed.")
            else:
                print(f"✅ Batch finished. Processed {len(results)} liquidations.")

            print(f"\nSleeping for {config.LOOP_INTERVAL} seconds before next iteration...")
            time.sleep(config.LOOP_INTERVAL)

    except Exception as e:
        print(f"Error: {e}")
        traceback.print_exc()


if __name__ == "__main__":
    main()