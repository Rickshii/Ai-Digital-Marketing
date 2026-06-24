"""
StorageService — uploads files to Supabase Storage when credentials are set,
otherwise falls back to local disk storage.

For cross-device persistence of QR codes, avatars, and payment screenshots,
configure SUPABASE_URL and SUPABASE_KEY in the backend .env file.

If Supabase is not configured the files are saved to /uploads/ on the server,
which is NOT persistent across Railway / Render redeploys. In that case, the
admin QR code is stored as a base64 data URL directly in the database column
(handled transparently by this service).
"""

import os
import uuid
import base64
import requests
from app.core.config import settings


class StorageService:

    @staticmethod
    def upload_file(file_bytes: bytes, filename: str, mime_type: str,
                    folder: str = "general") -> str:
        """
        Upload file_bytes and return a publicly accessible URL (or data URL).

        Priority:
        1. Supabase Storage (if SUPABASE_URL + SUPABASE_KEY are set)
        2. Local disk  /uploads/<folder>/<uuid>.<ext>  (returns relative URL)
        3. Base64 data URL fallback (used for QR images — survives redeploys)
        """
        supabase_url = (
            os.environ.get("SUPABASE_URL")
            or getattr(settings, "SUPABASE_URL", None)
            or ""
        ).rstrip("/")

        supabase_key = (
            os.environ.get("SUPABASE_KEY")
            or os.environ.get("SUPABASE_SERVICE_KEY")
            or getattr(settings, "SUPABASE_KEY", None)
            or ""
        )

        bucket_name = (
            os.environ.get("SUPABASE_BUCKET")
            or getattr(settings, "SUPABASE_BUCKET", None)
            or "uploads"
        )

        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "png"
        unique_name = f"{folder}/{uuid.uuid4().hex}.{ext}"

        # ── 1. Supabase Storage ───────────────────────────────────────────────
        if supabase_url and supabase_key:
            upload_url = f"{supabase_url}/storage/v1/object/{bucket_name}/{unique_name}"
            headers = {
                "Authorization": f"Bearer {supabase_key}",
                "apikey": supabase_key,
                "Content-Type": mime_type,
            }
            try:
                print(f"[Storage] Uploading to Supabase: {upload_url}")
                res = requests.post(upload_url, headers=headers,
                                    data=file_bytes, timeout=20)
                if res.status_code in (200, 201):
                    public_url = (
                        f"{supabase_url}/storage/v1/object/public"
                        f"/{bucket_name}/{unique_name}"
                    )
                    print(f"[Storage] Supabase upload OK → {public_url}")
                    return public_url
                else:
                    print(
                        f"[Storage] Supabase upload failed "
                        f"(status={res.status_code}): {res.text}"
                    )
            except Exception as e:
                print(f"[Storage] Supabase exception: {e}")

        # ── 2. Local disk ─────────────────────────────────────────────────────
        # Local disk works for development; NOT persistent on cloud platforms.
        local_dir = os.path.join("uploads", folder)
        os.makedirs(local_dir, exist_ok=True)
        local_filename = f"{uuid.uuid4().hex}.{ext}"
        filepath = os.path.join(local_dir, local_filename)

        try:
            with open(filepath, "wb") as buf:
                buf.write(file_bytes)
            relative_url = f"/uploads/{folder}/{local_filename}"
            print(f"[Storage] Saved locally: {relative_url}")
            return relative_url
        except Exception as e:
            print(f"[Storage] Local disk write failed: {e}")

        # ── 3. Base64 data URL (last resort — always works, stored in DB) ─────
        # This ensures QR codes and avatars survive cloud redeploys when neither
        # Supabase nor local disk is available.
        print("[Storage] Falling back to base64 data URL (stored in DB).")
        b64 = base64.b64encode(file_bytes).decode("utf-8")
        return f"data:{mime_type};base64,{b64}"

    @staticmethod
    def is_base64_url(url: str) -> bool:
        """Returns True if the URL is a base64-encoded data URL."""
        return url.startswith("data:")
