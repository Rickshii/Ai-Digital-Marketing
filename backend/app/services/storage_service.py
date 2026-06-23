import os
import uuid
import requests
from app.core.config import settings

class StorageService:
    @staticmethod
    def upload_file(file_bytes: bytes, filename: str, mime_type: str, folder: str = "general") -> str:
        """Uploads a file to Supabase Storage if configured, otherwise falls back to local storage.
        
        Returns the public URL or relative path of the uploaded file.
        """
        supabase_url = os.environ.get("SUPABASE_URL") or getattr(settings, "SUPABASE_URL", None)
        supabase_key = os.environ.get("SUPABASE_KEY") or os.environ.get("SUPABASE_SERVICE_KEY") or getattr(settings, "SUPABASE_KEY", None)
        bucket_name = os.environ.get("SUPABASE_BUCKET") or getattr(settings, "SUPABASE_BUCKET", "uploads")

        # If Supabase credentials are not configured, fall back to local disk storage
        if not supabase_url or not supabase_key:
            print("[StorageService] Supabase URL or Key not set. Falling back to local storage.")
            # Ensure local folder exists under uploads
            local_dir = os.path.join("uploads", folder)
            os.makedirs(local_dir, exist_ok=True)
            
            ext = filename.split(".")[-1] if "." in filename else "png"
            unique_filename = f"{uuid.uuid4().hex}.{ext}"
            filepath = os.path.join(local_dir, unique_filename)
            
            with open(filepath, "wb") as buffer:
                buffer.write(file_bytes)
                
            # Return relative URL
            return f"/uploads/{folder}/{unique_filename}"

        # Clean Supabase URL
        supabase_url = supabase_url.rstrip("/")
        ext = filename.split(".")[-1] if "." in filename else "png"
        unique_filename = f"{folder}/{uuid.uuid4().hex}.{ext}"
        
        # Endpoint to upload: POST /storage/v1/object/{bucket}/{path}
        upload_url = f"{supabase_url}/storage/v1/object/{bucket_name}/{unique_filename}"
        
        headers = {
            "Authorization": f"Bearer {supabase_key}",
            "apikey": supabase_key,
            "Content-Type": mime_type
        }
        
        try:
            print(f"[StorageService] Uploading to Supabase Storage: {upload_url}")
            res = requests.post(upload_url, headers=headers, data=file_bytes, timeout=15)
            
            if res.status_code == 200:
                # Public URL structure: {supabase_url}/storage/v1/object/public/{bucket}/{path}
                public_url = f"{supabase_url}/storage/v1/object/public/{bucket_name}/{unique_filename}"
                print(f"[StorageService] Upload successful! Public URL: {public_url}")
                return public_url
            else:
                print(f"[StorageService] Supabase upload failed (status={res.status_code}): {res.text}. Falling back to local storage.")
        except Exception as e:
            print(f"[StorageService] Exception during Supabase upload: {e}. Falling back to local storage.")

        # Local storage fallback on failure
        local_dir = os.path.join("uploads", folder)
        os.makedirs(local_dir, exist_ok=True)
        
        ext = filename.split(".")[-1] if "." in filename else "png"
        unique_filename = f"{uuid.uuid4().hex}.{ext}"
        filepath = os.path.join(local_dir, unique_filename)
        
        with open(filepath, "wb") as buffer:
            buffer.write(file_bytes)
            
        return f"/uploads/{folder}/{unique_filename}"
