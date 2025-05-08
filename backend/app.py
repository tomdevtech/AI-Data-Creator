import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
import requests

load_dotenv()  # Load environment variables from .env

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_API_URL = os.getenv("OPENROUTER_API_URL")

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
    prompt = request.json.get("prompt", "Generate 3 example programming courses as JSON.")
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "openai/gpt-3.5-turbo",  # Passe ggf. das Modell an
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }
    response = requests.post(OPENROUTER_API_URL, headers=headers, json=data)
    if response.status_code == 200:
        return jsonify(response.json()), 200
    else:
        return jsonify({"error": "Failed to fetch from OpenRouter API"}), response.status_code

if __name__ == '__main__':
    port = int(os.getenv("FLASK_RUN_PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "0") == "1"
    app.run(debug=debug, port=port)