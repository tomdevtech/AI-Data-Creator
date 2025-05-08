# 🚀 AI-Data-Creator

## 📝 Description
AI-Data-Creator is a tool that leverages the 🤖 OpenRouter API to generate sample programming course data in JSON format. The project provides a 🐍 Python Flask backend and a ⚡ modern React (Vite + TypeScript) frontend. It is designed to create realistic and diverse programming course examples that can be easily integrated into learning platforms or UI applications.

## 🎯 Features
- 🤖 AI-powered data generation using OpenRouter API
- 📊 Structured JSON output for easy integration
- 📝 Custom prompt input for flexible data generation
- 🖥️ Modern React (Vite + TypeScript) frontend
- 🔗 REST API with Flask backend
- 📱 UI-friendly data structure

## 🛠️ Setup

### 1. 🧩 Clone the repository
```bash
git clone https://github.com/yourusername/AI-Data-Creator.git
cd AI-Data-Creator
```

### 2. 🐍 Backend setup
```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory:
```
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
FLASK_ENV=development
FLASK_DEBUG=1
FLASK_RUN_PORT=5000
```

🚦 Start the backend:
```bash
python app.py
```

### 3. ⚛️ Frontend setup
```bash
cd ../frontend
npm install
npm run dev
```

🌐 Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📚 References

- 📖 [OpenRouter API Documentation](https://openrouter.ai/docs)
- 📖 [Flask Documentation](https://flask.palletsprojects.com/)
- 📖 [Vite Documentation](https://vitejs.dev/)
- 📖 [React Documentation](https://react.dev/)
- 📖 [TypeScript Documentation](https://www.typescriptlang.org/)

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request. 🙌

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details. 📜

## ⭐ Support
If you find this project helpful, please give it a ⭐ star! For issues and feature requests, please use the GitHub issue tracker. 🚩