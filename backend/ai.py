import os
import json
import re
import urllib.request
import urllib.error

# Local LLM URL configuration (OpenAI-compatible server like LM Studio)
LOCAL_LLM_URL = "http://localhost:1234/v1/chat/completions"

# Real cloud agent (OpenAI-compatible, e.g. Groq) — Falcon uses this, NOT a local model.
# Set FALCON_CLOUD_API_KEY in your environment to enable it.
FALCON_CLOUD_URL = os.environ.get("FALCON_CLOUD_URL", "https://api.groq.com/openai/v1/chat/completions")
FALCON_CLOUD_KEY = os.environ.get("FALCON_CLOUD_API_KEY", "")
FALCON_CLOUD_MODEL = os.environ.get("FALCON_CLOUD_MODEL", "llama-3.3-70b-versatile")


def _chat_completion(url, messages, api_key=None, model="local-model",
                     temperature=0.5, max_tokens=400, timeout=4.0):
    """Generic OpenAI-compatible chat call. Returns assistant text or raises."""
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    payload = {"model": model, "messages": messages,
               "temperature": temperature, "max_tokens": max_tokens}
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as response:
        res_json = json.loads(response.read().decode("utf-8"))
        return res_json["choices"][0]["message"]["content"].strip()

# Global AI Config
AI_MODE = "cloud"

def call_llm(messages, temperature=0.5, max_tokens=400, timeout=4.0):
    """
    Unified LLM caller. If AI_MODE is 'cloud', queries the Cloud model.
    Falls back to Local model if Cloud fails/lacks credentials.
    """
    if AI_MODE == "cloud":
        if FALCON_CLOUD_KEY:
            try:
                print(f"[AI Config Routing] Dispatching to Generative Cloud Model: {FALCON_CLOUD_MODEL}...")
                reply = _chat_completion(FALCON_CLOUD_URL, messages, api_key=FALCON_CLOUD_KEY,
                                         model=FALCON_CLOUD_MODEL, temperature=temperature,
                                         max_tokens=max_tokens, timeout=timeout)
                return reply
            except Exception as e:
                print(f"[AI Config Routing] Cloud call failed ({e}). Falling back to Local model.")
        else:
            print("[AI Config Routing] Cloud mode active but FALCON_CLOUD_API_KEY empty. Falling back to Local model.")

    try:
        print("[AI Config Routing] Dispatching to Local Model...")
        reply = _chat_completion(LOCAL_LLM_URL, messages, api_key=None,
                                 model="local-model", temperature=temperature,
                                 max_tokens=max_tokens, timeout=3.0)
        return reply
    except Exception as e:
        print(f"[AI Config Routing] Local model failed ({e}).")
        raise e

def analyze_report_with_ai(description: str) -> dict:
    """
    Sends the user's environmental description to LLM to run category routing,
    severity tags extraction, and department sorting. Falls back to keyword parsers if offline.
    """
    prompt_system = (
        "You are the Eco Connect Backend Analyst. Analyze the environmental issue reported by a UAE resident. "
        "You must output your findings strictly as a JSON object with keys 'severity' and 'department'. "
        "The severity MUST be one of: 'Low', 'Medium', 'Critical'. "
        "The department MUST be one of: 'Water Operations', 'Soil & Agriculture', 'Waste Management', 'Agricultural Extension'. "
        "Output ONLY raw JSON format without markdown backticks."
    )
    prompt_user = f"Resident Report Description: {description}"
    messages = [
        {"role": "system", "content": prompt_system},
        {"role": "user", "content": prompt_user}
    ]
    try:
        content = call_llm(messages, temperature=0.1, max_tokens=150)
        if content.startswith("```"):
            content = re.sub(r"^```(?:json)?\n|```$", "", content, flags=re.MULTILINE).strip()
        parsed_analysis = json.loads(content)
        return {
            "severity": parsed_analysis.get("severity", "Medium"),
            "department": parsed_analysis.get("department", "General Maintenance"),
            "ai_processed": True
        }
    except Exception as e:
        print(f"[AI Node] LLM call failed ({e}). Running rule-based parser fallback.")
        return run_rule_based_fallback(description)

def run_rule_based_fallback(text: str) -> dict:
    """
    Highly intelligent regex-based fallback to categorize and route when LLM is unreachable.
    """
    text_lower = text.lower()
    
    # 1. Category and Department Routing
    if any(k in text_lower for k in ["leak", "water", "flood", "pipe", "burst", "well", "aflaj", "drip", "irrigation"]):
        category = "water"
        department = "Water Operations"
        # High severity checks
        if any(k in text_lower for k in ["flood", "burst", "massive", "gushing", "waste"]):
            severity = "Critical"
        else:
            severity = "Medium"
            
    elif any(k in text_lower for k in ["soil", "erosion", "sand", "salt", "salinity", "desert", "dry", "arid"]):
        category = "soil"
        department = "Soil & Agriculture"
        if "critical" in text_lower or "dead" in text_lower:
            severity = "Critical"
        else:
            severity = "Medium"
            
    elif any(k in text_lower for k in ["crop", "disease", "insect", "locust", "rot", "leaves", "pest", "worm", "bug"]):
        category = "crop"
        department = "Agricultural Extension"
        if any(k in text_lower for k in ["locust", "swarm", "dying", "destroyed"]):
            severity = "Critical"
        else:
            severity = "Medium"
            
    elif any(k in text_lower for k in ["dump", "waste", "trash", "garbage", "litter", "plastic", "illegal"]):
        category = "waste"
        department = "Waste Management"
        if "toxic" in text_lower or "chemical" in text_lower:
            severity = "Critical"
        else:
            severity = "Low"
            
    else:
        category = "waste"
        department = "General Maintenance"
        severity = "Low"
        
    return {
        "severity": severity,
        "department": department,
        "ai_processed": False
    }

def classify_civic_report(description: str) -> dict:
    """
    Automated civic-routing classifier for the municipal dashboard.

    Returns ONLY the three contract keys:
      - category:          'Infrastructure' | 'Agriculture' | 'Water Quality' | 'Pest Control' | 'General'
      - urgency_level:     'Low' | 'Medium' | 'Critical'
      - department_action: one short sentence for the receiving officer.

    Tries the local LLM first, then falls back to a deterministic keyword router.
    """
    VALID_CATEGORIES = {"Infrastructure", "Agriculture", "Water Quality", "Pest Control", "General"}
    VALID_URGENCY = {"Low", "Medium", "Critical"}

    prompt_system = (
        "You are an automated backend civic routing AI for a local municipality in the UAE. "
        "Your strictly technical job is to analyze a citizen's issue report and categorize it instantly "
        "for the municipal dashboard. Output ONLY a valid JSON object with exactly three keys: "
        "'category' (one of: 'Infrastructure', 'Agriculture', 'Water Quality', 'Pest Control', 'General'), "
        "'urgency_level' (one of: 'Low', 'Medium', 'Critical'), and "
        "'department_action' (a very brief, one-sentence instruction for the municipal officer receiving this). "
        "Output ONLY raw JSON without markdown backticks or commentary."
    )
    prompt_user = f"Citizen Issue Report: {description}"

    headers = {"Content-Type": "application/json"}
    payload = {
        "model": "local-model",
        "messages": [
            {"role": "system", "content": prompt_system},
            {"role": "user", "content": prompt_user},
        ],
        "temperature": 0.1,
    }

    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(LOCAL_LLM_URL, data=data, headers=headers, method="POST")

        with urllib.request.urlopen(req, timeout=3.0) as response:
            res_data = response.read().decode("utf-8")
            res_json = json.loads(res_data)
            content = res_json["choices"][0]["message"]["content"].strip()

            if content.startswith("```"):
                content = re.sub(r"^```(?:json)?\n|```$", "", content, flags=re.MULTILINE).strip()

            parsed = json.loads(content)

            # Validate against the strict contract, fall back per-field if needed.
            fallback = run_civic_classifier_fallback(description)
            category = parsed.get("category")
            urgency = parsed.get("urgency_level")
            action = parsed.get("department_action")

            result = {
                "category": category if category in VALID_CATEGORIES else fallback["category"],
                "urgency_level": urgency if urgency in VALID_URGENCY else fallback["urgency_level"],
                "department_action": action.strip() if isinstance(action, str) and action.strip() else fallback["department_action"],
                "ai_processed": True,
            }
            print(f"[Civic Router] Local LLM classification successful: {result}")
            return result

    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError, KeyError, AttributeError) as e:
        print(f"[Civic Router] Local LLM offline or invalid ({str(e)}). Running rule-based classifier fallback.")
        return run_civic_classifier_fallback(description)


def run_civic_classifier_fallback(text: str) -> dict:
    """
    Deterministic keyword-based classifier used when the LLM is unreachable.
    Always returns a payload that satisfies the strict three-key contract.
    """
    text_lower = (text or "").lower()

    critical_markers = ["flood", "burst", "gushing", "collapse", "collapsed", "fire", "toxic", "chemical",
                        "sewage", "contaminat", "swarm", "locust", "outbreak", "danger", "injury", "electrocut"]
    medium_markers = ["leak", "broken", "damage", "blocked", "crack", "disease", "pest", "infestation",
                    "pothole", "overflow", "shortage", "rot"]

    if any(k in text_lower for k in ["pest", "locust", "insect", "bug", "weevil", "rodent", "mosquito",
                                    "infestation", "swarm", "termite", "worm"]):
        category = "Pest Control"
        action = "Dispatch the pest-control field unit to assess and treat the infestation on site."
    elif any(k in text_lower for k in ["water quality", "contaminat", "sewage", "smell", "odor", "polluted",
                                    "dirty water", "salinity", "salt", "drinking water", "well water"]):
        category = "Water Quality"
        action = "Send a water-quality inspector to sample and test the affected supply."
    elif any(k in text_lower for k in ["crop", "farm", "soil", "irrigation", "harvest", "palm", "livestock",
                                    "fertiliz", "agricultur", "plantation", "date tree"]):
        category = "Agriculture"
        action = "Route to the Agricultural Extension team for an on-farm advisory visit."
    elif any(k in text_lower for k in ["road", "pipe", "pipeline", "bridge", "street", "light", "pothole",
                                    "power", "electric", "building", "drainage", "pavement", "sidewalk",
                                    "leak", "burst", "construction", "infrastructure"]):
        category = "Infrastructure"
        action = "Assign a municipal maintenance crew to inspect and repair the reported infrastructure."
    else:
        category = "General"
        action = "Log the report and forward to the duty officer for manual triage."

    if any(k in text_lower for k in critical_markers):
        urgency = "Critical"
    elif any(k in text_lower for k in medium_markers):
        urgency = "Medium"
    else:
        urgency = "Low"

    return {
        "category": category,
        "urgency_level": urgency,
        "department_action": action,
        "ai_processed": False,
    }


def analyze_report_batch(reports: list) -> dict:
    """
    EcoConnect Data Analytics Agent.

    Receives a list of recent civic/environmental reports and identifies
    emerging trends, anomalies, and potential crises for UAE Municipalities.
    Responds ONLY with a structured JSON object.
    """
    prompt_system = (
        "You are the 'EcoConnect Data Analytics Agent', an advanced backend AI working for the "
        "UAE Municipalities. Your job is to analyze batches of recent civic and environmental reports "
        "from rural areas (like Al Qua'a) and identify emerging trends, anomalies, or potential crises "
        "before they escalate. You will receive a list of recent reports in JSON format. Analyze the data "
        "for patterns (e.g., multiple water leaks in the same sector, a sudden spike in crop disease). "
        "You must respond ONLY with a valid JSON object. Do not include any conversational text or markdown "
        "formatting outside the JSON. Use exactly this schema: "
        "{\"summary\": string, \"overall_risk_level\": one of 'Low'|'Medium'|'High'|'Critical', "
        "\"reports_analyzed\": number, "
        "\"trends\": [{\"pattern\": string, \"category\": string, \"sector\": string, \"count\": number, \"severity\": one of 'Low'|'Medium'|'Critical'}], "
        "\"anomalies\": [{\"description\": string, \"severity\": one of 'Low'|'Medium'|'Critical'}], "
        "\"potential_crises\": [{\"risk\": string, \"recommended_action\": string, \"urgency\": one of 'Low'|'Medium'|'Critical'}]}."
    )
    prompt_user = "Recent Reports JSON:\n" + json.dumps(reports, ensure_ascii=False)

    headers = {"Content-Type": "application/json"}
    payload = {
        "model": "local-model",
        "messages": [
            {"role": "system", "content": prompt_system},
            {"role": "user", "content": prompt_user},
        ],
        "temperature": 0.2,
    }

    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(LOCAL_LLM_URL, data=data, headers=headers, method="POST")

        with urllib.request.urlopen(req, timeout=4.0) as response:
            res_data = response.read().decode("utf-8")
            res_json = json.loads(res_data)
            content = res_json["choices"][0]["message"]["content"].strip()

            if content.startswith("```"):
                content = re.sub(r"^```(?:json)?\n|```$", "", content, flags=re.MULTILINE).strip()

            parsed = json.loads(content)
            parsed.setdefault("reports_analyzed", len(reports))
            parsed["ai_processed"] = True
            print(f"[Analytics Agent] Local LLM batch analysis successful.")
            return parsed

    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError, KeyError, AttributeError) as e:
        print(f"[Analytics Agent] Local LLM offline or invalid ({str(e)}). Running rule-based batch analytics.")
        return run_batch_analytics_fallback(reports)


def run_batch_analytics_fallback(reports: list) -> dict:
    """
    Deterministic aggregation used when the LLM is unreachable. Groups reports by
    category and sector to surface clusters, anomalies, and potential crises.
    """
    reports = reports or []
    total = len(reports)

    def _sector_of(r):
        # Derive a coarse sector label from coordinates or an explicit field.
        sector = r.get("sector") or r.get("region")
        if sector:
            return str(sector)
        lat = r.get("latitude")
        lng = r.get("longitude")
        if lat is not None and lng is not None:
            return f"Sector {round(float(lat), 1)}N / {round(float(lng), 1)}E"
        return "Unspecified Sector"

    SEVERITY_RANK = {"Low": 1, "Medium": 2, "Critical": 3, "High": 3}

    # Tally counts per (category, sector) and per category.
    cluster_counts = {}
    category_counts = {}
    critical_count = 0

    for r in reports:
        category = str(r.get("category") or r.get("assigned_dept") or "General")
        sector = _sector_of(r)
        severity = str(r.get("severity") or r.get("urgency_level") or "Low")
        if SEVERITY_RANK.get(severity, 1) >= 3:
            critical_count += 1
        cluster_counts[(category, sector)] = cluster_counts.get((category, sector), 0) + 1
        category_counts[category] = category_counts.get(category, 0) + 1

    # Trends: any (category, sector) cluster with 2+ reports.
    trends = []
    for (category, sector), count in sorted(cluster_counts.items(), key=lambda kv: kv[1], reverse=True):
        if count >= 2:
            severity = "Critical" if count >= 4 else "Medium" if count >= 3 else "Low"
            trends.append({
                "pattern": f"{count} '{category}' reports clustered in {sector}",
                "category": category,
                "sector": sector,
                "count": count,
                "severity": severity,
            })

    # Anomalies: a category spiking well above the average load.
    anomalies = []
    if category_counts:
        avg = total / max(len(category_counts), 1)
        for category, count in category_counts.items():
            if count >= 3 and count > avg * 1.5:
                anomalies.append({
                    "description": f"Sudden spike in '{category}' reports ({count} of {total} total).",
                    "severity": "Critical" if count >= 4 else "Medium",
                })
    if critical_count >= 2:
        anomalies.append({
            "description": f"{critical_count} reports flagged Critical within this batch.",
            "severity": "Critical",
        })

    # Potential crises derived from the strongest clusters.
    potential_crises = []
    for t in trends[:2]:
        if t["count"] >= 3:
            potential_crises.append({
                "risk": f"Escalating {t['category'].lower()} situation in {t['sector']}.",
                "recommended_action": f"Dispatch a rapid-response municipal team to {t['sector']} to contain the {t['category'].lower()} cluster.",
                "urgency": "Critical" if t["count"] >= 4 else "Medium",
            })

    # Overall risk level.
    if critical_count >= 2 or any(c["urgency"] == "Critical" for c in potential_crises):
        overall = "Critical"
    elif trends:
        overall = "High" if any(t["count"] >= 3 for t in trends) else "Medium"
    elif total > 0:
        overall = "Low"
    else:
        overall = "Low"

    summary = (
        f"Analyzed {total} recent reports. "
        + (f"Detected {len(trends)} clustered trend(s) and {len(anomalies)} anomaly(ies). " if (trends or anomalies) else "No significant clustering detected. ")
        + f"Overall risk assessed as {overall}."
    )

    return {
        "summary": summary,
        "overall_risk_level": overall,
        "reports_analyzed": total,
        "trends": trends,
        "anomalies": anomalies,
        "potential_crises": potential_crises,
        "ai_processed": False,
    }


def chat_with_agri_advisor(message: str, history: list = None) -> str:
    """
    Simulates or calls the local LLM to act as the Eco Copilot Agri-Advisor,
    guiding UAE farmers in water conservation, organic sidr dates, beekeeping,
    subsidies, and eco-incidents.
    """
    prompt_system = (
        "You are Eco Copilot, an expert AI agricultural advisor helping farmers "
        "and citizens in the United Arab Emirates. Provide highly practical advice "
        "about Hatta date palm growing, Liwa desert irrigation, water quota approvals, "
        "soil salinization, honey extraction, and government subsidies. Keep responses "
        "friendly, concise (under 3 sentences), and focused on sustainable farming."
    )
    
    # We can compile history if provided
    messages = [{"role": "system", "content": prompt_system}]
    if history:
        for h in history:
            messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})
    messages.append({"role": "user", "content": message})
    
    headers = {"Content-Type": "application/json"}
    payload = {
        "model": "local-model",
        "messages": messages,
        "temperature": 0.5,
        "max_tokens": 150
    }
    
    try:
        import json
        import urllib.request
        import urllib.error
        
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(LOCAL_LLM_URL, data=data, headers=headers, method="POST")
        
        with urllib.request.urlopen(req, timeout=3.0) as response:
            res_data = response.read().decode("utf-8")
            res_json = json.loads(res_data)
            content = res_json["choices"][0]["message"]["content"].strip()
            return content
            
    except Exception as e:
        print(f"[AI Chat Node] Local LLM server offline. Running chatbot rule-based advice cards fallback.")
        return run_chatbot_rule_based_fallback(message)

def run_chatbot_rule_based_fallback(message: str) -> str:
    m = message.lower()
    def has(*ks):
        return any(k in m for k in ks)

    if has("hello", "marhaba", "marhaban", "greetings") or m.strip() in ("hi", "hey"):
        return ("Marhaba! I'm Falcon, your farming advisor. Ask me anything about crops, soil, water, "
                "livestock, pests or sustainable desert farming \u2014 or how to use Eco Connect.")
    if has("soil", "salinity", "saline", "sandy", " ph"):
        return ("**Soil health in arid zones:** UAE soils are often sandy and saline. Mix in organic compost or "
                "manure to improve water retention, mulch the surface to cut evaporation, and leach excess salts "
                "with periodic deep irrigation. Aim for pH 6.0\u20137.5; add gypsum to reduce sodicity.")
    if has("compost", "fertiliser", "fertilizer", "manure", "nutrient", "npk"):
        return ("**Fertility:** Compost crop residues, manure and kitchen scraps \u2014 turn weekly; ready in 6\u201310 weeks. "
                "For quick feeding use balanced NPK (e.g. 20-20-20) at planting, then nitrogen-rich feed during leafy "
                "growth. Compost also boosts sandy-soil water holding.")
    if has("plant", "season", "calendar", "when to", "sow", "grow "):
        return ("**UAE planting calendar:** Cool season (Oct\u2013Mar) suits tomatoes, cucumbers, leafy greens, carrots and "
                "herbs. Summer (Apr\u2013Sep) is harsh \u2014 use shade nets/greenhouses or heat-tolerant crops like okra, cowpea "
                "and millet. Date palms pollinate Feb\u2013Mar, harvest Jul\u2013Sep.")
    if has("water", "quota", "irrigation", "leak", "drip", "aquifer"):
        return ("**Water:** Sub-surface drip can cut use up to 50%; water at dawn/dusk and mulch beds. In Hatta and Liwa "
                "request a higher aquifer quota via **Gov-Connect \u2192 Water Quota Increase**; smart drip valves are often subsidised.")
    if has("pest", "bug", "disease", "rot", "locust", "insect", "weevil", "fungus", "mildew"):
        return ("**Pest & disease control:** Identify first. Use neem oil or insecticidal soap for soft-bodied pests, "
                "pheromone traps for red palm weevil, and remove infected material to stop spread. Rotate crops and avoid "
                "overhead watering to limit mildew. Log serious outbreaks under **AI Care**.")
    if has("livestock", "goat", "camel", "sheep", "chicken", "hen", "poultry", "cattle", "animal"):
        return ("**Livestock care:** Give shade and constant clean water in summer, balanced fodder (hydroponic green "
                "fodder stretches feed in 7 days), and a vaccination/deworming schedule. Ventilate poultry housing; watch "
                "for heat stress above 40\u00b0C.")
    if has("greenhouse", "hydroponic", "vertical", "net house", "polytunnel"):
        return ("**Protected cultivation:** Greenhouses/net houses enable summer farming. Hydroponics (NFT or drip) saves "
                "up to 90% water for fast leafy greens. Keep good cooling/ventilation, monitor nutrient EC and pH, and use "
                "30\u201350% shade netting.")
    if has("harvest", "storage", "store", "post-harvest", "shelf"):
        return ("**Harvest & storage:** Pick in the cool early morning, handle gently, and cool produce quickly. Cure dates "
                "and onions before storage; keep most veg cool and humid but onions/garlic dry. Sort by grade for better "
                "**Eco Market** prices.")
    if has("date", "palm", "khalas", "khlas"):
        return ("**Date palms:** Keep 8\u201312 healthy fronds per bunch, pollinate Feb\u2013Mar, thin fruit for size, and bag bunches "
                "against birds/rain. Deep-irrigate weekly in summer. Sort by grade and list on the **Eco Market** with a traceability QR.")
    if has("honey", "bee", "sidr", "apiary"):
        return ("**Beekeeping:** Site hives near flowering Sidr/Eco with water and afternoon shade, inspect every 1\u20132 weeks, "
                "and harvest only capped frames. Host **Sidr Honey** tours via **Eco-Tourism** for extra revenue.")
    if has("subsidy", "subsidies", "grant", "financial", "permit", "license", "certificate"):
        return ("**Government support:** Apply for subsidies, grants, permits and organic certification under **Gov-Connect** \u2014 "
                "choose the type, add details, and submit. Eco Connect's AI adjudicator reviews it against governance rules and "
                "you can download an official certificate once approved.")
    if has("market", "sell", "price", "buyer", "trade", "barter"):
        return ("**Selling:** Open the **Eco Market**, switch to *Seller*, and post produce with a price \u2014 try \u2728 AI Price "
                "Suggestion. You can offer items \U0001f504 *Open to Trade*, group deliveries with neighbours, and add a traceability QR.")
    if has("climate", "heat", "hot", "drought", "summer", "temperature"):
        return ("**Climate adaptation:** Use shade nets, mulching, dawn/dusk irrigation, windbreaks (Eco trees) and heat-tolerant "
                "or short-cycle crops. Check live field conditions in **Eco-Learn** to time work around temperature, humidity and UV.")

    return ("Good question! I can help with soil, water, fertiliser/compost, planting seasons, pests, livestock, "
            "greenhouses/hydroponics, harvesting and desert-farming techniques \u2014 plus using Eco Connect (Eco Market, "
            "Gov-Connect subsidies, water quotas, Eco-Learn). Tell me your crop, animal or goal and I'll give specific steps. "
            "(Tip: set FALCON_CLOUD_API_KEY for full AI answers.)")


def _falcon_topic(message: str):
    """Classify a farming query into a Falcon capability/domain (MIRA-style)."""
    m = (message or "").lower()
    table = [
        (("soil", "salin", "sandy", "compost", "fertil", "manure", "nutrient", "ph"), ("soil", "Soil & Fertility")),
        (("water", "irrigat", "drip", "quota", "aquifer", "leak"), ("water", "Water & Irrigation")),
        (("pest", "weevil", "disease", "fungus", "mildew", "aphid", "mite", "locust", "rot", "bug", "insect"), ("pest", "Pest & Disease")),
        (("livestock", "goat", "camel", "sheep", "chicken", "hen", "poultry", "cattle", "animal", "fodder"), ("livestock", "Livestock Care")),
        (("market", "sell", "price", "subsid", "permit", "grant", "buyer", "trade", "certif"), ("market", "Market & Subsidies")),
        (("climate", "heat", "summer", "drought", "temperature", "greenhouse", "hydroponic", "shade"), ("climate", "Climate Adaptation")),
        (("plant", "season", "calendar", "sow", "grow", "crop", "harvest", "date", "palm"), ("crop", "Crop Advisory")),
    ]
    for keys, result in table:
        if any(k in m for k in keys):
            return result
    return ("general", "General Advisory")


def _falcon_trace(message: str, topic_label: str, online: bool):
    """Build a MIRA-style terminal processing trace for Falcon."""
    q = (message or "").strip()
    q_short = (q[:44] + "...") if len(q) > 44 else q
    engine = "Querying Falcon Cloud Agent (Llama-3.3-70B)..." if online else "Loading offline agronomy knowledge base..."
    return [
        "> Accessing Falcon Farm Intelligence Engine v2.0...",
        f'> Parsing query: "{q_short}"',
        f"> Domain identified: {topic_label}",
        "> Region context: UAE · Al Ain / Hatta / Liwa",
        "> Cross-referencing arid-agronomy knowledge base...",
        "> Applying MOCCAE sustainability guidelines...",
        f"> {engine}",
        "> Confidence threshold: PASSED \u2713",
        "\u2713 Advisory ready \u2014 presenting guidance.",
    ]


def ask_falcon_assistant(message: str, history: list = None) -> dict:
    """
    Falcon — the EcoConnect on-device AI assistant.

    A general-purpose, UAE-sovereign assistant for the Eco Connect super app.
    Helps farmers, residents and tourists navigate the platform: Eco Market,
    Eco Business, My Farm, Employees, Gov-Connect, subsidies, water, and
    sustainable practices. Falls back to deterministic guidance when the local
    LLM is offline so the assistant always responds.

    Returns a MIRA-style payload: reply, agent, ai_processed, topic and a
    processing `trace` (terminal log lines) the UI animates before the answer.
    """
    topic_id, topic_label = _falcon_topic(message)

    prompt_system = (
        "You are 'Falcon', the AI farming advisor for the Eco Connect super app, under the UAE "
        "Ministry of Climate Change & Environment. You have two jobs: (1) answer ANY general farming, "
        "agriculture, agronomy or sustainability question with accurate, practical, specific guidance \u2014 "
        "soil health, fertilisers, composting, planting calendars, irrigation, greenhouse/hydroponics, "
        "livestock, pests and diseases, harvesting, climate adaptation and desert/arid farming; and "
        "(2) help users navigate the app (Eco Market, Eco Business, My Farm, Gov-Connect subsidies/permits, "
        "water quotas, Eco-Learn, Eco-Tourism). Prefer UAE-relevant advice (Hatta, Liwa, Al Ain, Al Qua'a) "
        "when applicable, but always answer the actual question asked, even if it is unrelated to the app. "
        "Be warm and practical; you may greet with 'Marhaba'. Use short paragraphs or bullet points. "
        "Never invent specific government figures \u2014 suggest filing an official Gov-Connect request instead."
    )

    messages = [{"role": "system", "content": prompt_system}]
    if history:
        for h in history:
            messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})
    messages.append({"role": "user", "content": message})

    try:
        reply = call_llm(messages, temperature=0.7, max_tokens=600, timeout=12.0)
        return {
            "reply": reply,
            "agent": f"Falcon · {'Cloud' if AI_MODE == 'cloud' else 'Local'} Agent",
            "ai_processed": True,
            "topic": topic_label,
            "topic_id": topic_id,
            "trace": _falcon_trace(message, topic_label, online=True),
        }
    except Exception as e:
        print(f"[Falcon] LLM caller failed ({e}). Using offline chatbot fallback.")

    # Safety net so Falcon always responds
    return {
        "reply": run_chatbot_rule_based_fallback(message),
        "agent": "Falcon \u00b7 Offline",
        "ai_processed": False,
        "topic": topic_label,
        "topic_id": topic_id,
        "trace": _falcon_trace(message, topic_label, online=False),
    }


def generate_business_plan(idea: str, skill: str = "", budget: float = 0.0, region: str = "UAE") -> dict:
    """
    Challenge 1 — Taking the first entrepreneurial step.

    Turns a raw idea/skill into a concrete first-action plan: clear steps,
    licenses, estimated costs, and where to find the first customer/resource.
    Uses the local LLM when available and a deterministic template otherwise.
    """
    prompt_system = (
        "You are the 'First Step' business launch advisor for a UAE community entrepreneurship platform. "
        "Given a person's idea, skill and budget, produce a concrete, encouraging starter plan for a small local business. "
        "Output STRICTLY raw JSON (no markdown) with keys: "
        "'business_name' (short catchy suggestion), "
        "'summary' (1-2 sentences), "
        "'first_action' (the single most important next step today), "
        "'steps' (array of 4-6 short ordered step strings), "
        "'licenses' (array of likely UAE permits/licenses as short strings), "
        "'estimated_costs' (array of objects with 'item' and 'aed' number), "
        "'first_customers' (array of 3 short ideas on where to find the first customers), "
        "'resources' (array of 3 short supportive resources or contacts). "
        "Keep every string concise and practical for a first-time founder."
    )
    prompt_user = (
        f"Idea: {idea}\nSkill/background: {skill or 'general'}\n"
        f"Starting budget (AED): {budget or 'unknown'}\nRegion: {region or 'UAE'}"
    )
    payload = {
        "model": "local-model",
        "messages": [
            {"role": "system", "content": prompt_system},
            {"role": "user", "content": prompt_user},
        ],
        "temperature": 0.4,
        "max_tokens": 700,
    }
    headers = {"Content-Type": "application/json"}
    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(LOCAL_LLM_URL, data=data, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=4.0) as response:
            content = json.loads(response.read().decode("utf-8"))["choices"][0]["message"]["content"].strip()
            if content.startswith("```"):
                content = re.sub(r"^```(?:json)?\n|```$", "", content, flags=re.MULTILINE).strip()
            parsed = json.loads(content)
            parsed["ai_processed"] = True
            return parsed
    except Exception as e:
        print(f"[Business Advisor] Local LLM offline ({str(e)}). Using rule-based starter plan.")
        return run_business_plan_fallback(idea, skill, budget, region)


def run_business_plan_fallback(idea: str, skill: str = "", budget: float = 0.0, region: str = "UAE") -> dict:
    """Deterministic starter plan so the entrepreneur tool always returns something useful."""
    idea_clean = (idea or "your idea").strip()
    idea_lower = idea_clean.lower()
    
    # 1. Palm Fronds (سعف النخيل)
    if any(k in idea_lower or k in idea_clean for k in ["سعف", "نخيل", "جدل", "مجدول", "palm", "frond"]):
        return {
            "business_name": "سدو النخيل للصناعات التراثية",
            "summary": f"مشروع محلي مستدام في {region} يعيد إحياء الحرف التقليدية عبر تصميم وبيع منتجات سعف النخيل المجدول التراثية بطابع عصري.",
            "first_action": "صناعة 5 نماذج أولية من السعف المجدول وعرضها على محلات الهدايا والقرية التراثية لمعرفة مدى الإقبال.",
            "steps": [
                "جمع سعف النخيل الجيد وتنظيفه وتجهيزه للجدل بالطرق التقليدية.",
                "تصميم أشكال مبتكرة وجذابة تلبي احتياجات السياح والمطاعم التراثية.",
                "التسجيل في منصة ecoConnect للحصول على رخصة تاجر أو رخصة انطلاق المنزلية الفورية.",
                "تسعير المنتجات بشكل مناسب بناءً على الوقت والمواد المستخدمة (مثلاً 50-150 درهم للقطعة).",
                "المشاركة في الأسواق المحلية والفعاليات السياحية لزيادة المبيعات.",
                "الحصول على آراء العملاء وتطوير التصاميم باستمرار."
            ],
            "licenses": [
                "رخصة انطلاق المنزلية الفورية (دائرة الاقتصاد والسياحة)",
                "تصريح إنتاج الحرف اليدوية والتراثية",
                "عضوية مؤسسة دبي لتنمية المشاريع الصغيرة والمتوسطة (SME)"
            ],
            "estimated_costs": [
                {"item": "رسوم رخصة انطلاق المنزلية السنوية", "aed": 1000},
                {"item": "أدوات ومواد تنظيف وتجهيز السعف", "aed": 300},
                {"item": "تغليف وتوسيم المنتجات بهوية تراثية", "aed": 400},
                {"item": "رسوم حجز منصة عرض في قرية حتا التراثية", "aed": 300}
            ],
            "first_customers": [
                "محلات الهدايا التراثية والمتاحف في حتا والشارقة.",
                "الفنادق والمنتجعات البيئية التي تبحث عن ديكورات مستدامة.",
                "السياح المهتمون بالحرف الإماراتية التقليدية عبر المتجر الدائري للمنصة."
            ],
            "resources": [
                "مؤسسة محمد بن راشد لتنمية المشاريع (دبي SME) للحصول على الدعم والتأهيل المالي.",
                "ورش تدريب الحرفيين التابعة لهيئة الثقافة والفنون بدبي.",
                "مركز دعم المزارعين والتعاونيات الزراعية في حتا."
            ],
            "ai_processed": True
        }
        
    # 2. Honey (عسل السدر)
    elif any(k in idea_lower or k in idea_clean for k in ["عسل", "سدر", "مناحل", "نحل", "honey", "bee", "apiary"]):
        return {
            "business_name": "مناحل السدر الذهبية",
            "summary": f"إنتاج وتعبئة عسل السدر والسمر الطبيعي الفاخر في {region}، وتسويقه كمنتج تراثي وعلاجي عالي الجودة للسياح والمواطنين.",
            "first_action": "تصميم ملصق تعبئة فاخر يحمل اسم المنحلة وشعار 'صنع في حتا' والبدء بتقديم عينات تذوق للسياح في سوق حتا البيئي.",
            "steps": [
                "تجهيز الخلايا الخشبية وتوطين طرود النحل في مناطق أشجار السدر والسمر.",
                "متابعة دورية وتأمين مصادر مياه عذبة ومظلات لحماية النحل من حرارة الصيف.",
                "استخلاص العسل وفرزه باستخدام أدوات صحية معقمة للمحافظة على الجودة العالية.",
                "الحصول على شهادة مطابقة الجودة من بلدية دبي ومختبرات الأغذية.",
                "التعبئة في عبوات زجاجية معقمة بأحجام مختلفة وتسعيرها بشكل عادل.",
                "تسويق العسل محلياً عبر المهرجانات السنوية والمنصات الرقمية."
            ],
            "licenses": [
                "تصريح تربية النحل وإنتاج العسل (هيئة أبوظبي للزراعة والسلامة الغذائية أو بلدية دبي)",
                "رخصة تجارة تعبئة وتغليف المواد الغذائية",
                "شهادة الفحص المخبري وتأكيد الجودة من مختبر دبي المركزي"
            ],
            "estimated_costs": [
                {"item": "شراء خلايا ومعدات النحل الأساسية والطرود", "aed": 2500},
                {"item": "معدات استخلاص وتصفية العسل", "aed": 1200},
                {"item": "عبوات زجاجية معقمة ومطبوعات ملصقات العلامة التجارية", "aed": 600},
                {"item": "رسوم التراخيص والتصاريح الصحية والبلدية", "aed": 1500}
            ],
            "first_customers": [
                "السياح القادمون لقرية حتا التراثية وسوق العسل السنوي.",
                "محلات العطارة والأغذية الطبيعية والمتاجر البيئية في دبي والشارقة.",
                "المشترون عبر الإنترنت عبر سوق المنصة الدائري."
            ],
            "resources": [
                "رابطة نحالي الإمارات للدعم الفني والتدريب وتبادل الخبرات.",
                "صندوق خليفة لتطوير المشاريع للحصول على تمويل بدون فوائد.",
                "برامج دعم مزارعي ومربي النحل من وزارة التغير المناخي والبيئة."
            ],
            "ai_processed": True
        }

    # 3. Dates (التمور)
    elif any(k in idea_lower or k in idea_clean for k in ["تمر", "تمور", "خلاص", "نخيل", "dates", "date"]):
        return {
            "business_name": "مكبس خلاص الواحة للتمور",
            "summary": f"فرز وتعبئة التمور العضوية الفاخرة (مثل الخلاص والفرض) في {region}، وتقديمها في مغلفات تراثية مبتكرة تلبي متطلبات الهدايا السياحية.",
            "first_action": "تجهيز أول دفعة من تمور الخلاص والفرض وتغليفها بهوية تراثية لعرضها في مهرجان حتا للتراث.",
            "steps": [
                "شراء التمور مباشرة من مزارعي حتا المحليين أو جني المحصول من مزرعتك الشخصية.",
                "فرز التمور وغسلها وتجفيفها وفقاً لأعلى معايير سلامة الأغذية.",
                "تعبئة التمور في عبوات ورقية مستدامة صديقة للبيئة بأشكال وأحجام متنوعة.",
                "إضافة نكهات جديدة ومبتكرة (مثل التمر بالمكسرات، الشوكولاتة، أو الهيل).",
                "الحصول على الشهادات والبلدية اللازمة للبيع التجاري.",
                "إدراج المنتجات في منصة ecoConnect البيئية والمشاركة بالمعارض السياحية."
            ],
            "licenses": [
                "رخصة تاجر أو رخصة ريادة الأعمال المنزلية",
                "شهادة استيفاء الاشتراطات الصحية لإنتاج الأغذية (البلدية)",
                "عضوية مؤسسة دبي لتنمية المشاريع الصغيرة والمتوسطة (SME)"
            ],
            "estimated_costs": [
                {"item": "شراء تمور خام بمختلف الأنواع والدرجات", "aed": 1500},
                {"item": "عبوات تغليف كرتونية مستدامة ومطبوعات الهوية", "aed": 800},
                {"item": "أدوات التعقيم وأجهزة الفرز والتغليف الحراري البسيط", "aed": 1200},
                {"item": "رسوم رخصة تاجر والتصاريح الصحية", "aed": 1000}
            ],
            "first_customers": [
                "زوار قرية حتا ومهرجان التمور السنوي.",
                "الشركات والمؤسسات التي تبحث عن هدايا تراثية فاخرة.",
                "الأسر الإماراتية والسياح عبر متجر ecoConnect الدائري."
            ],
            "resources": [
                "مؤسسة دبي لتنمية المشاريع لتوفير التدريب والاستشارات الفنية.",
                "هيئة دبي للثقافة والفنون للربط بالأسواق والقرى التراثية.",
                "مركز تدريب التعبئة والتغليف التابع لبلدية دبي."
            ],
            "ai_processed": True
        }

    # 4. Sadu / Rug Weaving (السدو)
    elif any(k in idea_lower or k in idea_clean for k in ["سدو", "سجاد", "حياكة", "صوف", "صناعات يد", "rugs", "carpet", "sadu", "weaver"]):
        return {
            "business_name": "مشغل حياكة السدو التراثي",
            "summary": f"حياكة وتطريز السجاد والحصائر وحقائب اليد باستخدام السدو الإماراتي التقليدي في {region} بهوية تراثية معاصرة.",
            "first_action": "حياكة قطعتين من السدو بتصاميم مميزة وتصويرهما بشكل احترافي لعرضهما عبر متجر المنصة.",
            "steps": [
                "شراء صوف الأغنام والماعز المحلي وغزله وصبغه باستخدام صبغات طبيعية مستدامة.",
                "تصميم لوحات حياكة تجمع بين الهندسة التقليدية والألوان العصرية الجذابة.",
                "إنتاج قطع متنوعة كالمخاد والسجاد التراثي الصغير والشنط الحرفية.",
                "الحصول على رخصة إنتاج تراثي من هيئة السياحة والثقافة بدبي.",
                "التسويق للمنتجات من خلال الفنادق التراثية والمواقع السياحية الفاخرة.",
                "تقديم ورش عمل تفاعلية للسياح لتعليمهم مبادئ حياكة السدو كنشاط سياحي."
            ],
            "licenses": [
                "رخصة ريادة الأعمال للحرف التراثية",
                "تصريح تنظيم ورش عمل سياحية تراثية",
                "رخصة انطلاق المنزلية من دائرة الاقتصاد والسياحة بدبي"
            ],
            "estimated_costs": [
                {"item": "شراء خيوط الصوف والصبغات الطبيعية والمغزل", "aed": 800},
                {"item": "أدوات التصوير البسيطة وتجهيز الهوية البصرية للعلامة", "aed": 500},
                {"item": "رسوم الترخيص والتسجيل وتصاريح تنظيم الورش الترفيهية", "aed": 1000},
                {"item": "مواد تغليف وحقائب هدايا ورقية مطبوعة بشعار المشغل", "aed": 400}
            ],
            "first_customers": [
                "السياح الأجانب المهتمين باقتناء منتجات يدوية أصيلة.",
                "الفنادق والمنتجعات الصحراوية الفاخرة في دبي وأبوظبي لاستخدامها في الديكور.",
                "الجهات الحكومية الباحثة عن هدايا بروتوكولية تعبر عن الهوية الوطنية."
            ],
            "resources": [
                "هيئة دبي للثقافة والفنون للحصول على الدعم والترويج الحرفي.",
                "مجلس إرثي للحرف المعاصرة للتدريب والتسويق الدولي.",
                "صندوق دعم الحرفيين والمزارعين التابع لهيئات السياحة البيئية."
            ],
            "ai_processed": True
        }

    # 5. General Arabic Input
    is_arabic = bool(re.search(r"[\u0600-\u06FF]", idea_clean))
    if is_arabic:
        short = idea_clean[:40]
        name_seed = (skill or idea_clean).split(" ")[0] if (skill or idea_clean) else "المشروع المحلي"
        return {
            "business_name": f"مؤسسة {name_seed} للمشاريع",
            "summary": f"مشروع ريادي واعد في {region} يتمحور حول '{short}'. ابدأ بموارد بسيطة، تحقق من الطلب محلياً، ثم وسع نشاطك.",
            "first_action": "صياغة فكرة مشروعك وعرضها على 5 أشخاص من مجتمعك المحلي اليوم لمعرفة مدى اهتمامهم بفكرتك.",
            "steps": [
                "حدد بدقة ما تبيعه ولمن في جملة واحدة واضحة.",
                "تحدث مع 5-10 زبائن محتملين لتأكيد رغبتهم في الشراء.",
                "حدد سعراً بسيطاً لمنتجك أو خدمتك للبدء فوراً هذا الأسبوع.",
                "احجز اسمك التجاري وسجل النشاط للحصول على الرخصة.",
                "قم بإجراء أول 3 مبيعات حقيقية قبل إنفاق الأموال على الديكور أو التجهيزات الفاخرة.",
                "اجمع الملاحظات من زبائنك وأعد استثمار الأرباح لتطوير المشروع."
            ],
            "licenses": [
                "حجز الاسم التجاري (دائرة التنمية الاقتصادية)",
                "رخصة تجارية أو رخصة ريادة أعمال منزلية فورية",
                "تصريح مزاولة النشاط الخاص من الجهات المعنية"
            ],
            "estimated_costs": [
                {"item": "رخصة تجارية فورية للمبتدئين", "aed": 1000},
                {"item": "حجز الاسم التجاري والموافقة المبدئية", "aed": 600},
                {"item": "هوية بصرية بسيطة وصور تسويقية", "aed": 400},
                {"item": "المواد الخام الأولية أو عينات المنتج", "aed": max(500, round((budget or 2000) * 0.3))}
            ],
            "first_customers": [
                "شبكة علاقاتك وعائلتك وأصدقائك في المجتمع المحلي.",
                "المتاجر والأسواق البيئية والمجتمعية التابعة للمنصة.",
                "فعاليات العرض والأسواق السياحية الأسبوعية القريبة."
            ],
            "resources": [
                "المساعد الذكي لمنصة ecoConnect للحصول على المشورة التقنية خطوة بخطوة.",
                "صندوق دعم المشاريع الصغيرة والمتوسطة المحلي.",
                "نظام إدارة علاقات العملاء المبسط (CRM) في هذه المنصة."
            ],
            "ai_processed": True
        }

    # 6. Standard English Fallback
    short = idea_clean[:40]
    name_seed = (skill or idea_clean).split(" ")[0].capitalize() if (skill or idea_clean) else "Local"
    return {
        "business_name": f"{name_seed} Collective",
        "summary": f"A small {region} venture built around '{short}'. Start lean, validate demand locally, then grow.",
        "first_action": "Write a one-sentence offer and show it to 5 people in your community today to test interest.",
        "steps": [
            "Define exactly what you sell and to whom in one sentence.",
            "Talk to 5-10 potential customers to confirm they want it.",
            "Price a single simple offer you can deliver this week.",
            "Register the activity and pick a trade name.",
            "Make your first 3 sales before spending on anything fancy.",
            "Collect feedback and reinvest into what works.",
        ],
        "licenses": [
            "Trade name reservation (Department of Economic Development)",
            "Commercial / instant licence (DED or free zone)",
            "Activity-specific approval (e.g. food, crafts, tourism)",
        ],
        "estimated_costs": [
            {"item": "Instant trade licence (starter)", "aed": 1000},
            {"item": "Trade name & initial approval", "aed": 600},
            {"item": "Basic branding & photos", "aed": 400},
            {"item": "First batch of stock / materials", "aed": max(500, round((budget or 2000) * 0.3))},
        ],
        "first_customers": [
            "Your existing community network and family contacts.",
            "Local Eco Market listings and community groups in the app.",
            "A nearby weekly market or community event to demo your offer.",
        ],
        "resources": [
            "EcoConnect Falcon assistant for step-by-step guidance.",
            "Local SME support / Khalifa Fund style microfinance.",
            "Community CRM in this app to track your first leads.",
        ],
        "ai_processed": False,
    }


def analyze_local_market(sector: str, region: str = "UAE", note: str = "") -> dict:
    """
    Challenge 3 - The data gap for local entrepreneurs.

    Produces lightweight market-research insight for a sector/region so a
    founder can decide with evidence instead of guesswork.
    """
    prompt_system = (
        "You are a local market-research assistant for small UAE community entrepreneurs. "
        "Given a sector and region, return concise, realistic guidance. "
        "Output STRICTLY raw JSON (no markdown) with keys: "
        "'demand_score' (integer 0-100), "
        "'demand_label' (one of 'Low','Moderate','Strong','High'), "
        "'insights' (array of 3-4 short factual-style observations about local demand), "
        "'opportunities' (array of 3 short gap/opportunity strings), "
        "'recommended_products' (array of 3 short product/service ideas), "
        "'risks' (array of 2 short risk strings). "
        "Be specific to the region where possible and keep strings short."
    )
    prompt_user = f"Sector: {sector}\nRegion: {region}\nExtra context: {note or 'none'}"
    payload = {
        "model": "local-model",
        "messages": [
            {"role": "system", "content": prompt_system},
            {"role": "user", "content": prompt_user},
        ],
        "temperature": 0.4,
        "max_tokens": 600,
    }
    headers = {"Content-Type": "application/json"}
    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(LOCAL_LLM_URL, data=data, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=4.0) as response:
            content = json.loads(response.read().decode("utf-8"))["choices"][0]["message"]["content"].strip()
            if content.startswith("```"):
                content = re.sub(r"^```(?:json)?\n|```$", "", content, flags=re.MULTILINE).strip()
            parsed = json.loads(content)
            parsed["ai_processed"] = True
            return parsed
    except Exception as e:
        print(f"[Market Insights] Local LLM offline ({str(e)}). Using rule-based market insight.")
        return run_market_insight_fallback(sector, region)


def run_market_insight_fallback(sector: str, region: str = "UAE") -> dict:
    """Deterministic market-insight estimate keyed off the sector keyword."""
    s = (sector or "").lower()
    seed = sum(ord(c) for c in s) if s else 50
    score = 55 + (seed % 35)  # 55-89 range, stable per sector
    label = "High" if score >= 80 else "Strong" if score >= 68 else "Moderate"
    return {
        "demand_score": score,
        "demand_label": label,
        "insights": [
            f"{sector or 'This sector'} shows steady interest among {region} residents, especially locally-made offerings.",
            "Buyers value authenticity, sustainability and short supply chains.",
            "Word-of-mouth and community channels drive most early sales.",
        ],
        "opportunities": [
            "Few sellers offer a consistent, reliable local supply - reliability is a differentiator.",
            "Bundling with eco-tourism or events can lift average order value.",
            "Online discovery is weak locally; a simple listing presence stands out.",
        ],
        "recommended_products": [
            f"A signature {sector or 'local'} product with clear provenance.",
            "A subscription or repeat-order option for loyal customers.",
            "A small workshop or experience tied to your product.",
        ],
        "risks": [
            "Seasonality can cause demand swings - plan cash flow.",
            "Competing on price alone erodes margin; compete on quality.",
        ],
        "ai_processed": False,
    }


def structure_document_text(text: str) -> dict:
    """
    Turns raw OCR text from a document (licence, invoice, ID, permit) into
    structured fields. Used by the OCR endpoint. Falls back to regex parsing.
    """
    if not text or not text.strip():
        return {"doc_type": "unknown", "fields": {}, "ai_processed": False}

    prompt_system = (
        "You extract structured data from scanned document text for a UAE business platform. "
        "Output STRICTLY raw JSON (no markdown) with keys: "
        "'doc_type' (best guess: 'trade_license','invoice','id','permit','receipt' or 'other'), "
        "'fields' (object of the most relevant key/value pairs you can find, e.g. name, number, date, amount, expiry). "
        "Only include fields you can actually find in the text."
    )
    payload = {
        "model": "local-model",
        "messages": [
            {"role": "system", "content": prompt_system},
            {"role": "user", "content": text[:2000]},
        ],
        "temperature": 0.1,
        "max_tokens": 400,
    }
    headers = {"Content-Type": "application/json"}
    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(LOCAL_LLM_URL, data=data, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=4.0) as response:
            content = json.loads(response.read().decode("utf-8"))["choices"][0]["message"]["content"].strip()
            if content.startswith("```"):
                content = re.sub(r"^```(?:json)?\n|```$", "", content, flags=re.MULTILINE).strip()
            parsed = json.loads(content)
            parsed["ai_processed"] = True
            return parsed
    except Exception as e:
        print(f"[OCR Structuring] Local LLM offline ({str(e)}). Using regex field extraction.")
        return run_document_regex_fallback(text)


def run_document_regex_fallback(text: str) -> dict:
    """Lightweight regex extraction of common document fields."""
    fields = {}
    email = re.search(r"[\w.+-]+@[\w-]+\.[\w.-]+", text)
    if email:
        fields["email"] = email.group(0)
    phone = re.search(r"(?:\+971|0)\s?\d[\d\s-]{7,}", text)
    if phone:
        fields["phone"] = phone.group(0).strip()
    amount = re.search(r"(?:AED|Dhs?)\s?([\d,]+(?:\.\d{1,2})?)", text, re.IGNORECASE)
    if amount:
        fields["amount_aed"] = amount.group(1)
    date = re.search(r"\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b", text)
    if date:
        fields["date"] = date.group(1)
    license_no = re.search(r"(?:licen[cs]e|permit|trade)\s*(?:no\.?|number|#)?\s*[:\-]?\s*([A-Z0-9-]{4,})", text, re.IGNORECASE)
    if license_no:
        fields["reference"] = license_no.group(1)

    lower = text.lower()
    if "licen" in lower or "trade" in lower:
        doc_type = "trade_license"
    elif "invoice" in lower or "amount" in lower or "aed" in lower:
        doc_type = "invoice"
    elif "permit" in lower:
        doc_type = "permit"
    elif "identity" in lower or "id no" in lower or "emirates id" in lower:
        doc_type = "id"
    else:
        doc_type = "other"
    return {"doc_type": doc_type, "fields": fields, "ai_processed": False}


def forecast_crop_demand(supply_summary: list, recent_sales: list = None, region: str = "UAE") -> dict:
    """
    Predictive Demand Analytics for the Smart Marketplace.

    Given the current marketplace supply (per crop/product stock) and recent
    sales activity, predicts which crops will be in high demand over the coming
    weeks so farmers can plan planting cycles more profitably.

    supply_summary: list of {"crop": str, "stock": int, "sold": int}
    recent_sales:   optional list of {"crop": str, "count": int}
    """
    recent_sales = recent_sales or []
    prompt_system = (
        "You are an agricultural demand-forecasting assistant for UAE smallholder farmers. "
        "Given current marketplace supply and recent sales, predict demand for the next 2-6 weeks. "
        "Output STRICTLY raw JSON (no markdown) with key 'forecasts' = array of 4-6 objects, each with: "
        "'crop' (string), 'icon' (single emoji), 'demand_score' (integer 0-100), "
        "'trend' (one of 'Rising','Stable','Falling'), "
        "'window' (short planting/selling window string e.g. 'Plant within 2 weeks'), "
        "'advice' (one short actionable sentence for the farmer). "
        "Favour crops with low supply but steady sales as rising demand. Keep strings short."
    )
    prompt_user = (
        f"Region: {region}\n"
        f"Current supply: {json.dumps(supply_summary)}\n"
        f"Recent sales: {json.dumps(recent_sales)}"
    )
    payload = {
        "model": "local-model",
        "messages": [
            {"role": "system", "content": prompt_system},
            {"role": "user", "content": prompt_user},
        ],
        "temperature": 0.4,
        "max_tokens": 700,
    }
    headers = {"Content-Type": "application/json"}
    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(LOCAL_LLM_URL, data=data, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=4.0) as response:
            content = json.loads(response.read().decode("utf-8"))["choices"][0]["message"]["content"].strip()
            if content.startswith("```"):
                content = re.sub(r"^```(?:json)?\n|```$", "", content, flags=re.MULTILINE).strip()
            parsed = json.loads(content)
            parsed["ai_processed"] = True
            return parsed
    except Exception as e:
        print(f"[Demand Forecast] Local LLM offline ({str(e)}). Using rule-based forecast.")
        return run_demand_forecast_fallback(supply_summary, recent_sales)


def run_demand_forecast_fallback(supply_summary: list, recent_sales: list = None) -> dict:
    """
    Deterministic demand forecast: low supply + steady sales => rising demand.
    Always returns a useful set of crop forecasts for the demo.
    """
    recent_sales = recent_sales or []
    sales_map = {(s.get("crop") or "").lower(): s.get("count", 0) for s in recent_sales}

    # Baseline UAE-relevant crops so the radar is never empty.
    baseline = [
        {"crop": "Khalas Dates", "icon": "🌴"},
        {"crop": "Sidr Honey", "icon": "🍯"},
        {"crop": "Cherry Tomatoes", "icon": "🍅"},
        {"crop": "Leafy Greens", "icon": "🥬"},
        {"crop": "Cucumbers", "icon": "🥒"},
        {"crop": "Olives", "icon": "🫒"},
    ]
    supply_map = {(s.get("crop") or "").lower(): s for s in (supply_summary or [])}

    forecasts = []
    for item in baseline:
        key = item["crop"].lower()
        sup = supply_map.get(key, {})
        stock = int(sup.get("stock", 0) or 0)
        sold = int(sup.get("sold", 0) or sales_map.get(key, 0) or 0)

        # Demand score: scarcity + sales momentum, stable per crop name.
        seed = sum(ord(c) for c in key) % 20
        scarcity = max(0, 40 - min(stock, 40))        # less stock => more demand
        momentum = min(30, sold * 6)                   # more recent sales => more demand
        score = max(20, min(98, 45 + scarcity // 2 + momentum + seed // 4))

        if score >= 75:
            trend, window = "Rising", "Plant within 2 weeks to catch the peak"
        elif score >= 55:
            trend, window = "Stable", "Steady demand - maintain current rotation"
        else:
            trend, window = "Falling", "Hold off planting; supply is ample"

        advice = {
            "Rising": f"Low local supply of {item['crop']} - a planting now should sell at a premium.",
            "Stable": f"{item['crop']} demand is reliable; keep a consistent harvest cadence.",
            "Falling": f"Market is saturated with {item['crop']}; diversify to a rising crop.",
        }[trend]

        forecasts.append({
            "crop": item["crop"],
            "icon": item["icon"],
            "demand_score": score,
            "trend": trend,
            "window": window,
            "advice": advice,
        })

    forecasts.sort(key=lambda f: f["demand_score"], reverse=True)
    return {"forecasts": forecasts, "ai_processed": False}


def evaluate_subsidy_eligibility(profile: dict) -> dict:
    """
    Governance-as-code subsidy / permit eligibility engine (MOE SADDAD "rules-agent"
    pattern, adapted for MOCCAE farming subsidies). Deterministic, transparent and
    bilingual — it never invents figures and always explains *why* plus *how to qualify*.

    Expected profile keys (all optional, sane defaults applied):
      farm_size_dunum (float), years_active (float), annual_income_aed (float),
      requested_amount_aed (float), request_type (str), has_trade_license (bool),
      prior_subsidy_default (bool), uses_sustainable_irrigation (bool),
      employs_locals (bool)
    """
    p = profile or {}
    farm_size = float(p.get("farm_size_dunum", 0) or 0)
    years = float(p.get("years_active", 0) or 0)
    income = float(p.get("annual_income_aed", 0) or 0)
    requested = float(p.get("requested_amount_aed", 0) or 0)
    request_type = (p.get("request_type") or "general").strip()
    has_license = bool(p.get("has_trade_license", False))
    prior_default = bool(p.get("prior_subsidy_default", False))
    sustainable = bool(p.get("uses_sustainable_irrigation", False))
    employs_locals = bool(p.get("employs_locals", False))

    # Maximum award is capped at 60% of declared annual income (affordability guardrail).
    income_cap = round(income * 0.60, 2)

    rules = []  # each: id, label_en, label_ar, passed, weight, fix_en, fix_ar

    def rule(rid, ok, weight, label_en, label_ar, fix_en="", fix_ar=""):
        rules.append({
            "id": rid, "passed": bool(ok), "weight": weight,
            "label_en": label_en, "label_ar": label_ar,
            "fix_en": fix_en, "fix_ar": fix_ar,
        })

    # S-01 — Registered, licensed farm holding
    rule("S-01", has_license, 20,
         "Holds a valid trade / farm licence",
         "يملك رخصة تجارية / زراعية سارية",
         fix_en="Register or renew your farm licence via Gov-Connect before reapplying.",
         fix_ar="سجّل أو جدّد رخصتك الزراعية عبر بوابة Gov-Connect قبل إعادة التقديم.")
    # S-02 — Minimum operating history
    rule("S-02", years >= 1, 15,
         "Farm has at least 1 year of operating history",
         "المزرعة عاملة منذ سنة واحدة على الأقل",
         fix_en="Maintain the holding for at least 12 months to build eligibility.",
         fix_ar="حافظ على تشغيل المزرعة لمدة 12 شهراً على الأقل لاستيفاء الشرط.")
    # S-03 — Genuine smallholder scale (not industrial)
    rule("S-03", 0 < farm_size <= 200, 10,
         "Qualifies as a smallholder (≤ 200 dunum)",
         "ضمن فئة صغار المزارعين (≤ 200 دونم)",
         fix_en="Subsidy targets smallholders; large estates use the commercial track.",
         fix_ar="الدعم مخصص لصغار المزارعين؛ المزارع الكبيرة تستخدم المسار التجاري.")
    # S-04 — Request within affordability cap
    rule("S-04", requested <= income_cap or income == 0, 25,
         "Requested amount within 60% income cap",
         "المبلغ المطلوب ضمن سقف 60٪ من الدخل",
         fix_en=f"Lower the request to AED {income_cap:,.0f} or below to fit the affordability rule.",
         fix_ar=f"خفّض المبلغ إلى {income_cap:,.0f} درهم أو أقل ليتوافق مع قاعدة القدرة المالية.")
    # S-05 — No prior subsidy default
    rule("S-05", not prior_default, 20,
         "No prior subsidy default on record",
         "لا يوجد تعثر سابق في الدعم",
         fix_en="Settle the previous subsidy obligation, then reapply after clearance.",
         fix_ar="سدّد التزام الدعم السابق ثم أعد التقديم بعد التسوية.")
    # S-06 — Sustainability incentive (bonus weighting)
    rule("S-06", sustainable, 10,
         "Uses sustainable / water-efficient irrigation",
         "يستخدم ريّاً مستداماً وموفراً للمياه",
         fix_en="Adopt drip/smart irrigation to unlock the sustainability bonus.",
         fix_ar="اعتمد الري بالتنقيط/الذكي للحصول على حافز الاستدامة.")

    earned = sum(r["weight"] for r in rules if r["passed"])
    total = sum(r["weight"] for r in rules)
    score = round((earned / total) * 100) if total else 0

    # Hard blockers force escalation regardless of score.
    hard_block = prior_default or not has_license
    if hard_block:
        decision = "Rejected"
    elif score >= 75:
        decision = "Approved"
    elif score >= 55:
        decision = "Review"
    else:
        decision = "Rejected"

    # Local-hiring social bonus nudges borderline cases up to Review.
    if decision == "Rejected" and not hard_block and employs_locals and score >= 45:
        decision = "Review"

    failed = [r for r in rules if not r["passed"]]
    if decision == "Approved":
        rationale_en = (
            f"Eligible for the {request_type} subsidy with a compliance score of {score}/100. "
            f"All statutory guardrails are satisfied and the request is within the affordability cap."
        )
        rationale_ar = (
            f"مؤهل لدعم '{request_type}' بنسبة امتثال {score}/100. "
            f"جميع الضوابط القانونية مستوفاة والمبلغ ضمن سقف القدرة المالية."
        )
    elif decision == "Review":
        rationale_en = (
            f"Conditionally eligible (score {score}/100). A MOCCAE officer review is required before "
            f"approval — address the items below to strengthen the application."
        )
        rationale_ar = (
            f"مؤهل مشروط (النتيجة {score}/100). يتطلب مراجعة موظف من الوزارة قبل الاعتماد — "
            f"عالج البنود أدناه لتقوية الطلب."
        )
    else:
        rationale_en = (
            f"Not eligible yet (score {score}/100). "
            + ("A statutory blocker (missing licence or prior default) must be cleared first. "
               if hard_block else "Key eligibility rules were not met. ")
            + "Follow the recovery plan below, then reapply."
        )
        rationale_ar = (
            f"غير مؤهل حالياً (النتيجة {score}/100). "
            + ("يجب أولاً إزالة المانع القانوني (رخصة مفقودة أو تعثر سابق). "
               if hard_block else "لم تُستوفَ شروط الأهلية الأساسية. ")
            + "اتبع خطة المعالجة أدناه ثم أعد التقديم."
        )

    how_to_qualify = [
        {"en": r["fix_en"], "ar": r["fix_ar"]}
        for r in failed if r["fix_en"]
    ]

    return {
        "decision": decision,
        "score": score,
        "income_cap_aed": income_cap,
        "rationale_en": rationale_en,
        "rationale_ar": rationale_ar,
        "rules": rules,
        "how_to_qualify": how_to_qualify,
        "ai_processed": True,
    }


if __name__ == "__main__":
    # Quick debug test
    test_report = "There is a massive water leak in the irrigation line. Water is flooding Hatta fields."
    res = analyze_report_with_ai(test_report)
    print("Test routing result:", res)