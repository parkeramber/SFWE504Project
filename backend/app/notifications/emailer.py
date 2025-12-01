# app/notifications/emailer.py
"""
Reusable SMTP email sender.

Configuration (env):
  SMTP_HOST (required)
  SMTP_PORT (optional, default 587)
  SMTP_USERNAME (optional)
  SMTP_PASSWORD (optional)
  SMTP_USE_TLS (optional, default true)
  EMAIL_SENDER (required, fallback sender address)
"""
import os
import smtplib
from email.message import EmailMessage
from typing import Optional

from dotenv import load_dotenv

load_dotenv()


class EmailSender:
    """Simple reusable email sender using SMTP."""

    def __init__(
        self,
        host: Optional[str] = None,
        port: Optional[int] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        use_tls: Optional[bool] = None,
        default_sender: Optional[str] = None,
    ) -> None:
        self.host = host or os.getenv("SMTP_HOST")
        self.port = int(port or os.getenv("SMTP_PORT", "587"))
        self.username = username or os.getenv("SMTP_USERNAME")
        self.password = password or os.getenv("SMTP_PASSWORD")
        self.use_tls = use_tls if use_tls is not None else os.getenv("SMTP_USE_TLS", "true").lower() != "false"
        self.default_sender = default_sender or os.getenv("EMAIL_SENDER")

        if not self.host:
            raise ValueError("SMTP_HOST is required for EmailSender")
        if not self.default_sender:
            raise ValueError("EMAIL_SENDER is required for EmailSender")

    def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        sender_name: Optional[str] = None,
        sender_email: Optional[str] = None,
    ) -> None:
        """
        Send an email to `to_email` with the given `subject` and `body`.
        The from-address defaults to EMAIL_SENDER, but can be overridden per-call.
        """
        from_address = sender_email or self.default_sender
        if sender_name:
            from_header = f"{sender_name} <{from_address}>"
        else:
            from_header = from_address

        msg = EmailMessage()
        msg["From"] = from_header
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.set_content(body)

        if self.use_tls:
            with smtplib.SMTP(self.host, self.port) as smtp:
                smtp.starttls()
                if self.username and self.password:
                    smtp.login(self.username, self.password)
                smtp.send_message(msg)
        else:
            with smtplib.SMTP(self.host, self.port) as smtp:
                if self.username and self.password:
                    smtp.login(self.username, self.password)
                smtp.send_message(msg)


# Convenience instance/function for quick use
_default_sender: Optional[EmailSender] = None


def _get_default_sender() -> EmailSender:
    global _default_sender
    if _default_sender is None:
        _default_sender = EmailSender()
    return _default_sender


def send_email_notification(
    to_email: str,
    subject: str,
    body: str,
    sender_name: Optional[str] = None,
    sender_email: Optional[str] = None,
) -> None:
    """
    Send an email using environment-based settings.

    Example:
        send_email_notification(
            to_email="user@example.com",
            subject="Welcome",
            body="Thanks for signing up!",
            sender_name="EduAid Team",
        )
    """
    sender = _get_default_sender()
    sender.send_email(
        to_email=to_email,
        subject=subject,
        body=body,
        sender_name=sender_name,
        sender_email=sender_email,
    )
