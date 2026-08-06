# chatbot-assistant — Owner: Gauri (Enterprise AI Factory Assistant)

Intelligent production assistant service for FactoryGPT powered by Anthropic's Claude API (`claude-3-5-sonnet-20241022`).

---

## ⚡ Quickstart: Running Standalone

### 1. Environment Setup
Navigate to the service folder and set up environment variables:
```bash
cd services/chatbot-assistant

# Copy environment template
cp .env.example .env
```

Open `.env` and add your Anthropic API Key:
```env
ANTHROPIC_API_KEY="your_real_anthropic_api_key_here"
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the Service
Start the FastAPI server on port **8002**:
```bash
uvicorn app.main:app --reload --port 8002
```

---

## 🧪 Testing the APIs

### 1. Health Check
```bash
curl http://localhost:8002/health
```
**Response**: `{"status": "ok", "service": "chatbot-assistant"}`

---

### 2. Text Chat (`POST /chat`)
Query the AI Assistant in English or Hindi:
```bash
curl -X POST http://localhost:8002/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is today'\''s production count and current OEE?",
    "language": "en",
    "role": "Production Manager"
  }'
```

**Refusal Test (Out-of-Domain Guardrail)**:
```bash
curl -X POST http://localhost:8002/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Who won the football world cup?", "language": "en"}'
```

---

### 3. Voice Chat (`POST /voice`)
Upload audio file for Speech-to-Text transcription & query execution:
```bash
curl -X POST http://localhost:8002/voice \
  -F "file=@sample_voice.wav" \
  -F "language=en" \
  -F "role=Production Manager"
```

---

### 4. Search Chat History (`GET /history`)
```bash
curl "http://localhost:8002/history?query=OEE"
```

---

### 5. Clear History (`DELETE /history`)
```bash
curl -X DELETE http://localhost:8002/history
```

---

### 6. Factory Reports (`GET /reports`)
```bash
curl http://localhost:8002/reports
```

---

## 🐳 Running with Docker Compose (Full Stack)

From the root project directory `factorygpt/`:
```bash
docker-compose up --build
```
`chatbot-assistant` will start on port `8002`.
