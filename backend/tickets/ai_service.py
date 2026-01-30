import os
import google.generativeai as genai

CATEGORIES = [
    "Authentication",
    "Billing",
    "Technical Issue",
    "Feature Request",
    "General Support",
]

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


def categorize_ticket(description: str) -> str:
    """
    Categorize support tickets using Gemini.
    Falls back to 'General Support' on failure.
    """
    try:
        model = genai.GenerativeModel("gemini-pro")

        prompt = f"""
You are a support ticket classifier.

Allowed categories:
- Authentication
- Billing
- Technical Issue
- Feature Request
- General Support

Ticket description:
"{description}"

Respond with ONLY ONE category from the list above.
"""

        response = model.generate_content(prompt)
        category = response.text.strip()

        if category not in CATEGORIES:
            return "General Support"

        return category

    except Exception as e:
        print("Gemini categorization failed:", e)
        return "General Support"
