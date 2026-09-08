from app.models.lead import Lead

HIGH_VALUE_BUDGET = 50_000_000  # 5 Crore
MID_VALUE_BUDGET = 10_000_000  # 1 Crore


def calculate_lead_score(lead: Lead) -> int:
    """Rule-based lead scoring (0-100).

    Reachability matters most, but genuine interest signals still earn
    meaningful points even before contact details arrive.
    """
    score = 0

    # Contact information
    if lead.name:
        score += 5
    if lead.email:
        score += 12
    if lead.phone:
        score += 13

    # Interest clarity
    if lead.property_type:
        score += 10
    if lead.city:
        score += 8
    if lead.budget and lead.budget > 0:
        score += 15
        if lead.budget >= HIGH_VALUE_BUDGET:
            score += 5
        elif lead.budget >= MID_VALUE_BUDGET:
            score += 3

    # Engagement quality (markers set by the chat flow)
    notes = (lead.notes or "").lower()
    if "viewing requested" in notes or "booking" in notes:
        score += 10
    if "contact details shared" in notes:
        score += 7

    # Source quality
    if lead.source == "chat":
        score += 3
    elif lead.source == "manual":
        score += 2

    # Without any reachable channel, cap low regardless of intent
    if not lead.email and not lead.phone:
        score = min(score, 40)

    return min(score, 100)
