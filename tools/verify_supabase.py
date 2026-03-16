import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("VITE_SUPABASE_URL")
key: str = os.environ.get("VITE_SUPABASE_ANON_KEY")

if not url or not key:
    print("❌ Supabase URL or Key not found in .env")
    exit(1)

supabase: Client = create_client(url, key)

try:
    response = supabase.table('plots').select("*").limit(1).execute()
    print("✅ Successfully connected to Supabase 'plots' table.")
    print(f"Current data: {response.data}")
except Exception as e:
    print(f"❌ Failed to connect to Supabase: {e}")
