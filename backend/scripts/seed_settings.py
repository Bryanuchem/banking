from pathlib import Path
import sys

BACKEND_DIR = Path(__file__).resolve().parents[1]

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


from app.constants.setting_definition import DEFINITIONS_BY_KEY

from app.database.session import SessionLocal
from app.services.setting_service import SettingService


def main() -> None:
    with SessionLocal() as db:
        created = SettingService.ensure_defaults(db)
        print(f"Settings ready. Created {created} missing rows.")


if __name__ == "__main__":
    main()
