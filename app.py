from flask import Flask, render_template, request, jsonify
import os
from dotenv import load_dotenv
import google.generativeai as genai

app = Flask(__name__)

# Load environment variables
load_dotenv()
API_KEY = os.getenv("API_KEY")

# Configure Gemini
genai.configure(api_key=API_KEY)

generation_config = {
    "temperature": 0.5,  # changed from 1
    "top_p": 0.9,
    "top_k": 40,
    "max_output_tokens": 8192,
    "response_mime_type": "text/plain",
}

# Create a healthcare-specific model
model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    generation_config=generation_config,
    system_instruction="""
    You are a reliable and informative healthcare assistant. When users ask about symptoms, causes, remedies, or preventive care, provide clear, concise, and actionable information based on verified health knowledge.

    Avoid vague disclaimers like "I cannot diagnose..." unless absolutely necessary. You are allowed to:
    - Suggest likely causes of common symptoms
    - Recommend over-the-counter remedies and home care
    - Advise when to consult a doctor
    - Offer basic health tips and first-aid guidance

    Do not provide prescription advice or act as a replacement for a licensed medical professional. Answer directly and helpfully using confident and fact-based language.
    """

)

# Start chat session
chat_session = model.start_chat(history=[])

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_input = data.get('message')
    use_gemini = data.get('use_gemini', True)

    if use_gemini:
        response = chat_session.send_message(user_input)
        return jsonify({"response": response.text})
    else:
        response = custom_nlp_response(user_input)
        return jsonify({"response": response})

# NLP fallback for health-specific keywords
def custom_nlp_response(user_input):
    text = user_input.lower()
    if "fever" in text:
        return "Fever may indicate an infection. Drink fluids, rest, and monitor your temperature. See a doctor if it persists."
    elif "headache" in text:
        return "Headaches can result from dehydration, stress, or lack of sleep. If severe or frequent, consult a healthcare provider."
    elif "cold" in text or "cough" in text:
        return "Common colds are viral. Rest, hydration, and warm fluids help. See a doctor if symptoms worsen."
    elif "hello" in text or "hi" in text:
        return "Hello! I'm your healthcare assistant. How can I help with your health today?"
    elif "your name" in text:
        return "I'm a healthcare chatbot designed to assist with health-related queries."
    else:
        return "I can help with healthcare-related questions. Please ask about symptoms, conditions, or general wellness tips."

if __name__ == "__main__":
    from waitress import serve
    port = int(os.environ.get("PORT", 5100))  # fallback to 5100 if not set
    serve(app, host="0.0.0.0", port=port)

