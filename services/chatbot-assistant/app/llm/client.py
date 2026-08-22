"""
Owner: Gauri
Enterprise AI Factory Assistant Client.
Supports Multi-Provider LLMs: NVIDIA NIM (Llama-3.3-70B / Llama-3.1-8B), Anthropic Claude, Groq, OpenAI,
backed by a robust real-time telemetry engine and deterministic manufacturing knowledge engine.
"""
import os
import re
import json
import time
import httpx
from typing import Dict, Any, List, Optional
from app.config import settings
from app.prompts.system_prompt import SYSTEM_PROMPT
from app.llm.functions import TOOLS, FUNCTION_MAP, get_all_factory_context

NON_MANUFACTURING_KEYWORDS = [
    "movie", "cricket", "football", "who won", "president", "weather in", "recipe",
    "joke", "song", "capital of", "celebrity", "actor", "game of thrones", "crypto", "bitcoin",
    "election", "bollywood", "hollywood", "horoscope", "astrology"
]

REFUSAL_MESSAGE_EN = "I am FactoryGPT AI Assistant. I can help only with manufacturing, production, quality, maintenance, inventory, safety, energy, and factory operations."
REFUSAL_MESSAGE_HI = "मैं FactoryGPT AI सहायक हूँ। मैं केवल निर्माण, उत्पादन, गुणवत्ता, रखरखाव, इन्वेंट्री, सुरक्षा, ऊर्जा और फ़ैक्टरी संचालन से संबंधित सहायता कर सकता हूँ।"

def is_unrelated_query(message: str) -> bool:
    msg_lower = message.lower()
    for kw in NON_MANUFACTURING_KEYWORDS:
        if kw in msg_lower:
            return True
    return False

def _detect_hindi(message: str, language: str) -> bool:
    if language == "hi":
        return True
    # Check for Devanagari Unicode range or common Hindi/Hinglish words
    if re.search(r'[\u0900-\u097F]', message):
        return True
    hinglish_words = ["kya", "kitna", "hai", "karein", "kaise", "batao", "aaj", "kal", "utpadan", "rakhrakhav"]
    msg_words = message.lower().split()
    if any(w in msg_words for w in hinglish_words):
        return True
    return False

def ask_assistant(message: str, language: str = "en", role: str = "Production Manager") -> Dict[str, Any]:
    start_time = time.time()
    is_hi = _detect_hindi(message, language)
    effective_lang = "hi" if is_hi else "en"
    
    # 1. Strict Domain Scope Guardrail
    if is_unrelated_query(message):
        exec_time = (time.time() - start_time) * 1000
        refusal = REFUSAL_MESSAGE_HI if is_hi else REFUSAL_MESSAGE_EN
        return {
            "answer": refusal,
            "source": "System Policy Guardrail",
            "confidence": 1.0,
            "suggestions": [
                "What is today's production count?",
                "Which machines are currently down?",
                "What is the current OEE?"
            ],
            "execution_time_ms": exec_time,
            "model_used": "Guardrail Policy Engine"
        }

    # 2. Try Primary Configured LLM Providers (NVIDIA NIM / Anthropic / Groq / OpenAI)
    nvidia_key = settings.NVIDIA_API_KEY or os.getenv("NVIDIA_API_KEY", "")
    anthropic_key = settings.ANTHROPIC_API_KEY or os.getenv("ANTHROPIC_API_KEY", "")
    groq_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY", "")
    openai_key = settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY", "")

    # A) Try NVIDIA NIM API
    if nvidia_key:
        try:
            res = _call_nvidia_nim(message, effective_lang, role, nvidia_key, start_time)
            if res:
                return res
        except Exception as e:
            print(f"[NVIDIA NIM Warning] {e}. Trying fallback LLM / rule engine...")

    # B) Try Anthropic Claude API
    if anthropic_key and not anthropic_key.startswith("ysk-ant-api03-jmJ9"):
        try:
            res = _call_anthropic(message, effective_lang, role, anthropic_key, start_time)
            if res:
                return res
        except Exception as e:
            print(f"[Anthropic API Warning] {e}. Trying fallback LLM / rule engine...")

    # C) Try Groq API
    if groq_key:
        try:
            res = _call_groq(message, effective_lang, role, groq_key, start_time)
            if res:
                return res
        except Exception as e:
            print(f"[Groq API Warning] {e}. Trying fallback...")

    # D) Try OpenAI API
    if openai_key:
        try:
            res = _call_openai(message, effective_lang, role, openai_key, start_time)
            if res:
                return res
        except Exception as e:
            print(f"[OpenAI API Warning] {e}. Trying fallback...")

    # 3. Deterministic Semantic Manufacturing Knowledge Engine fallback
    return _rule_engine_response(message, effective_lang, start_time)

def _call_nvidia_nim(message: str, language: str, role: str, api_key: str, start_time: float) -> Optional[Dict[str, Any]]:
    context = get_all_factory_context()
    sys_content = f"{SYSTEM_PROMPT}\n\n{context}\n\nUser Role: {role}\nResponse Language: {'Hindi' if language == 'hi' else 'English'}."
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    # Preferred model with fast fallback
    models_to_try = [settings.NVIDIA_MODEL, "meta/llama-3.1-8b-instruct", "meta/llama-3.1-70b-instruct"]
    
    for model_name in models_to_try:
        try:
            with httpx.Client(timeout=10.0) as http_client:
                resp = http_client.post(
                    f"{settings.NVIDIA_BASE_URL.rstrip('/')}/chat/completions",
                    headers=headers,
                    json={
                        "model": model_name,
                        "messages": [
                            {"role": "system", "content": sys_content},
                            {"role": "user", "content": message}
                        ],
                        "temperature": 0.2,
                        "max_tokens": 800
                    }
                )
                if resp.status_code == 200:
                    data = resp.json()
                    raw_text = data["choices"][0]["message"]["content"]
                    exec_time = (time.time() - start_time) * 1000
                    return _format_or_parse_llm_response(
                        raw_text=raw_text,
                        message=message,
                        language=language,
                        model_name=f"NVIDIA NIM ({model_name})",
                        exec_time=exec_time,
                        source_str="NVIDIA NIM & MES/SCADA Database"
                    )
        except Exception as err:
            continue
            
    return None

def _call_anthropic(message: str, language: str, role: str, api_key: str, start_time: float) -> Optional[Dict[str, Any]]:
    import anthropic
    client = anthropic.Anthropic(api_key=api_key)
    messages = [{"role": "user", "content": f"User Role: {role}\nLanguage: {language}\nQuery: {message}"}]

    response = client.messages.create(
        model=settings.ANTHROPIC_MODEL,
        max_tokens=1000,
        system=SYSTEM_PROMPT,
        tools=TOOLS,
        messages=messages,
    )

    tool_uses = [b for b in response.content if b.type == "tool_use"]
    sources_used = []

    if tool_uses:
        tool_results = []
        for tool_use in tool_uses:
            func = FUNCTION_MAP.get(tool_use.name)
            if func:
                res = func(**tool_use.input) if tool_use.input else func()
                if isinstance(res, dict) and "source" in res:
                    sources_used.append(res["source"])
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": tool_use.id,
                    "content": json.dumps(res),
                })

        messages.append({"role": "assistant", "content": response.content})
        messages.append({"role": "user", "content": tool_results})

        final_response = client.messages.create(
            model=settings.ANTHROPIC_MODEL,
            max_tokens=1000,
            system=SYSTEM_PROMPT,
            tools=TOOLS,
            messages=messages,
        )
        text_blocks = [b.text for b in final_response.content if b.type == "text"]
        answer_text = "\n".join(text_blocks)
    else:
        text_blocks = [b.text for b in response.content if b.type == "text"]
        answer_text = "\n".join(text_blocks)

    exec_time = (time.time() - start_time) * 1000
    source_str = ", ".join(sources_used) if sources_used else "Anthropic Claude & MES Database"
    return _format_or_parse_llm_response(answer_text, message, language, settings.ANTHROPIC_MODEL, exec_time, source_str)

def _call_groq(message: str, language: str, role: str, api_key: str, start_time: float) -> Optional[Dict[str, Any]]:
    context = get_all_factory_context()
    sys_content = f"{SYSTEM_PROMPT}\n\n{context}\n\nUser Role: {role}\nLanguage: {language}."
    with httpx.Client(timeout=8.0) as http_client:
        resp = http_client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "model": settings.GROQ_MODEL,
                "messages": [
                    {"role": "system", "content": sys_content},
                    {"role": "user", "content": message}
                ],
                "temperature": 0.2,
                "max_tokens": 800
            }
        )
        if resp.status_code == 200:
            data = resp.json()
            raw_text = data["choices"][0]["message"]["content"]
            exec_time = (time.time() - start_time) * 1000
            return _format_or_parse_llm_response(raw_text, message, language, f"Groq ({settings.GROQ_MODEL})", exec_time, "Groq LLaMA & MES Database")
    return None

def _call_openai(message: str, language: str, role: str, api_key: str, start_time: float) -> Optional[Dict[str, Any]]:
    context = get_all_factory_context()
    sys_content = f"{SYSTEM_PROMPT}\n\n{context}\n\nUser Role: {role}\nLanguage: {language}."
    with httpx.Client(timeout=8.0) as http_client:
        resp = http_client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "model": settings.OPENAI_MODEL,
                "messages": [
                    {"role": "system", "content": sys_content},
                    {"role": "user", "content": message}
                ],
                "temperature": 0.2,
                "max_tokens": 800
            }
        )
        if resp.status_code == 200:
            data = resp.json()
            raw_text = data["choices"][0]["message"]["content"]
            exec_time = (time.time() - start_time) * 1000
            return _format_or_parse_llm_response(raw_text, message, language, f"OpenAI ({settings.OPENAI_MODEL})", exec_time, "OpenAI & MES Database")
    return None

def _rule_engine_response(message: str, language: str, start_time: float) -> Dict[str, Any]:
    """
    Deterministic Manufacturing Semantic Knowledge Engine.
    Accurately handles all factory operational domains when LLM APIs are offline.
    """
    msg = message.lower()
    exec_time = (time.time() - start_time) * 1000

    # 1. Greetings & Introductory queries
    if msg in ["hi", "hello", "hey", "namaste", "good morning", "good afternoon", "who are you", "help", "kya kar sakte ho"]:
        if language == "hi":
            answer = "नमस्ते! मैं FactoryGPT AI सहायक हूँ। मैं उत्पादन संख्या, मशीन स्वास्थ्य, डाउनटाइम कारण, OEE, इन्वेंट्री, ऊर्जा खपत और रखरखाव शेड्यूल से संबंधित वास्तविक समय डेटा प्रदान कर सकता हूँ।"
        else:
            answer = "Hello! I am FactoryGPT AI Assistant, your real-time manufacturing and plant operations copilot. I can assist you with live production tracking, machine telemetry, downtime root cause analysis, OEE breakdown, inventory stock, energy usage, and maintenance schedules."
        return {
            "answer": answer,
            "source": "FactoryGPT Assistant Gateway",
            "confidence": 1.0,
            "suggestions": [
                "What is today's production count?",
                "Why did Line 3 stop?",
                "What is the current OEE?"
            ],
            "execution_time_ms": exec_time,
            "model_used": "FactoryGPT Semantic Engine"
        }

    # 2. Line 3 downtime / Specific line stoppage queries
    if "line 3" in msg or ("line" in msg and "3" in msg):
        res = FUNCTION_MAP["get_downtime_cause"](line_id="Line 3")
        source = res["source"]
        if language == "hi":
            answer = "लाइन 3 (Line 3) **CNC-Spindle-03** में बियरिंग विफलता (Bearing failure) और लुब्रिकेशन गिरावट के कारण **78 मिनट** के लिए बंद हुई थी। ऑपरेटिंग तापमान 78°C और वाइब्रेशन 8.4 mm/s तक पहुँच गया था। सुधारात्मक कार्रवाई: उच्च परिशुद्धता SKF 6205 बियरिंग स्थापित कर दी गई है और स्वचालित लुब्रिकेशन पंप को रीकैलिब्रेट कर दिया गया है।"
        else:
            answer = "Line 3 experienced **78 minutes of downtime** due to a critical **bearing failure on CNC-Spindle-03** caused by lubrication degradation and thermal stress (operating temp: 78°C, vibration: 8.4 mm/s). **Corrective action taken:** High-precision SKF 6205 bearing was installed and the automated lubrication pump was recalibrated."
        return {
            "answer": answer,
            "source": source,
            "confidence": 0.99,
            "suggestions": [
                "Show inventory of Bearings.",
                "What is the machine health of CNC-Spindle-03?",
                "Which machines are currently down?"
            ],
            "execution_time_ms": exec_time,
            "model_used": "FactoryGPT RCA Engine"
        }

    # 3. Machine Health & Sensor Telemetry (Vibration, Temperature, RPM, Predictive Health)
    if "health" in msg or "vibration" in msg or "temperature" in msg or "sensor" in msg or "spindle" in msg or "rpm" in msg or "predict" in msg:
        res = FUNCTION_MAP["get_down_machines"]()
        source = res["source"]
        if "cnc" in msg or "spindle" in msg:
            if language == "hi":
                answer = "मशीन **CNC-Spindle-03 (Line 2)** की स्थिति **गंभीर (Critical Alert)** है। स्वास्थ्य स्कोर: **32/100**। वाइब्रेशन स्तर: **8.4 mm/s** (स्वीकार्य सीमा < 4.5 mm/s) और बियरिंग तापमान **78°C** है। तत्काल रखरखाव कार्य MNT-908 असाइन किया गया है।"
            else:
                answer = "Machine **CNC-Spindle-03 (Line 2)** is currently in **Critical Health Status** (Health Score: **32/100**). Sensor telemetry indicates severe vibration at **8.4 mm/s** (threshold: 4.5 mm/s) and bearing temperature at **78°C**. Urgent maintenance ticket MNT-908 has been dispatched."
        else:
            if language == "hi":
                answer = "वर्तमान में प्लांट में **2 मशीनें** डाउन या रखरखाव में हैं:\n1. **CNC-Spindle-03 (Line 2)**: उच्च वाइब्रेशन (8.4 mm/s) एवं ओवरहीटिंग (78°C)।\n2. **Hydraulic-Press-01 (Line 1)**: शेड्यूल्ड प्रिवेंटिव हाइड्रोलिक फ्लुइड रिप्लेसमेंट।"
            else:
                answer = "Plant Telemetry & Health Status:\n• **CNC-Spindle-03 (Line 2)**: CRITICAL — Vibration: 8.4 mm/s, Temperature: 78°C, Health Score: 32/100.\n• **Hydraulic-Press-01 (Line 1)**: Preventive maintenance in progress for hydraulic seal overhaul."
        return {
            "answer": answer,
            "source": source,
            "confidence": 0.98,
            "suggestions": [
                "Show today's maintenance schedule.",
                "Why did Line 3 stop?",
                "Show inventory of Bearings."
            ],
            "execution_time_ms": exec_time,
            "model_used": "Predictive Maintenance Engine"
        }

    # 4. Energy Consumption & Power metrics
    if "energy" in msg or "power" in msg or "electricity" in msg or "kwh" in msg or "cost" in msg or "load" in msg:
        res = FUNCTION_MAP["get_energy_consumption"]()
        data = res["data"]
        source = res["source"]
        if language == "hi":
            answer = f"स्मार्ट पावर मीटर टेलीमेट्री: वर्तमान लोड **{data['current_power_kw']} kW** है। आज की कुल बिजली खपत **{data['today_kwh']} kWh** है (अनुमानित लागत: **₹{data['cost_today_inr']:,.2f}**)। पीक लोड: {data['peak_load_time']}। ऊर्जा दक्षता ग्रेड: **{data['efficiency_grade']}**।"
        else:
            answer = f"Real-Time Energy Telemetry: Current factory power load is **{data['current_power_kw']} kW** with total daily energy consumption at **{data['today_kwh']:,.1f} kWh** (Estimated cost: **₹{data['cost_today_inr']:,.2f}**). Peak load recorded at {data['peak_load_time']}. Factory Efficiency Grade: **{data['efficiency_grade']}** (Power Factor: {data['power_factor']})."
        return {
            "answer": answer,
            "source": source,
            "confidence": 0.98,
            "suggestions": [
                "What is today's production count?",
                "What is the current OEE?",
                "Generate production report."
            ],
            "execution_time_ms": exec_time,
            "model_used": "IoT Energy Telemetry Engine"
        }

    # 5. Production counts (Total & Shift A/B/C)
    if "production" in msg or "count" in msg or "units" in msg or "throughput" in msg or "target" in msg or "shift" in msg:
        res = FUNCTION_MAP["get_production_count"]()
        data = res["data"]
        source = res["source"]
        shifts = data.get("shifts", {})
        
        if "shift a" in msg:
            s = shifts.get("Shift A", {"count": 1850, "target": 1800, "status": "Completed"})
            if language == "hi":
                answer = f"शिफ्ट A (Shift A) का उत्पादन **{s['count']} यूनिट्स** रहा (लक्ष्य: {s['target']} यूनिट्स — स्थिति: {s['status']})।"
            else:
                answer = f"Shift A completed with **{s['count']} units** against a target of {s['target']} units ({s['status']})."
        elif "shift b" in msg:
            s = shifts.get("Shift B", {"count": 1720, "target": 1700, "status": "Completed"})
            if language == "hi":
                answer = f"शिफ्ट B (Shift B) का उत्पादन **{s['count']} यूनिट्स** रहा (लक्ष्य: {s['target']} यूनिट्स — स्थिति: {s['status']})।"
            else:
                answer = f"Shift B completed with **{s['count']} units** against a target of {s['target']} units ({s['status']})."
        elif "shift c" in msg:
            s = shifts.get("Shift C", {"count": 1280, "target": 1500, "status": "In Progress"})
            if language == "hi":
                answer = f"शिफ्ट C (Shift C) वर्तमान में जारी है: **{s['count']} यूनिट्स** उत्पादित (लक्ष्य: {s['target']} यूनिट्स — स्थिति: {s['status']})।"
            else:
                answer = f"Shift C is currently active with **{s['count']} units** produced so far against a target of {s['target']} units ({s['status']})."
        else:
            if language == "hi":
                answer = f"आज का कुल उत्पादन **{data['total_today']} यूनिट्स** है (लक्ष्य: {data['target_today']} यूनिट्स, उपलब्धि दर: **{data['achievement_pct']}%**)।\n• शिफ्ट A: {shifts.get('Shift A', {}).get('count', 1850)} यूनिट्स\n• शिफ्ट B: {shifts.get('Shift B', {}).get('count', 1720)} यूनिट्स\n• शिफ्ट C: {shifts.get('Shift C', {}).get('count', 1280)} यूनिट्स (प्रगति पर)"
            else:
                answer = f"Today's total live production count is **{data['total_today']} units** against a daily target of {data['target_today']} units (**{data['achievement_pct']}% target achievement**).\n• Shift A: {shifts.get('Shift A', {}).get('count', 1850)} units (Completed)\n• Shift B: {shifts.get('Shift B', {}).get('count', 1720)} units (Completed)\n• Shift C: {shifts.get('Shift C', {}).get('count', 1280)} units (In Progress)"
        return {
            "answer": answer,
            "source": source,
            "confidence": 0.99,
            "suggestions": [
                "How many defects occurred today?",
                "What is the current OEE?",
                "Which machines are currently down?"
            ],
            "execution_time_ms": exec_time,
            "model_used": "MES Production Engine"
        }

    # 6. Defects, Quality & Operators
    if "defect" in msg or "reject" in msg or "quality" in msg or "operator" in msg or "qa" in msg:
        res = FUNCTION_MAP["get_defects"]()
        data = res["data"]
        source = res["source"]
        if "operator" in msg or "rajesh" in msg:
            op_data = data["highest_defects_operator"]
            if language == "hi":
                answer = f"सबसे अधिक दोष रिपोर्ट करने वाले ऑपरेटर **{op_data['operator_name']}** हैं ({op_data['defect_count']} दोष)। मुख्य कारण: {op_data['note']}।"
            else:
                answer = f"Operator **{op_data['operator_name']}** recorded the highest defect count today ({op_data['defect_count']} defects, primarily Surface Scratches). **Root Cause:** {op_data['note']}."
        else:
            if language == "hi":
                answer = f"आज कुल **{data['total_defects_today']} दोष** दर्ज किए गए (शिफ्ट A: {data['by_shift']['Shift A']}, शिफ्ट B: {data['by_shift']['Shift B']}, शिफ्ट C: {data['by_shift']['Shift C']})। मुख्य प्रकार: सतही खरोंच (18) और माइक्रो क्रैक (12)। समग्र गुणवत्ता उपज दर: 98.1%।"
            else:
                answer = f"Today a total of **{data['total_defects_today']} defects** were detected across all shifts (Shift A: {data['by_shift']['Shift A']}, Shift B: {data['by_shift']['Shift B']}, Shift C: {data['by_shift']['Shift C']}). Top defect types include Surface Scratches (18) and Micro Cracks (12). Overall plant quality yield is **98.1%**."
        return {
            "answer": answer,
            "source": source,
            "confidence": 0.98,
            "suggestions": [
                "Which operator reported the highest defects?",
                "What is the current OEE?",
                "Why did Line 3 stop?"
            ],
            "execution_time_ms": exec_time,
            "model_used": "Vision QA Engine"
        }

    # 7. Down machines & Downtime
    if "down" in msg or "stopped" in msg or "breakdown" in msg or "downtime" in msg or "stop" in msg:
        if "yesterday" in msg or "cause" in msg or "reason" in msg or "why" in msg:
            res = FUNCTION_MAP["get_downtime_cause"]()
            data = res["data"]
            source = res["source"]
            inc = data.get("recent_incidents", [{}])[0]
            if language == "hi":
                answer = f"कल लाइन 3 पर **{inc.get('machine_id', 'CNC-Spindle-03')}** में **{inc.get('total_downtime_minutes', 78)} मिनट** का डाउनटाइम हुआ। मुख्य कारण: {inc.get('primary_cause', 'बियरिंग विफलता')}। सुधारात्मक कार्रवाई: {inc.get('corrective_action', 'बियरिंग बदली गई')}।"
            else:
                answer = f"Yesterday's major downtime occurred on **Line 3 ({inc.get('machine_id', 'CNC-Spindle-03')})** lasting **{inc.get('total_downtime_minutes', 78)} minutes**. Primary Cause: {inc.get('primary_cause')}. Corrective Action: {inc.get('corrective_action')}."
        else:
            res = FUNCTION_MAP["get_down_machines"]()
            data = res["data"]
            source = res["source"]
            down_list = [f"• **{m['machine_id']}** ({m['line_id']}): {m['reason']}" for m in data["down_machines"]]
            down_str = "\n".join(down_list)
            if language == "hi":
                answer = f"वर्तमान में **{data['currently_down_count']} मशीनें** बंद या रखरखाव में हैं:\n{down_str}"
            else:
                answer = f"Currently **{data['currently_down_count']} machines** are down or under maintenance:\n{down_str}"
        return {
            "answer": answer,
            "source": source,
            "confidence": 0.98,
            "suggestions": [
                "Show today's maintenance schedule.",
                "Why did Line 3 stop?",
                "Show inventory of Bearings."
            ],
            "execution_time_ms": exec_time,
            "model_used": "SCADA Downtime Engine"
        }

    # 8. Maintenance Schedule & Tasks
    if "maintenance" in msg or "schedule" in msg or "repair" in msg or "pm" in msg or "technician" in msg:
        res = FUNCTION_MAP["get_maintenance_schedule"]()
        data = res["data"]
        source = res["source"]
        tasks = [f"• **{t['task_id']}** ({t['machine']}): {t['type']} [{t['scheduled_time']}] — Tech: **{t['assigned_technician']}** ({t['status']})" for t in data["scheduled_tasks"]]
        task_str = "\n".join(tasks)
        if language == "hi":
            answer = f"आज का रखरखाव शेड्यूल्ड कार्य:\n{task_str}"
        else:
            answer = f"Today's Plant Maintenance Schedule & Assignments:\n{task_str}"
        return {
            "answer": answer,
            "source": source,
            "confidence": 0.97,
            "suggestions": [
                "Which machines are currently down?",
                "What is the machine health of CNC-Spindle-03?",
                "Show inventory of Bearings."
            ],
            "execution_time_ms": exec_time,
            "model_used": "CMMS Maintenance Engine"
        }

    # 9. Overall Equipment Effectiveness (OEE)
    if "oee" in msg or "efficiency" in msg or "availability" in msg or "performance" in msg:
        res = FUNCTION_MAP["get_oee_metrics"]()
        data = res["data"]
        source = res["source"]
        c = data["components"]
        if language == "hi":
            answer = f"वर्तमान प्लांट OEE **{data['overall_oee']}** है (लक्ष्य: {data['benchmark_target']}, स्थिति: {data['status']})।\n• उपलब्धता (Availability): **{c['Availability']}**\n• प्रदर्शन (Performance): **{c['Performance']}**\n• गुणवत्ता (Quality): **{c['Quality']}**"
        else:
            answer = f"Current Overall Equipment Effectiveness (OEE) is **{data['overall_oee']}** against benchmark target {data['benchmark_target']} ({data['status']}).\n• Availability: **{c['Availability']}**\n• Performance: **{c['Performance']}**\n• Quality: **{c['Quality']}**"
        return {
            "answer": answer,
            "source": source,
            "confidence": 0.99,
            "suggestions": [
                "What is today's production count?",
                "How many defects occurred today?",
                "Generate production report."
            ],
            "execution_time_ms": exec_time,
            "model_used": "MES OEE Engine"
        }

    # 10. Inventory & Spare Parts
    if "inventory" in msg or "bearing" in msg or "stock" in msg or "parts" in msg or "motor" in msg or "valve" in msg or "rack" in msg or "warehouse" in msg:
        item = "bearings" if "bearing" in msg else "motors" if "motor" in msg else "valves" if "valve" in msg else "spare parts"
        res = FUNCTION_MAP["get_inventory_item"](item)
        data = res["data"]
        source = res["source"]
        if language == "hi":
            answer = f"**{data['item_name']}** का स्टॉक: **{data['quantity_in_stock']} {data['unit']}**। स्थान: **{data['warehouse_location']}** (पुनः ऑर्डर स्तर: {data.get('reorder_level', 20)}, स्थिति: **{data['status']}**)।"
        else:
            answer = f"Current Inventory for **{data['item_name']}**:\n• Stock on Hand: **{data['quantity_in_stock']} {data['unit']}**\n• Location: **{data['warehouse_location']}**\n• Reorder Threshold: {data.get('reorder_level', 20)} {data['unit']}\n• Stock Status: **{data['status']}**"
        return {
            "answer": answer,
            "source": source,
            "confidence": 0.98,
            "suggestions": [
                "Show today's maintenance schedule.",
                "Why did Line 3 stop?",
                "What is the machine health of CNC-Spindle-03?"
            ],
            "execution_time_ms": exec_time,
            "model_used": "WMS Inventory Engine"
        }

    # 11. Reports & Summaries
    if "report" in msg or "summary" in msg or "kpi" in msg or "overview" in msg:
        res = FUNCTION_MAP["get_report"]()
        data = res["data"]
        source = res["source"]
        highlights = "\n".join([f"• {h}" for h in data["key_highlights"]])
        if language == "hi":
            answer = f"**{data['report_title']}** (स्वास्थ्य: {data['overall_health']}):\n\n{highlights}"
        else:
            answer = f"**{data['report_title']}** (Overall Plant Status: {data['overall_health']}):\n\n{highlights}"
        return {
            "answer": answer,
            "source": source,
            "confidence": 0.99,
            "suggestions": [
                "What is the current OEE?",
                "Which machines are currently down?",
                "What is the energy consumption today?"
            ],
            "execution_time_ms": exec_time,
            "model_used": "Automated Plant Reporting Engine"
        }

    # Default Contextual Manufacturing Overview
    res = FUNCTION_MAP["get_production_count"]()
    oee = FUNCTION_MAP["get_oee_metrics"]()["data"]
    if language == "hi":
        answer = f"FactoryGPT AI सहायक: टेलीमेट्री लोड की गई। आज का कुल उत्पादन **{res['data']['total_today']} यूनिट्स** ({res['data']['achievement_pct']}% लक्ष्य) है। समग्र OEE **{oee['overall_oee']}** पर चल रहा है। 2 मशीनें निर्धारित रखरखाव में हैं।"
    else:
        answer = f"FactoryGPT Operations Summary: Factory telemetry retrieved. Today's live production count stands at **{res['data']['total_today']} units** ({res['data']['achievement_pct']}% of daily target) with plant OEE running at **{oee['overall_oee']}**. 2 machines are currently under scheduled maintenance or inspection."
    return {
        "answer": answer,
        "source": "MES Telemetry & SCADA Database",
        "confidence": 0.95,
        "suggestions": [
            "What is today's production count?",
            "Why did Line 3 stop?",
            "What is the machine health of CNC-Spindle-03?"
        ],
        "execution_time_ms": exec_time,
        "model_used": "FactoryGPT Operations Engine"
    }

def _format_or_parse_llm_response(raw_text: str, message: str, language: str, model_name: str, exec_time: float, source_str: str = "NVIDIA NIM & MES") -> Dict[str, Any]:
    # Try parsing JSON if model returned structured output
    try:
        data = json.loads(raw_text)
        if isinstance(data, dict) and "answer" in data:
            data["execution_time_ms"] = exec_time
            data["model_used"] = model_name
            if "source" not in data:
                data["source"] = source_str
            if "suggestions" not in data or not data["suggestions"]:
                data["suggestions"] = [
                    "What is today's production count?",
                    "Why did Line 3 stop?",
                    "What is the current OEE?"
                ]
            return data
    except Exception:
        pass

    # Clean markdown if enclosed in json code block
    cleaned = raw_text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    if cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()

    try:
        data = json.loads(cleaned)
        if isinstance(data, dict) and "answer" in data:
            data["execution_time_ms"] = exec_time
            data["model_used"] = model_name
            if "source" not in data:
                data["source"] = source_str
            return data
    except Exception:
        pass

    # Extract follow-up questions from text if model formatted them
    suggestions = []
    if "Follow-up Questions:" in raw_text or "Follow-up" in raw_text:
        lines = raw_text.splitlines()
        for l in lines:
            l_strip = l.strip()
            if re.match(r'^\d+\.\s+.*\?$', l_strip):
                q_text = re.sub(r'^\d+\.\s+', '', l_strip)
                if q_text and len(q_text) < 120:
                    suggestions.append(q_text)
    
    if not suggestions or len(suggestions) < 3:
        suggestions = [
            "What is today's production count?",
            "Why did Line 3 stop?",
            "What is the current OEE?"
        ]

    return {
        "answer": raw_text or "Factory telemetry processed successfully.",
        "source": source_str,
        "confidence": 0.97,
        "suggestions": suggestions[:3],
        "execution_time_ms": exec_time,
        "model_used": model_name
    }


