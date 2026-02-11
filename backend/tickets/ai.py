import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

ALLOWED_CATEGORIES = {
    "LOGIN",
    "PAYMENT",
    "BUG",
    "FEATURE",
    "OTHER",
}


def _setup_gemini():
    """Initializes the Gemini model using the API key from environment variables."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    
    try:
        genai.configure(api_key=api_key)
        # Using gemini-3-flash-preview for speed and cost efficiency
        return genai.GenerativeModel('gemini-3-flash-preview')
    except Exception as e:
        print(f"Gemini Config Error: {e}")
        return None


def auto_categorize(text: str) -> str:
    """Classifies a ticket description into a predefined category."""
    model = _setup_gemini()
    if not model:
        return "OTHER"

    try:
        prompt = f"""
        Classify this support ticket into EXACTLY one category.
        Allowed categories: LOGIN, PAYMENT, BUG, FEATURE, OTHER
        
        Ticket: "{text}"
        
        Respond with ONLY the category name. No extra text.
        """
        response = model.generate_content(prompt)
        category = response.text.strip().upper()
        
        # Clean up any potential formatting
        category = category.replace('**', '').replace('`', '').strip()
        
        return category if category in ALLOWED_CATEGORIES else "OTHER"

    except Exception as e:
        print(f"Gemini Error (Categorization): {e}")
        return "OTHER"


def suggest_reply(ticket, comments):
    """Generates a suggested response for the support agent."""
    model = _setup_gemini()
    if not model:
        return "AI suggestions unavailable."

    conversation = "\n".join(
        f"{c.user.username}: {c.message}" for c in comments
    )

    prompt = f"""
    You are a professional customer support agent. Write a short, polite, helpful response.
    Tone: calm, professional, reassuring. Do not include placeholders.
    
    Ticket: {ticket.title}
    Description: {ticket.description}
    Conversation History:
    {conversation}
    """

    try:
        response = model.generate_content(prompt)
        return response.text.strip()

    except Exception as e:
        print(f"Gemini Error (Reply): {e}")
        return "Unable to generate suggestion."


def summarize_ticket(ticket, comments):
    """Generates a 3-5 bullet point summary of the ticket."""
    model = _setup_gemini()
    if not model:
        return "AI summary unavailable."

    conversation = "\n".join(
        f"{c.user.username}: {c.message}" for c in comments
    )

    prompt = f"""
    Summarize this support ticket in 3–5 bullet points.
    Focus on: Problem, Customer intent, Current status, Action taken.
    
    Ticket: {ticket.title}
    Description: {ticket.description}
    Conversation:
    {conversation}
    
    Format as markdown bullet points.
    """

    try:
        response = model.generate_content(prompt)
        return response.text.strip()

    except Exception as e:
        print(f"Gemini Error (Summary): {e}")
        return f"Unable to generate summary. Error: {str(e)}"
