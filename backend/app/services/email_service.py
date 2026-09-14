import smtplib
from email.message import EmailMessage
from email.utils import formataddr

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.constants.setting_key import SettingKeys
from app.services.setting_service import SettingService


class EmailService:
    @classmethod
    def send(
        cls,
        db: Session,
        *,
        to_email: str,
        subject: str,
        text_body: str,
    ) -> None:
        if not SettingService.get_boolean(
            db,
            SettingKeys.SMTP_ENABLED,
            False,
        ):
            raise HTTPException(
                status_code=503,
                detail="Email delivery is not configured.",
            )

        host = SettingService.get_string(
            db,
            SettingKeys.SMTP_HOST,
        )
        port = SettingService.get_integer(
            db,
            SettingKeys.SMTP_PORT,
            587,
        )
        username = SettingService.get_string(
            db,
            SettingKeys.SMTP_USERNAME,
        )
        password = SettingService.get_string(
            db,
            SettingKeys.SMTP_PASSWORD,
        )
        from_email = SettingService.get_string(
            db,
            SettingKeys.SMTP_FROM_EMAIL,
        )
        from_name = SettingService.get_string(
            db,
            SettingKeys.SMTP_FROM_NAME,
            "Banking",
        )
        use_tls = SettingService.get_boolean(
            db,
            SettingKeys.SMTP_USE_TLS,
            True,
        )
        use_ssl = SettingService.get_boolean(
            db,
            SettingKeys.SMTP_USE_SSL,
            False,
        )

        if not host or not from_email:
            raise HTTPException(
                status_code=503,
                detail="Email delivery is not configured.",
            )

        message = EmailMessage()
        message["From"] = (
            formataddr((from_name, from_email))
            if from_name
            else from_email
        )
        message["To"] = to_email
        message["Subject"] = subject
        message.set_content(text_body)

        try:
            if use_ssl:
                with smtplib.SMTP_SSL(
                    host,
                    port,
                    timeout=15,
                ) as smtp:
                    if username:
                        smtp.login(username, password)
                    smtp.send_message(message)
            else:
                with smtplib.SMTP(
                    host,
                    port,
                    timeout=15,
                ) as smtp:
                    if use_tls:
                        smtp.starttls()
                    if username:
                        smtp.login(username, password)
                    smtp.send_message(message)
        except (OSError, smtplib.SMTPException) as exc:
            raise HTTPException(
                status_code=503,
                detail="Email delivery failed.",
            ) from exc
