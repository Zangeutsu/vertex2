from dataclasses import dataclass
from urllib.parse import quote_plus


@dataclass
class NotificationLinks:
    whatsapp: str
    email_subject: str
    email_body: str


def build_notification_links(phone: str, subject: str, body: str) -> NotificationLinks:
    sanitized_phone = phone.replace(" ", "").replace("+", "")
    whatsapp_message = quote_plus(body)
    whatsapp_link = f"https://wa.me/{sanitized_phone}?text={whatsapp_message}"
    email_subject = quote_plus(subject)
    email_body = quote_plus(body)
    mailto = f"mailto:?subject={email_subject}&body={email_body}"
    return NotificationLinks(whatsapp=whatsapp_link, email_subject=subject, email_body=mailto)
