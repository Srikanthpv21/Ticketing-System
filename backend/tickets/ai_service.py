def auto_categorize_ticket(description: str) -> str:
    """
    Simple rule-based placeholder.
    Can be replaced with LLM call later.
    """

    text = description.lower()

    if "payment" in text or "charged" in text or "billing" in text:
        return "Billing"
    if "error" in text or "bug" in text or "issue" in text:
        return "Technical"
    if "login" in text or "password" in text or "account" in text:
        return "Account"

    return "General"
