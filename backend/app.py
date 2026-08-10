import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
from database import db
from analyzer import analyze_paper_text, HybridSearchEngine, SECTORS

app = Flask(__name__)
# Enable CORS for frontend development
CORS(app)

# Instantiate the search engine, passing the database getter
search_engine = HybridSearchEngine(db.get_all_projects)

@app.route("/api/projects", methods=["GET"])
def get_projects():
    q = request.args.get("q", "")
    sector = request.args.get("sector", "")
    type_ = request.args.get("type", "")
    status = request.args.get("status", "")
    trl = request.args.get("trl", "")
    track = request.args.get("track", "")
    
    filters = {}
    if sector:
        filters["sector"] = sector
    if type_:
        filters["type"] = type_
    if status:
        filters["status"] = status
    if trl:
        filters["trl"] = trl
    if track:
        filters["track"] = track
        
    results = search_engine.search(q, filters=filters, limit=200)
    return jsonify(results)

@app.route("/api/projects/<project_id>", methods=["GET"])
def get_project(project_id):
    proj = db.get_project_by_id(project_id)
    if proj:
        return jsonify(proj)
    return jsonify({"error": "Project not found"}), 404

@app.route("/api/projects", methods=["POST"])
def add_project():
    data = request.json
    if not data or "text" not in data:
        return jsonify({"error": "Missing 'text' field containing research paper or abstract"}), 400
        
    raw_text = data["text"]
    author_en = data.get("author_en", "Dr. Guest Researcher")
    author_ar = data.get("author_ar", "د. باحث زائر")
    proj_type = data.get("type", "Paper")
    department = data.get("department", "Scientific Research")
    
    # Check for client-supplied Gemini key
    api_key = request.headers.get("X-Gemini-Key")
    
    # Run the Gemini/Local analysis on the paper text
    analysis = analyze_paper_text(raw_text, api_key=api_key)
    
    # Generate unique ID
    all_projects = db.get_all_projects()
    next_id = 1001
    if all_projects:
        ids = [int(p["id"].split("-")[1]) for p in all_projects if "-" in p.get("id", "")]
        if ids:
            next_id = max(ids) + 1
            
    project_id = f"UQU-{next_id}"
    
    # Merge analysis results with meta fields
    new_project = {
        "id": project_id,
        "title_en": analysis.get("title_en", "UQU Academic Project"),
        "title_ar": analysis.get("title_ar", "مشروع أكاديمي بجامعة أم القرى"),
        "abstract_en": analysis.get("abstract_en", raw_text),
        "abstract_ar": analysis.get("abstract_ar", ""),
        "type": proj_type,
        "department": department,
        "sector": analysis.get("sector", "Smart Infrastructure & IoT"),
        "trl": int(analysis.get("trl", 3)),
        "track": analysis.get("track", "Nomow Incubator (حاضنة نمو)"),
        "author_en": author_en,
        "author_ar": author_ar,
        "status": "Pending", # Starts as pending for admin approval
        "submission_date": datetime.now().strftime("%Y-%m-%d"),
        "approval_date": None,
        "commercial_apps_en": analysis.get("commercial_apps_en", []),
        "commercial_apps_ar": analysis.get("commercial_apps_ar", []),
        "customers_en": analysis.get("customers_en", []),
        "customers_ar": analysis.get("customers_ar", []),
        "startups": analysis.get("startups", []),
        "roadmap_en": analysis.get("roadmap_en", []),
        "roadmap_ar": analysis.get("roadmap_ar", []),
        "analyst_notes": analysis.get("analyst_notes", "")
    }
    
    saved_project = db.add_project(new_project)
    return jsonify(saved_project), 201

@app.route("/api/projects/<project_id>/approve", methods=["POST"])
def approve_project(project_id):
    data = request.json or {}
    proj = db.get_project_by_id(project_id)
    if not proj:
        return jsonify({"error": "Project not found"}), 404
        
    # We can accept updated fields from the admin before approval
    updated_fields = {
        "status": "Approved",
        "approval_date": datetime.now().strftime("%Y-%m-%d"),
    }
    
    # Allowed editable fields from the review hub
    editable_keys = [
        "title_en", "title_ar", "abstract_en", "abstract_ar",
        "trl", "track", "sector",
        "commercial_apps_en", "commercial_apps_ar",
        "customers_en", "customers_ar",
        "roadmap_en", "roadmap_ar",
        "analyst_notes"
    ]
    
    for key in editable_keys:
        if key in data:
            if key == "trl":
                updated_fields[key] = int(data[key])
            else:
                updated_fields[key] = data[key]
                
    updated_proj = db.update_project(project_id, updated_fields)
    return jsonify(updated_proj)

@app.route("/api/projects/<project_id>", methods=["DELETE"])
def delete_project(project_id):
    success = db.delete_project(project_id)
    if success:
        return jsonify({"success": True})
    return jsonify({"error": "Project not found"}), 404

@app.route("/api/stats", methods=["GET"])
def get_stats():
    projects = db.get_all_projects()
    
    total = len(projects)
    approved = sum(1 for p in projects if p.get("status") == "Approved")
    pending = sum(1 for p in projects if p.get("status") == "Pending")
    
    # Industry split
    sector_counts = {}
    for p in projects:
        sec = p.get("sector")
        if sec:
            sector_counts[sec] = sector_counts.get(sec, 0) + 1
            
    # TRL split
    trl_counts = {"1-2": 0, "3-4": 0, "5-6": 0, "7-9": 0}
    for p in projects:
        trl = p.get("trl", 1)
        if trl <= 2:
            trl_counts["1-2"] += 1
        elif trl <= 4:
            trl_counts["3-4"] += 1
        elif trl <= 6:
            trl_counts["5-6"] += 1
        else:
            trl_counts["7-9"] += 1
            
    # Track split
    track_counts = {}
    for p in projects:
        tr = p.get("track")
        if tr:
            track_counts[tr] = track_counts.get(tr, 0) + 1
            
    # List of pending items (first 10 for review sidebar/list)
    pending_list = [p for p in projects if p.get("status") == "Pending"]
    pending_list.sort(key=lambda x: x.get("submission_date", ""), reverse=True)
    
    return jsonify({
        "total": total,
        "approved": approved,
        "pending": pending,
        "sectors": sector_counts,
        "trls": trl_counts,
        "tracks": track_counts,
        "recent_pending": pending_list[:10]
    })

@app.route("/api/sectors", methods=["GET"])
def get_sectors():
    return jsonify(SECTORS)

if __name__ == "__main__":
    app.run(port=5000, debug=True)
