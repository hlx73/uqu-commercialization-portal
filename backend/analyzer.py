import os
import json
import re
import numpy as np
from dotenv import load_dotenv
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import google.generativeai as genai

# Load env variables (for local development .env file)
load_dotenv()

# Setup Gemini API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Sectors definition
SECTORS = [
    {"name_en": "Hajj & Umrah Tech", "name_ar": "تقنية الحج والعمرة"},
    {"name_en": "HealthTech & Biotech", "name_ar": "التقنية الصحية والحيوية"},
    {"name_en": "Clean Energy & Environment", "name_ar": "الطاقة النظيفة والبيئة"},
    {"name_en": "Smart Infrastructure & IoT", "name_ar": "البنية التحتية الذكية"},
    {"name_en": "Islamic Finance & Digital Economy", "name_ar": "الاقتصاد الرقمي والتمويل الإسلامي"}
]

# Load local catalogs for matching
STARTUPS_PATH = os.path.join(os.path.dirname(__file__), "data", "startups.json")
CHALLENGES_PATH = os.path.join(os.path.dirname(__file__), "data", "challenges.json")

def load_catalog(file_path):
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

# Dynamic search engine using TF-IDF
class HybridSearchEngine:
    def __init__(self, projects_loader_func):
        self.projects_loader = projects_loader_func
        self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words='english')

    def search(self, query, filters=None, limit=20):
        projects = self.projects_loader()
        if not projects:
            return []

        # Apply hard filters first (sector, type, status)
        filtered_projects = projects
        if filters:
            if filters.get("sector"):
                filtered_projects = [p for p in filtered_projects if p.get("sector") == filters["sector"]]
            if filters.get("type"):
                filtered_projects = [p for p in filtered_projects if p.get("type") == filters["type"]]
            if filters.get("status"):
                filtered_projects = [p for p in filtered_projects if p.get("status") == filters["status"]]
            if filters.get("trl"):
                filtered_projects = [p for p in filtered_projects if p.get("trl") == int(filters["trl"])]
            if filters.get("track"):
                filtered_projects = [p for p in filtered_projects if p.get("track") == filters["track"]]

        if not filtered_projects:
            return []

        if not query or query.strip() == "":
            # Return sorted by submission date descending if no query
            return sorted(filtered_projects, key=lambda x: x.get("submission_date", ""), reverse=True)[:limit]

        # Prepare corpus containing English and Arabic titles and abstracts
        corpus = []
        for p in filtered_projects:
            text = f"{p.get('title_en', '')} {p.get('title_ar', '')} {p.get('abstract_en', '')} {p.get('abstract_ar', '')}"
            corpus.append(text)

        try:
            tfidf_matrix = self.vectorizer.fit_transform(corpus)
            query_vec = self.vectorizer.transform([query])
            similarities = cosine_similarity(query_vec, tfidf_matrix).flatten()
            
            # Sort projects by similarity
            scored_projects = []
            for idx, score in enumerate(similarities):
                scored_projects.append((score, filtered_projects[idx]))
            
            # Sort by score descending, filtering out 0 score if we have enough matches
            scored_projects.sort(key=lambda x: x[0], reverse=True)
            
            results = []
            for score, proj in scored_projects:
                proj_copy = proj.copy()
                proj_copy["search_score"] = float(score)
                results.append(proj_copy)
                
            return results[:limit]
        except Exception as e:
            # Fallback to simple substring match
            print(f"TF-IDF search error: {e}. Falling back to substring match.")
            q = query.lower()
            results = []
            for p in filtered_projects:
                match = (
                    q in p.get("title_en", "").lower() or
                    q in p.get("title_ar", "").lower() or
                    q in p.get("abstract_en", "").lower() or
                    q in p.get("abstract_ar", "").lower()
                )
                if match:
                    results.append(p)
            return results[:limit]

# Find similar startups and challenges using TF-IDF Cosine Similarity
def find_similar_entities(text_en, text_ar):
    combined_text = f"{text_en} {text_ar}"
    startups = load_catalog(STARTUPS_PATH)
    challenges = load_catalog(CHALLENGES_PATH)
    
    matched_startups = []
    matched_challenges = []
    
    if startups:
        startup_corpus = [f"{s.get('name', '')} {s.get('description', '')} {' '.join(s.get('technologies', []))}" for s in startups]
        try:
            vectorizer = TfidfVectorizer(stop_words='english')
            tfidf_matrix = vectorizer.fit_transform(startup_corpus + [combined_text])
            sim = cosine_similarity(tfidf_matrix[-1], tfidf_matrix[:-1]).flatten()
            top_indices = np.argsort(sim)[::-1]
            for idx in top_indices:
                if sim[idx] > 0.05:  # Relevance threshold
                    matched_startups.append(startups[idx]["name"])
            if not matched_startups:
                matched_startups = [startups[0]["name"], startups[1]["name"]]
        except Exception:
            matched_startups = [s["name"] for s in startups[:2]]
            
    if challenges:
        challenge_corpus = [f"{c.get('title', '')} {c.get('description', '')} {c.get('sector', '')}" for c in challenges]
        try:
            vectorizer = TfidfVectorizer(stop_words='english')
            tfidf_matrix = vectorizer.fit_transform(challenge_corpus + [combined_text])
            sim = cosine_similarity(tfidf_matrix[-1], tfidf_matrix[:-1]).flatten()
            top_indices = np.argsort(sim)[::-1]
            for idx in top_indices:
                if sim[idx] > 0.05:
                    matched_challenges.append(challenges[idx]["title"])
            if not matched_challenges:
                matched_challenges = [challenges[0]["title"]]
        except Exception:
            matched_challenges = [c["title"] for c in challenges[:2]]
            
    return matched_startups[:3], matched_challenges[:2]

# Determine Wadi Makkah Track based on TRL
def get_wadi_makkah_track(trl):
    if trl <= 2:
        return "Masar Training Program (برنامج مسار التأهيلي)"
    elif trl <= 4:
        return "Nomow Incubator (حاضنة نمو)"
    elif trl <= 6:
        return "Wadi Makkah Accelerator (مسرعة وادي مكة)"
    else:
        return "Wadi Makkah Ventures Fund (صندوق الاستثمار)"

# Heuristic Local Fallback Analyzer
def run_local_fallback_analysis(text):
    # Determine language
    has_arabic = bool(re.search(r'[\u0600-\u06FF]', text))
    
    # 1. Categorization by keywords
    text_lower = text.lower()
    sector = "Smart Infrastructure & IoT" # Default
    
    hajj_keywords = ["hajj", "umrah", "pilgrim", "crowd", "mataf", "mina", "arafat", "حج", "عمرة", "حجاج", "حشود", "حشد", "مطاف", "منى", "عرفات"]
    health_keywords = ["health", "biotech", "medical", "disease", "patient", "clinic", "diabetic", "صحة", "حيوي", "طبي", "مريض", "مرض", "علاج", "سكري"]
    energy_keywords = ["solar", "clean energy", "environment", "waste", "recycling", "compost", "water", "desalination", "طاقة", "شمسية", "بيئة", "نفايات", "تدوير", "مياه", "تحلية"]
    finance_keywords = ["finance", "blockchain", "payment", "fintech", "smart contract", "funding", "تمويل", "بلوكشين", "دفع", "مالي", "تقنية مالية"]
    
    if any(k in text_lower for k in hajj_keywords):
        sector = "Hajj & Umrah Tech"
    elif any(k in text_lower for k in health_keywords):
        sector = "HealthTech & Biotech"
    elif any(k in text_lower for k in energy_keywords):
        sector = "Clean Energy & Environment"
    elif any(k in text_lower for k in finance_keywords):
        sector = "Islamic Finance & Digital Economy"

    # 2. TRL Heuristic Evaluation
    trl = 3  # Default: experimental proof of concept
    
    trl_indicators = {
        9: ["commercialized", "market ready", "production system", "commercially deployed", "تجاري", "جاهز للاستخدام", "نظام إنتاجي"],
        8: ["field tested", "fully operational", "real-world deployment", "pilot tested", "ميداني", "تشغيل كامل", "تطبيق حقيقي"],
        7: ["operational environment", "prototype in field", "demonstrated in operational", "بيئة تشغيلية", "أولي ميداني"],
        6: ["prototype tested", "system prototype", "full-scale prototype", "نموذج كبس", "نموذج أولي متكامل"],
        5: ["laboratory prototype", "tested in lab", "validation in lab", "نموذج معملي", "اختبار معملي"],
        4: ["component validation", "lab validation", "experimental validation", "تحقق معملي", "فحص المكونات"],
        3: ["proof of concept", "experimental proof", "analytical study", "إثبات المفهوم", "دراسة تحليلية"],
        2: ["conceptual design", "technology formulation", "concept formulated", "صياغة المفهوم", "تصميم مفاهيمي"],
        1: ["basic principles", "scientific paper", "fundamental study", "theoretical", "المبادئ الأساسية", "نظري"]
    }
    
    for level, words in sorted(trl_indicators.items(), key=lambda x: x[0], reverse=True):
        if any(w in text_lower for w in words):
            trl = level
            break

    # 3. Generate Basic Applications/Customers/Roadmap based on Sector
    if sector == "Hajj & Umrah Tech":
        apps_en = ["Dynamic crowd-monitoring control interfaces", "Smart navigation routing integrations", "Crowd analytics for holy sites management"]
        apps_ar = ["واجهات تحكم ديناميكية لمراقبة الحشود", "تكامل أنظمة الملاحة الذكية", "تحليلات الحشود لإدارة المشاعر المقدسة"]
        cust_en = ["Ministry of Hajj and Umrah", "Makkah Municipality", "KIDANA Development Company"]
        cust_ar = ["وزارة الحج والعمرة", "أمانة العاصمة المقدسة", "شركة كدانة للتنمية والتطوير"]
    elif sector == "HealthTech & Biotech":
        apps_en = ["Automated clinical screening software", "Patient diagnostics SaaS integration", "Remote medical support assistant"]
        apps_ar = ["برمجيات الفحص السريري الآلي", "تكامل السجلات الطبية السحابية للمرضى", "مساعد الدعم الطبي عن بعد"]
        cust_en = ["Ministry of Health", "King Faisal Specialist Hospital", "Saudi Red Crescent Authority"]
        cust_ar = ["وزارة الصحة", "مستشفى الملك فيصل التخصصي ومركز الأبحاث", "هيئة الهلال الأحمر السعودي"]
    elif sector == "Clean Energy & Environment":
        apps_en = ["Sustainable recycling management platforms", "Eco-friendly agricultural soil enhancements", "Off-grid clean energy systems integration"]
        apps_ar = ["منصات إدارة إعادة التدوير المستدامة", "محسنات التربة الزراعية الصديقة للبيئة", "تكامل أنظمة الطاقة النظيفة المستقلة"]
        cust_en = ["Ministry of Environment, Water and Agriculture", "National Center for Waste Management (MWAN)", "Saudi Aramco"]
        cust_ar = ["وزارة البيئة والمياه والزراعة", "المركز الوطني لإدارة النفايات (موان)", "أرامكو السعودية"]
    elif sector == "Islamic Finance & Digital Economy":
        apps_en = ["SaaS secure contract verification APIs", "Fintech digital payment gateways", "Academic credential cryptographic validation"]
        apps_ar = ["واجهات برمجية آمنة لتوثيق العقود", "بوابات الدفع الرقمية في التقنية المالية", "التوثيق المشفر للمؤهلات الأكاديمية"]
        cust_en = ["Saudi Central Bank (SAMA)", "Ministry of Justice", "Ministry of Education"]
        cust_ar = ["البنك المركزي السعودي (ساما)", "وزارة العدل", "وزارة التعليم"]
    else:
        apps_en = ["SaaS smart automation portal", "Local infrastructure optimization dashboard"]
        apps_ar = ["منصة أتمتة سحابية ذكية", "لوحة تحكم محلية لتحسين البنية التحتية"]
        cust_en = ["SDAIA", "Ministry of Communications and Information Technology"]
        cust_ar = ["الهيئة السعودية للبيانات والذكاء الاصطناعي (سدايا)", "وزارة الاتصالات وتقنية المعلومات"]

    roadmap_en = [
        "Core technical validation and proof-of-concept refinement",
        "Wadi Makkah Innovation Lab prototype creation",
        "Field pilot in cooperation with target Saudi public entities",
        "Wadi Makkah investment showcase pitch"
    ]
    roadmap_ar = [
        "التحقق التقني الأساسي وتحسين إثبات المفهوم",
        "إنشاء النموذج الأولي في مختبر الابتكار بوادي مكة",
        "التطبيق التجريبي الميداني بالتعاون مع الجهات السعودية المستهدفة",
        "تقديم المشروع في فعاليات الاستثمار بوادي مكة"
    ]

    # Match startups
    matched_startups, matched_challenges = find_similar_entities(text, text)
    
    # Titles translations if missing
    title_en = text[:60] + "..." if len(text) > 60 else text
    title_ar = "تحليل مشروع: " + title_en
    if has_arabic:
        title_ar = text[:60] + "..." if len(text) > 60 else text
        title_en = "Project Analysis: " + title_ar

    return {
        "title_en": title_en,
        "title_ar": title_ar,
        "abstract_en": text if not has_arabic else "Abstract translated automatically.",
        "abstract_ar": text if has_arabic else "الملخص تم ترجمته تلقائياً.",
        "sector": sector,
        "trl": trl,
        "track": get_wadi_makkah_track(trl),
        "commercial_apps_en": apps_en,
        "commercial_apps_ar": apps_ar,
        "customers_en": cust_en,
        "customers_ar": cust_ar,
        "startups": matched_startups,
        "roadmap_en": roadmap_en,
        "roadmap_ar": roadmap_ar,
        "analyst_notes": "Generated automatically using Local NLP Heuristics (Gemini Key not configured)."
    }

# Gemini-Based Detailed Academic Analyzer
def analyze_paper_text(text, api_key=None):
    key_to_use = api_key or GEMINI_API_KEY
    if not key_to_use:
        print("Gemini API key not found. Running local fallback analysis.")
        return run_local_fallback_analysis(text)
        
    prompt = f"""
    You are an expert technology transfer officer and VC analyst working for Wadi Makkah (the commercialization and investment arm of Umm Al-Qura University in Makkah, Saudi Arabia).
    Analyze the academic research abstract or project proposal below.
    
    Input Text:
    \"\"\"{text}\"\"\"
    
    You must output a single, valid JSON object containing the fields below. Do not output any formatting besides the JSON itself, and do not wrap it in markdown block tags except possibly a json tag.
    
    Fields required in JSON:
    1. "title_en": (string) Professional English title for the project
    2. "title_ar": (string) Accurate Arabic translation of the title
    3. "abstract_en": (string) English summary of the research (clean it if messy)
    4. "abstract_ar": (string) High-quality Arabic translation of the summary
    5. "sector": (string) Choose EXACTLY one of these strategic sectors:
       - "Hajj & Umrah Tech"
       - "HealthTech & Biotech"
       - "Clean Energy & Environment"
       - "Smart Infrastructure & IoT"
       - "Islamic Finance & Digital Economy"
    6. "trl": (integer from 1 to 9) Determine the Technology Readiness Level.
       - TRL 1-2: Basic research / conceptual principles
       - TRL 3-4: Laboratory proof of concept / component validation
       - TRL 5-6: Prototype validated in simulated or operational environment
       - TRL 7-8: System demonstration / actual pilot deployed
       - TRL 9: Full commercial application / production deployment
    7. "trl_justification": (string) Brief reason in English for selecting this TRL level.
    8. "commercial_apps_en": (array of 3 strings) Promising commercial use cases or software/hardware products that could arise from this technology, in English.
    9. "commercial_apps_ar": (array of 3 strings) The same commercial applications translated to professional Arabic.
    10. "customers_en": (array of 3 strings) Specific Saudi entities, government ministries, or companies that would buy or use this technology (e.g. Ministry of Hajj & Umrah, NEOM, KIDANA, Aramco, Ministry of Health, SABIC, etc.), in English.
    11. "customers_ar": (array of 3 strings) The same target customers in Arabic.
    12. "roadmap_en": (array of 4 strings) Step-by-step commercialization path in English (e.g., prototyping, lab validation, licensing, spin-out creation).
    13. "roadmap_ar": (array of 4 strings) Step-by-step commercialization path in Arabic.
    
    Make sure your JSON is perfectly valid and compliant with this structure.
    """
    
    try:
        genai.configure(api_key=key_to_use)
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        
        # Clean response text to extract JSON
        response_text = response.text.strip()
        # Remove markdown wraps if any
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        analysis = json.loads(response_text)
        
        # Append calculated track
        trl = int(analysis.get("trl", 3))
        analysis["trl"] = trl
        analysis["track"] = get_wadi_makkah_track(trl)
        
        # Add dynamic similar startups & challenges using local TF-IDF
        matched_startups, matched_challenges = find_similar_entities(
            analysis.get("title_en", "") + " " + analysis.get("abstract_en", ""),
            analysis.get("title_ar", "") + " " + analysis.get("abstract_ar", "")
        )
        analysis["startups"] = matched_startups
        analysis["analyst_notes"] = f"AI generated using Gemini. TRL justified: {analysis.get('trl_justification', 'N/A')}"
        
        return analysis
        
    except Exception as e:
        print(f"Gemini generation error: {e}. Falling back to local NLP analysis.")
        return run_local_fallback_analysis(text)
