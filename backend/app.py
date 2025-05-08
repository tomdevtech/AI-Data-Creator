import os
import json
import logging
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
import requests

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_API_URL = os.getenv("OPENROUTER_API_URL")

# Logging setup
logging.basicConfig(
    filename="openrouter.log",
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s"
)

app = Flask(__name__)
CORS(app)

COURSES_FILE = "courses.json"

def load_courses():
    if os.path.exists(COURSES_FILE):
        with open(COURSES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def save_courses(courses):
    with open(COURSES_FILE, "w", encoding="utf-8") as f:
        json.dump(courses, f, ensure_ascii=False, indent=2)

courses = load_courses()

@app.route('/api/courses', methods=['GET'])
def get_courses():
    return jsonify(courses)

@app.route('/api/courses', methods=['POST'])
def add_course():
    data = request.json
    data['id'] = max([c['id'] for c in courses], default=0) + 1
    courses.append(data)
    save_courses(courses)
    return jsonify(data), 201

@app.route('/api/generate-courses', methods=['POST'])
def generate_courses():
    prompt = request.json.get("prompt", "Generate programming courses as JSON.")
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "openai/gpt-3.5-turbo",
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }
    response = requests.post(OPENROUTER_API_URL, headers=headers, json=data)
    try:
        response.raise_for_status()
        json_response = response.json()
        # Log and save the JSON response
        logging.info(f"Prompt: {prompt}")
        logging.info(f"Response: {json_response}")
        with open("openrouter_responses.jsonl", "a", encoding="utf-8") as f:
            f.write(json.dumps({"prompt": prompt, "response": json_response}, ensure_ascii=False) + "\n")
        return jsonify(json_response), 200
    except requests.exceptions.JSONDecodeError:
        logging.error(f"Invalid JSON from OpenRouter: {response.text}")
        return jsonify({"error": "OpenRouter API did not return valid JSON.", "raw": response.text}), 500
    except Exception as e:
        logging.error(f"Error: {str(e)} | Raw: {response.text}")
        return jsonify({"error": str(e), "raw": response.text}), response.status_code

if __name__ == '__main__':
    port = int(os.getenv("FLASK_RUN_PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "0") == "1"
    app.run(debug=debug, port=port)