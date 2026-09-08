"""Deterministic entity extraction for the Pakistani real-estate market.

All functions are pure regex/keyword logic - no LLM involved - so results are
stable and can never hallucinate.
"""
import re
from typing import Optional

EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")

# Pakistani mobile numbers: 03xxxxxxxxx, 03xx-xxxxxxx, +92-3xx-xxxxxxx, 0092...
PHONE_RE = re.compile(
    r"(?:\+92|0092|0)?[\s\-]?(3\d{2})[\s\-]?(\d{7}|\d{3}[\s\-]?\d{4})\b"
)

NAME_PATTERNS = [
    re.compile(r"\bmy name is\s+([A-Za-z][A-Za-z .'-]{1,49}?)(?:[,.!]|$|\s+(?:and|from|i'm|my))", re.IGNORECASE),
    re.compile(r"\b(?:i am|i'm|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)"),
    re.compile(r"\bmera naam\s+([A-Za-z][A-Za-z .'-]{1,49}?)(?:\s+hai\b|[,.!]|$)", re.IGNORECASE),
]

CITIES = [
    "karachi", "lahore", "islamabad", "rawalpindi", "faisalabad", "multan",
    "peshawar", "quetta", "sialkot", "gujranwala", "hyderabad", "abbottabad",
]

PROPERTY_TYPES = {
    "plot": ["plot", "plot ", "land", "file"],
    "house": ["house", "villa", "home", "bungalow"],
    "apartment": ["apartment", "flat"],
    "shop": ["shop", "showroom", "retail"],
    "office": ["office", "corporate"],
}

BUDGET_RE = re.compile(
    r"(\d+(?:[.,]\d+)?)\s*(crore|crores|cr|karor|lakh|lakhs|lac|lacs)\b",
    re.IGNORECASE,
)
# "budget of 5 million", "under 25m", "around 80k" style
UNIT_BUDGET_RE = re.compile(
    r"(?:budget|afford|range|max|under|below|upto|up to|around|about|of)\D{0,12}"
    r"(\d+(?:[.,]\d+)?)\s*(million|mn|mm|m|k|thousand)\b",
    re.IGNORECASE,
)

VIEWING_KEYWORDS = [
    "visit", "visiting", "viewing", "see it", "see the", "check it out",
    "schedule", "appointment", "meet", "book a", "book viewing", "site visit",
]

CONTACT_ASK_MARKERS = ["call me", "contact me", "reach me", "whatsapp me"]


def extract_email(text: str) -> Optional[str]:
    m = EMAIL_RE.search(text)
    return m.group(0).lower() if m else None


def extract_phone(text: str) -> Optional[str]:
    cleaned = PHONE_RE.search(text)
    if not cleaned:
        return None
    digits = re.sub(r"\D", "", cleaned.group(0))
    # normalise to 03xxxxxxxxx form
    if digits.startswith("0092"):
        digits = "0" + digits[4:]
    elif digits.startswith("92"):
        digits = "0" + digits[2:]
    if not digits.startswith("0"):
        digits = "0" + digits
    if len(digits) == 11:
        return f"{digits[:4]}-{digits[4:]}"
    return None


def extract_name(text: str) -> Optional[str]:
    for pattern in NAME_PATTERNS:
        m = pattern.search(text)
        if m:
            name = m.group(1).strip().strip("'\"")
            if len(name) <= 50 and not any(ch.isdigit() for ch in name):
                return name.title()
    return None


def extract_city(text: str) -> Optional[str]:
    lower = text.lower()
    for city in CITIES:
        if city in lower:
            return city.title()
    return None


def extract_property_type(text: str) -> Optional[str]:
    lower = text.lower()
    for ptype, keywords in PROPERTY_TYPES.items():
        for kw in keywords:
            if kw in lower:
                return ptype
    return None


def extract_budget(text: str) -> Optional[float]:
    """Extract budget in PKR. Returns None when no credible money figure found."""
    m = BUDGET_RE.search(text)
    if m:
        try:
            value = float(m.group(1).replace(",", ""))
            unit = m.group(2).lower()
            if unit.startswith(("crore", "cr", "karor")):
                return value * 10_000_000
            return value * 100_000  # lakh / lac
        except ValueError:
            pass

    m = UNIT_BUDGET_RE.search(text)
    if m:
        try:
            value = float(m.group(1).replace(",", ""))
            unit = m.group(2).lower()
            if unit in ("million", "mn", "mm", "m"):
                return value * 1_000_000
            if unit == "k":
                return value * 1_000
            if unit == "thousand":
                return value * 1_000
        except ValueError:
            pass
    return None


def extract_listing_type(text: str) -> Optional[str]:
    lower = text.lower()
    if any(kw in lower for kw in ["rent", "lease", "monthly"]):
        return "rent"
    if any(kw in lower for kw in ["buy", "purchase", "invest", "sale"]):
        return "sale"
    return None


def wants_viewing(text: str) -> bool:
    lower = text.lower()
    return any(kw in lower for kw in VIEWING_KEYWORDS)


def extract_lead_info(text: str) -> dict:
    return {
        "name": extract_name(text),
        "email": extract_email(text),
        "phone": extract_phone(text),
        "city": extract_city(text),
        "property_type": extract_property_type(text),
        "budget": extract_budget(text),
    }


GREETINGS = [
    "hi", "hello", "hey", "assalam", "asalam", "salam", "aoa",
    "good morning", "good evening", "good afternoon", "greetings",
]


def is_greeting(text: str) -> bool:
    stripped = text.strip().lower().rstrip("!.")
    if len(stripped.split()) > 4:
        return False
    return any(stripped == g or stripped.startswith(g + " ") for g in GREETINGS)
