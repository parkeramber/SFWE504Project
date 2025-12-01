# app/notifications/__init__.py
from .emailer import EmailSender, send_email_notification

__all__ = ["EmailSender", "send_email_notification"]
