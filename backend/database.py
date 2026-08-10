import os
import json
import threading

class JSONDatabase:
    def __init__(self, db_path="data/db.json"):
        self.db_path = db_path
        self.lock = threading.Lock()
        self._ensure_db_exists()

    def _ensure_db_exists(self):
        directory = os.path.dirname(self.db_path)
        if directory and not os.path.exists(directory):
            os.makedirs(directory)
        
        with self.lock:
            if not os.path.exists(self.db_path) or os.path.getsize(self.db_path) == 0:
                self._save_data({"projects": []})

    def _load_data(self):
        try:
            with open(self.db_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {"projects": []}

    def _save_data(self, data):
        with open(self.db_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def get_all_projects(self):
        with self.lock:
            data = self._load_data()
            return data.get("projects", [])

    def get_project_by_id(self, project_id):
        with self.lock:
            data = self._load_data()
            for p in data.get("projects", []):
                if p.get("id") == project_id:
                    return p
            return None

    def add_project(self, project):
        with self.lock:
            data = self._load_data()
            if "projects" not in data:
                data["projects"] = []
            
            # Check if project already exists
            exists = False
            for idx, p in enumerate(data["projects"]):
                if p.get("id") == project.get("id"):
                    data["projects"][idx] = project
                    exists = True
                    break
            
            if not exists:
                data["projects"].append(project)
                
            self._save_data(data)
            return project

    def update_project(self, project_id, updated_fields):
        with self.lock:
            data = self._load_data()
            updated_p = None
            for idx, p in enumerate(data.get("projects", [])):
                if p.get("id") == project_id:
                    # Update fields
                    for key, val in updated_fields.items():
                        p[key] = val
                    data["projects"][idx] = p
                    updated_p = p
                    break
            if updated_p:
                self._save_data(data)
            return updated_p

    def delete_project(self, project_id):
        with self.lock:
            data = self._load_data()
            projects = data.get("projects", [])
            initial_len = len(projects)
            projects = [p for p in projects if p.get("id") != project_id]
            data["projects"] = projects
            if len(projects) < initial_len:
                self._save_data(data)
                return True
            return False

# Global database instance
db = JSONDatabase()
