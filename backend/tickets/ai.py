import os
from openai import OpenAI

ALLOWED_CATEGORIES = {
    "LOGIN",
    "PAYMENT",
    "BUG",
    "FEATURE",
    "OTHER",
}


# -------------------------
# OpenAI Client
# -------------------------
def _get_client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    return OpenAI(api_key=api_key)


# -------------------------
# Auto Categorization
# -------------------------
def auto_categorize(text: str) -> str:
    client = _get_client()
    if not client:
        return "OTHER"

    try:
        prompt = f"""
Classify this support ticket into EXACTLY one category.

Allowed categories:
LOGIN, PAYMENT, BUG, FEATURE, OTHER

Ticket:
{text}

Respond with ONLY the category name.
"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=10,
        )

        category = response.choices[0].message.content.strip().upper()
        return category if category in ALLOWED_CATEGORIES else "OTHER"

    except Exception:
        return "OTHER"


# -------------------------
# AI Reply Suggestion
# -------------------------
def suggest_reply(ticket, comments):
    client = _get_client()
    if not client:
        return (
            "Thanks for reaching out. "
            "We’re reviewing your issue and will update you shortly."
        )

    conversation = "\n".join(
        f"{c.user.username}: {c.message}" for c in comments
    )

    prompt = f"""
You are a professional customer support agent.

Ticket title:
{ticket.title}

Ticket description:
{ticket.description}

Conversation:
{conversation}

Write a short, polite, helpful response to the customer.
Tone: calm, professional, reassuring.
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=120,
        )

        return response.choices[0].message.content.strip()

    except Exception:
        return (
            "Thanks for your message. "
            "Our team is investigating and will get back to you shortly."
        )


# -------------------------
# AI Ticket Summary
# -------------------------
def summarize_ticket(ticket, comments):
    client = _get_client()
    if not client:
        return "AI summary unavailable."

    conversation = "\n".join(
        f"{c.user.username}: {c.message}" for c in comments
    )

    prompt = f"""
You are a help desk assistant.

Summarize this support ticket in 3–5 bullet points.
Focus on:
- Problem
- Customer intent
- Current status
- Any action taken

Ticket title:
{ticket.title}

Ticket description:
{ticket.description}

Conversation:
{conversation}

Use bullet points only.
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=200,
        )

        return response.choices[0].message.content.strip()

    except Exception:
        return "Unable to generate summary at this time."
