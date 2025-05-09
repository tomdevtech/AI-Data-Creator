import os
import json
import logging
import re
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

def extract_json_from_content(content):
    if isinstance(content, (list, dict)):
        return content
    if isinstance(content, str):
        # Remove code block markdown if present
        code_block = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", content, re.IGNORECASE)
        if code_block:
            json_str = code_block.group(1)
        else:
            json_str = content
        try:
            return json.loads(json_str.strip())
        except Exception as e:
            raise ValueError(f"JSON parse error: {e}\nContent: {repr(json_str)}")
    return content

def get_content_from_response(json_response):
    # Robust extraction, works for different model formats
    choices = json_response.get("choices", [])
    if choices:
        choice = choices[0]
        # OpenAI format
        if "message" in choice and "content" in choice["message"]:
            return choice["message"]["content"]
        # Sometimes just "text"
        if "text" in choice:
            return choice["text"]
    # Fallbacks
    if "content" in json_response:
        return json_response["content"]
    if "result" in json_response:
        return json_response["result"]
    return ""

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
    prompt = request.json.get("prompt") or (
        "Return only a JSON array of programming courses. Each course must have: id (number), name (string), description (string), price (number), inStock (boolean). Output only valid JSON, no explanation, no markdown, no text."
    )
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "qwen/qwen3-8b:free", 
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }
    response = requests.post(OPENROUTER_API_URL, headers=headers, json=data)
    try:
        response.raise_for_status()
        json_response = response.json()
        content = get_content_from_response(json_response)
        try:
            parsed_courses = extract_json_from_content(content)
        except Exception as e:
            logging.error(f"Parsing error: {e}")
            return jsonify({"error": f"Parsing error: {e}", "raw": content}), 500

        return jsonify(parsed_courses), 200
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