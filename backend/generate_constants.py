import os
import base64
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

IMAGE_PATH = r"C:\Users\RICKSHII\.gemini\antigravity\brain\e171d12c-2e26-4800-b50e-90ab2d129f14\media__1782291355927.png"

# Read database URL from .env
db_url = None
dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(dotenv_path):
    with open(dotenv_path, "r") as f:
        for line in f:
            if line.startswith("DATABASE_URL="):
                db_url = line.split("=", 1)[1].strip().strip('"').strip("'")

if not db_url:
    db_url = "postgresql://postgres:postgres@localhost:5432/ai_marketing"

print(f"Using DATABASE_URL: {db_url}")

if not os.path.exists(IMAGE_PATH):
    print(f"Error: Image not found at {IMAGE_PATH}")
    exit(1)

with open(IMAGE_PATH, "rb") as image_file:
    encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
    base64_url = f"data:image/png;base64,{encoded_string}"

print(f"Base64 length: {len(base64_url)}")

# 1. Update in the local PostgreSQL database
try:
    engine = create_engine(db_url)
    Session = sessionmaker(bind=engine)
    session = Session()

    # Ensure platform_settings table exists
    session.execute(text("""
        CREATE TABLE IF NOT EXISTS platform_settings (
            id SERIAL PRIMARY KEY,
            key VARCHAR UNIQUE NOT NULL,
            value TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """))
    session.commit()

    # Insert or update qr_image_url
    row = session.execute(text("SELECT id FROM platform_settings WHERE key = :key"), {"key": "qr_image_url"}).fetchone()
    if row:
        session.execute(text("UPDATE platform_settings SET value = :value, updated_at = NOW() WHERE key = :key"), 
                        {"key": "qr_image_url", "value": base64_url})
    else:
        session.execute(text("INSERT INTO platform_settings (key, value) VALUES (:key, :value)"), 
                        {"key": "qr_image_url", "value": base64_url})
    
    session.commit()
    print("Database updated successfully!")
    session.close()
except Exception as e:
    print(f"Failed to update database: {e}")

# 2. Copy to backend uploads/qrs/default_qr.png
uploads_dir = os.path.join(os.path.dirname(__file__), "uploads", "qrs")
os.makedirs(uploads_dir, exist_ok=True)
dest_path = os.path.join(uploads_dir, "default_qr.png")
try:
    import shutil
    shutil.copy(IMAGE_PATH, dest_path)
    print(f"Copied image to backend: {dest_path}")
except Exception as e:
    print(f"Failed to copy to backend uploads: {e}")

# 3. Copy to frontend assets/default_qr.png
frontend_assets_dir = r"r:\Ai Digital Marketing\frontend\src\assets"
os.makedirs(frontend_assets_dir, exist_ok=True)
frontend_dest_path = os.path.join(frontend_assets_dir, "default_qr.png")
try:
    import shutil
    shutil.copy(IMAGE_PATH, frontend_dest_path)
    print(f"Copied image to frontend: {frontend_dest_path}")
except Exception as e:
    print(f"Failed to copy to frontend assets: {e}")

# Save the base64 string to a JS/Python constant file for easy import as a frontend/backend fallback
constant_path_fe = r"r:\Ai Digital Marketing\frontend\src\assets\defaultQRBase64.js"
try:
    with open(constant_path_fe, "w") as f:
        f.write(f"export const DEFAULT_QR_BASE64 = \"{base64_url}\";\n")
    print(f"Saved base64 constant to: {constant_path_fe}")
except Exception as e:
    print(f"Failed to save base64 constant to frontend: {e}")

constant_path_be = os.path.join(os.path.dirname(__file__), "app", "core", "default_qr_constant.py")
try:
    with open(constant_path_be, "w", encoding="utf-8") as f:
        f.write(f"DEFAULT_QR_BASE64 = \"{base64_url}\"\n")
    print(f"Saved base64 constant to backend: {constant_path_be}")
except Exception as e:
    print(f"Failed to save base64 constant to backend: {e}")
