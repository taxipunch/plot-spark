import os
import sys
import json
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("VITE_SUPABASE_URL")
key: str = os.environ.get("VITE_SUPABASE_ANON_KEY")

if not url or not key:
    print(json.dumps({"error": "Missing Supabase credentials"}))
    sys.exit(1)

supabase: Client = create_client(url, key)

def get_plots():
    try:
        res = supabase.table('plots').select("*").order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        return {"error": str(e)}

def create_plot(content: str, title: str = None, tags: list = []):
    if not content:
        return {"error": "Content is required"}
    try:
        payload = {"content": content, "tags": tags}
        if title: payload["title"] = title
        res = supabase.table('plots').insert(payload).execute()
        return res.data
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No command provided. Use 'get' or 'create'."}))
        sys.exit(1)
        
    cmd = sys.argv[1]
    
    if cmd == "get":
        print(json.dumps(get_plots()))
    elif cmd == "create":
        if len(sys.argv) < 3:
            print(json.dumps({"error": "Content required for create"}))
        else:
            print(json.dumps(create_plot(sys.argv[2])))
