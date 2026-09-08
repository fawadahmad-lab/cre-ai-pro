"""Email sending via the Resend HTTP API.

Gracefully degrades to a no-op (logged) when RESEND_API_KEY is not configured,
so the demo works without credentials.
"""
import logging
from typing import Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"


def _send_email(to: str, subject: str, html: str) -> bool:
    if not settings.RESEND_API_KEY:
        logger.info("[email skipped - no RESEND_API_KEY] to=%s subject=%s", to, subject)
        return False
    try:
        resp = httpx.post(
            RESEND_API_URL,
            headers={
                "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "from": settings.EMAIL_FROM,
                "to": [to],
                "subject": subject,
                "html": html,
            },
            timeout=10,
        )
        if resp.status_code >= 400:
            logger.error("Resend error %s: %s", resp.status_code, resp.text)
            return False
        return True
    except httpx.HTTPError as exc:
        logger.error("Resend request failed: %s", exc)
        return False


BASE_STYLE = """
<div style="font-family: Inter, Arial, sans-serif; max-width: 560px; margin: 0 auto;
     border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
  <div style="background: #0f172a; padding: 20px 28px;">
    <h2 style="color: #ffffff; margin: 0; font-size: 18px;">CRE AI Pro</h2>
    <p style="color: #94a3b8; margin: 4px 0 0; font-size: 12px;">Commercial Real Estate Platform</p>
  </div>
  <div style="padding: 28px;">{body}</div>
  <div style="padding: 16px 28px; background: #f8fafc; color: #64748b; font-size: 11px;">
    You received this email because you interacted with our AI sales agent.
  </div>
</div>
"""


def send_booking_confirmation(
    to_email: str,
    name: str,
    property_title: str,
    property_location: str,
    scheduled_at: str,
) -> bool:
    body = f"""
      <p style="margin:0 0 12px; color:#0f172a; font-size:16px;">Hi {name or "there"},</p>
      <p style="margin:0 0 16px; color:#334155; font-size:14px; line-height:1.6;">
        Your property viewing has been booked. Here are the details:
      </p>
      <table style="width:100%; border-collapse:collapse; font-size:14px; color:#334155;">
        <tr><td style="padding:8px 0; color:#64748b;">Property</td>
            <td style="padding:8px 0; text-align:right;"><strong>{property_title}</strong></td></tr>
        <tr><td style="padding:8px 0; color:#64748b;">Location</td>
            <td style="padding:8px 0; text-align:right;">{property_location}</td></tr>
        <tr><td style="padding:8px 0; color:#64748b;">Date &amp; Time</td>
            <td style="padding:8px 0; text-align:right;"><strong>{scheduled_at}</strong></td></tr>
      </table>
      <p style="margin:20px 0 0; color:#334155; font-size:14px; line-height:1.6;">
        Our agent will meet you at the site. Reply to this email if you need to reschedule.
      </p>
    """
    return _send_email(
        to=to_email,
        subject=f"Viewing confirmed: {property_title}",
        html=BASE_STYLE.format(body=body),
    )


def send_lead_followup(
    to_email: str,
    name: str,
    matched_properties: list[dict],
) -> bool:
    rows = "".join(
        f"""
        <tr>
          <td style="padding:10px 0; border-bottom:1px solid #e5e7eb;">
            <strong style="color:#0f172a;">{p['title']}</strong><br/>
            <span style="color:#64748b; font-size:13px;">{p['location']}</span>
          </td>
          <td style="padding:10px 0; border-bottom:1px solid #e5e7eb; text-align:right;
              white-space:nowrap;"><strong>{p['price']}</strong></td>
        </tr>"""
        for p in matched_properties[:4]
    )
    body = f"""
      <p style="margin:0 0 12px; color:#0f172a; font-size:16px;">Hi {name or "there"},</p>
      <p style="margin:0 0 16px; color:#334155; font-size:14px; line-height:1.6;">
        Thanks for chatting with us. Based on your requirements, here are properties
        from our current inventory:
      </p>
      <table style="width:100%; border-collapse:collapse; font-size:14px; color:#334155;">{rows}</table>
      <p style="margin:20px 0 0; color:#334155; font-size:14px; line-height:1.6;">
        Would you like to schedule a visit? Just reply to this email.
      </p>
    """
    return _send_email(
        to=to_email,
        subject="Properties matching your requirements",
        html=BASE_STYLE.format(body=body),
    )


def format_pkr(price: float, price_type: str = "total") -> str:
    prefix = "" if price_type == "total" else ("Per Marla: " if price_type == "per_marla" else "Per Sqft: ")
    if price >= 10_000_000 and price % 100_000 == 0:
        crore = price / 10_000_000
        return f"{prefix}PKR {crore:g} Crore"
    if price >= 100_000 and price % 100_000 == 0:
        return f"{prefix}PKR {price / 100_000:g} Lakh"
    return f"{prefix}PKR {price:,.0f}"
