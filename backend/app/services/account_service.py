import secrets
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.constants.setting_key import SettingKeys
from app.models.account import Account
from app.models.user import User
from app.services.setting_service import SettingService


class AccountService:
    @staticmethod
    def _generate_account_number(db: Session) -> str:
        for _ in range(20):
            number = "1" + "".join(str(secrets.randbelow(10)) for _ in range(9))
            exists = db.scalar(select(Account.id).where(Account.account_number == number))
            if exists is None:
                return number
        raise RuntimeError("Unable to generate a unique virtual account number.")

    @classmethod
    def create_for_user(cls, db: Session, user: User) -> Account:
        currency = SettingService.get_string(db, SettingKeys.PRIMARY_CURRENCY, "USD")[:3].upper()
        account = Account(
            user_id=user.id,
            account_number=cls._generate_account_number(db),
            currency=currency,
            available_balance=Decimal("0.00"),
        )
        db.add(account)
        db.flush()
        return account
