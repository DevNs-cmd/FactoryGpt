import sqlite3
import datetime
import json

DB_FILE = "chatbot_history.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            role TEXT NOT NULL,
            department TEXT NOT NULL,
            message TEXT NOT NULL,
            language TEXT NOT NULL,
            answer TEXT NOT NULL,
            source TEXT NOT NULL,
            confidence REAL NOT NULL,
            suggestions TEXT NOT NULL,
            execution_time_ms REAL NOT NULL,
            model_used TEXT NOT NULL,
            api_cost REAL NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

# Initialize DB on module import
init_db()

def log_chat_event(
    user_id: str,
    role: str,
    department: str,
    message: str,
    language: str,
    answer: str,
    source: str,
    confidence: float,
    suggestions: list,
    execution_time_ms: float,
    model_used: str = "llama-3.3-70b-versatile",
    api_cost: float = 0.0005
) -> int:
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO chat_history (
            user_id, role, department, message, language, answer, source, confidence, suggestions, execution_time_ms, model_used, api_cost
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user_id, role, department, message, language, answer, source, confidence,
        json.dumps(suggestions), execution_time_ms, model_used, api_cost
    ))
    conn.commit()
    inserted_id = cursor.lastrowid
    conn.close()
    return inserted_id

def get_chat_history(user_id: str = None, query: str = None, limit: int = 50):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    sql = "SELECT * FROM chat_history WHERE 1=1"
    params = []
    
    if user_id:
        sql += " AND user_id = ?"
        params.append(user_id)
    if query:
        sql += " AND (message LIKE ? OR answer LIKE ?)"
        params.append(f"%{query}%")
        params.append(f"%{query}%")
        
    sql += " ORDER BY timestamp DESC LIMIT ?"
    params.append(limit)
    
    cursor.execute(sql, params)
    rows = cursor.fetchall()
    conn.close()
    
    history = []
    for r in rows:
        history.append({
            "id": r["id"],
            "user_id": r["user_id"],
            "role": r["role"],
            "department": r["department"],
            "message": r["message"],
            "language": r["language"],
            "answer": r["answer"],
            "source": r["source"],
            "confidence": r["confidence"],
            "suggestions": json.loads(r["suggestions"] or "[]"),
            "execution_time_ms": r["execution_time_ms"],
            "model_used": r["model_used"],
            "api_cost": r["api_cost"],
            "timestamp": str(r["timestamp"])
        })
    return history

def clear_chat_history(user_id: str = None):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    if user_id:
        cursor.execute("DELETE FROM chat_history WHERE user_id = ?", (user_id,))
    else:
        cursor.execute("DELETE FROM chat_history")
    conn.commit()
    conn.close()
    return True
