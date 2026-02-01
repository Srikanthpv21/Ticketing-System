import os
import openai

openai.api_key = os.getenv("OPENAI_API_KEY")

CATEGORIES = ["Login", "Payment", "Bug", "Feature Request", "Other"]

def auto_categorize(text):
    if not openai.api_key:
        return "Other"

    prompt = f"""
    Categorize this support ticket into one of:
    {', '.join(CATEGORIES)}

    Ticket:
    {text}

    Only return category name.
    """

    try:
        res = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=10,
        )
        return res.choices[0].message.content.strip()
    except Exception:
        return "Other"
