import os
import logging
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
import requests

load_dotenv()  # Load environment variables from .env

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_API_URL = os.getenv("OPENROUTER_API_URL")

# Setup logging
logging.basicConfig(
    filename="openrouter.log",
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s"
)

app = Flask(__name__)
CORS(app)

# Example programming courses (in-memory)
courses = [
    {
        "id": 1,
        "name": "Python for Beginners",
        "description": "Learn the basics of Python with practical exercises.",
        "price": 49.99,
        "inStock": True
    },
    {
        "id": 2,
        "name": "Web Development with Flask",
        "description": "Build web applications using Python and Flask.",
        "price": 69.00,
        "inStock": True
    },
    {
        "id": 3,
        "name": "JavaScript Fundamentals",
        "description": "Get started with JavaScript and develop interactive websites.",
        "price": 39.99,
        "inStock": False
    }
]

@app.route('/api/courses', methods=['GET'])
def get_courses():
    return jsonify(courses)

@app.route('/api/courses', methods=['POST'])
def add_course():
    data = request.json
    data['id'] = max([c['id'] for c in courses], default=0) + 1
    courses.append(data)
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
            import json
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