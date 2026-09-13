from pathlib import Path
import sys

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.database.session import SessionLocal
from app.services.reconciliation_service import ReconciliationService


def main() -> None:
    with SessionLocal() as db:
        summary = ReconciliationService.all_accounts(db)
        print(f"Checked: {summary['checked']}")
        print(f"Mismatched: {summary['mismatched']}")
        for item in summary["results"]:
            if not item["available_matches"] or not item["held_matches"]:
                print(
                    f"MISMATCH {item['account_number']}: "
                    f"available={item['actual_available_balance']} expected={item['expected_available_balance']} "
                    f"held={item['actual_held_balance']} expected_held={item['expected_held_balance']}"
                )
        if summary["mismatched"]:
            raise SystemExit(1)


if __name__ == "__main__":
    main()
