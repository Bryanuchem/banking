import argparse
import json

from pathlib import Path
import sys

BACKEND_DIR = Path(__file__).resolve().parents[1]

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


from app.constants.setting_definition import DEFINITIONS_BY_KEY
# other app imports...
from app.constants.setting_definition import DEFINITIONS_BY_KEY
from app.database.session import SessionLocal
from app.services.setting_service import SettingService


def parse_value(raw: str, value_type: str):
    if value_type == "boolean":
        value = raw.strip().lower()
        if value not in {"true", "false", "1", "0", "yes", "no", "on", "off"}:
            raise ValueError("Boolean value must be true/false, yes/no, on/off, or 1/0.")
        return value in {"true", "1", "yes", "on"}
    if value_type == "number":
        return int(raw)
    if value_type == "json":
        return json.loads(raw)
    return raw


def main() -> None:
    parser = argparse.ArgumentParser(description="Set a database-backed Banking setting.")
    parser.add_argument("key")
    parser.add_argument("value")
    args = parser.parse_args()

    definition = DEFINITIONS_BY_KEY.get(args.key)
    if definition is None:
        raise SystemExit(f"Unknown setting: {args.key}")

    value = parse_value(args.value, definition.value_type)
    with SessionLocal() as db:
        SettingService.set(db, args.key, value)
    print(f"Updated {args.key}.")


if __name__ == "__main__":
    main()
