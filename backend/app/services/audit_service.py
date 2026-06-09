import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin
from sqlalchemy.orm import Session
from app.models.audit import WebsiteAudit
from app.schemas.audit import WebsiteAuditRequest
from typing import List, Dict, Any, Tuple
import logging

logger = logging.getLogger("uvicorn.error")

class AuditService:
    @staticmethod
    def run_audit(db: Session, user_id: int, audit_in: WebsiteAuditRequest) -> WebsiteAudit:
        url = audit_in.website_url.strip()
        
        # Ensure url has scheme
        if not url.startswith(("http://", "https://")):
            url = "https://" + url
            
        parsed_url = urlparse(url)
        domain = parsed_url.netloc
        
        # Initialize default audit values (in case fetch fails)
        title = None
        meta_desc = None
        h1s = []
        h2s = []
        images_total = 0
        images_missing_alt = 0
        is_https = url.startswith("https://")
        internal_links = []
        scripts_count = 0
        stylesheets_count = 0
        
        status_code = 200
        error_message = None
        
        # Attempt to fetch page content
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
        }
        
        try:
            # First attempt: Try the URL as is (with a 8 second timeout)
            response = requests.get(url, headers=headers, timeout=8, verify=False)
            status_code = response.status_code
            html_content = response.text
            # Update url in case of redirects
            url = response.url
            is_https = url.startswith("https://")
        except Exception as e:
            # Fallback/stub in case the site is unreachable (to allow testing mock sites)
            logger.error(f"Failed to fetch {url}: {e}")
            error_message = str(e)
            html_content = f"""
            <html>
                <head>
                    <title>Error loading website</title>
                    <meta name="description" content="The website at {url} was unreachable during the audit.">
                </head>
                <body>
                    <h1>Unreachable Website</h1>
                    <h2>Connection Failed</h2>
                    <p>Details: {error_message}</p>
                </body>
            </html>
            """
            status_code = 500
            
        # Parse HTML
        soup = BeautifulSoup(html_content, "html.parser")
        
        # 1. Title
        title_tag = soup.find("title")
        if title_tag:
            title = title_tag.get_text().strip()
            
        # 2. Meta Description
        meta_desc_tag = soup.find("meta", attrs={"name": "description"}) or soup.find("meta", attrs={"property": "og:description"})
        if meta_desc_tag:
            meta_desc = meta_desc_tag.get("content", "").strip()
            
        # 3. H1 Tags
        h1s = [h1.get_text().strip() for h1 in soup.find_all("h1") if h1.get_text().strip()]
        
        # 4. H2 Tags
        h2s = [h2.get_text().strip() for h2 in soup.find_all("h2") if h2.get_text().strip()][:25] # Cap at 25 for report length
        
        # 5. Image Alt Tags
        images = soup.find_all("img")
        images_total = len(images)
        for img in images:
            alt = img.get("alt")
            if alt is None or not alt.strip():
                images_missing_alt += 1
                
        # 6. Internal Links
        anchors = soup.find_all("a", href=True)
        discovered_links = set()
        for a in anchors:
            href = a.get("href").strip()
            # Resolve relative URLs
            absolute_link = urljoin(url, href)
            parsed_link = urlparse(absolute_link)
            
            # Check if internal link
            if parsed_link.netloc == domain and absolute_link not in discovered_links:
                discovered_links.add(absolute_link)
                if len(discovered_links) >= 30: # Limit count to avoid massive JSON
                    break
        internal_links = list(discovered_links)
        
        # 7. Scripts and Stylesheets
        scripts_count = len(soup.find_all("script"))
        stylesheets_count = len(soup.find_all("link", attrs={"rel": "stylesheet"})) + len(soup.find_all("style"))
        
        # --- SCORING SYSTEM ---
        
        # Technical SEO Score (0-100)
        # 20pts: HTTPS, 20pts: Title present, 20pts: Description present, 15pts: H1 count, 15pts: Image Alts, 10pts: Internal Links
        seo_score = 0
        if is_https:
            seo_score += 20
        if title:
            seo_score += 20
        if meta_desc:
            seo_score += 20
            
        # H1 Check (1 is optimal)
        if len(h1s) == 1:
            seo_score += 15
        elif len(h1s) > 1:
            seo_score += 10 # Deduct for multiple H1s (poor practice)
        
        # Image Alts Check
        if images_total > 0:
            alt_ratio = (images_total - images_missing_alt) / images_total
            seo_score += int(alt_ratio * 15)
        else:
            seo_score += 15 # No images = no missing alt tags
            
        # Internal Links Check
        if len(internal_links) >= 5:
            seo_score += 10
        elif len(internal_links) > 0:
            seo_score += 5
            
        # Health Score (0-100)
        # Focuses on page weight, structure, errors, and styling bloat
        health_score = 0
        if status_code < 400:
            health_score += 20
        else:
            health_score += 5
            
        if is_https:
            health_score += 15
            
        # Title length check (ideal: 30-60 characters)
        if title:
            t_len = len(title)
            if 30 <= t_len <= 60:
                health_score += 15
            else:
                health_score += 10
        
        # Meta description length check (ideal: 120-160 characters)
        if meta_desc:
            d_len = len(meta_desc)
            if 120 <= d_len <= 160:
                health_score += 15
            else:
                health_score += 10
                
        # Page Asset Bloat (Less scripts & styles is better for speed)
        bloat_penalty = max(0, (scripts_count - 15) + (stylesheets_count - 8))
        asset_score = max(0, 20 - bloat_penalty)
        health_score += asset_score
        
        # Content structure
        if len(h1s) > 0 and len(h2s) > 0:
            health_score += 15
        elif len(h1s) > 0 or len(h2s) > 0:
            health_score += 8
            
        # Ensure scores are between 0-100
        seo_score = min(100, max(0, seo_score))
        health_score = min(100, max(0, health_score))
        
        if error_message:
            # Overwrite scores if failed to reach site
            seo_score = 10
            health_score = 10

        # --- GENERATE RECOMMENDATIONS & AUDIT REPORT ---
        suggestions = []
        
        # HTTPS Check
        if not is_https:
            suggestions.append("Enable HTTPS. Secure websites (SSL certificates) are favored by search engines and build user trust.")
            
        # Title check
        if not title:
            suggestions.append("Add a page title. The <title> tag is one of the most critical on-page SEO elements.")
        elif len(title) < 30 or len(title) > 60:
            suggestions.append(f"Optimize title length (currently {len(title)} chars). Keep your title between 30 and 60 characters for best display results in Google search.")
            
        # Meta description check
        if not meta_desc:
            suggestions.append("Add a meta description. A well-written description improves click-through rates (CTR) in search results.")
        elif len(meta_desc) < 120 or len(meta_desc) > 160:
            suggestions.append(f"Optimize meta description length (currently {len(meta_desc)} chars). Aim for 120-160 characters to ensure it isn't truncated in search snippets.")
            
        # Heading Structure
        if len(h1s) == 0:
            suggestions.append("Add exactly one H1 tag to represent the main heading of the page.")
        elif len(h1s) > 1:
            suggestions.append(f"Reduce H1 tags. Found {len(h1s)} H1 tags. Use only one H1 tag per page to maintain clear hierarchy; use H2/H3 for subheadings.")
            
        if len(h2s) == 0:
            suggestions.append("Add H2 tags. Use H2 headings to structure your content into readable, indexable sections.")
            
        # Image Alt Tags
        if images_missing_alt > 0:
            suggestions.append(f"Fix missing ALT attributes on images. Out of {images_total} images, {images_missing_alt} are missing ALT text. Screen readers and search crawlers rely on ALT tags to understand visual content.")
            
        # Assets Bloat
        if scripts_count > 20:
            suggestions.append(f"Reduce external scripts. Found {scripts_count} scripts. High counts slow down page load times. Consider deferring scripts or combining assets.")
        if stylesheets_count > 10:
            suggestions.append(f"Consolidate CSS files. Found {stylesheets_count} stylesheets. Minifying and combining style assets speeds up rendering.")
            
        if error_message:
            suggestions = [
                f"We were unable to establish a secure connection to the website. Error detail: {error_message}.",
                "Double-check that the URL spelling is correct.",
                "Ensure your server allows scraping/bot traffic and is not blocking requests from cloud environments."
            ]

        # Structure Audit Report
        audit_report = {
            "status_code": status_code,
            "error_detail": error_message,
            "has_title": title is not None,
            "title_length": len(title) if title else 0,
            "has_meta_desc": meta_desc is not None,
            "meta_desc_length": len(meta_desc) if meta_desc else 0,
            "h1_count": len(h1s),
            "h2_count": len(h2s),
            "images_total": images_total,
            "images_missing_alt": images_missing_alt,
            "scripts_count": scripts_count,
            "stylesheets_count": stylesheets_count,
            "internal_links_count": len(internal_links),
        }
        
        # Save to DB
        db_audit = WebsiteAudit(
            user_id=user_id,
            website_url=url,
            title=title,
            meta_description=meta_desc,
            h1_tags=h1s,
            h2_tags=h2s,
            image_alt_tags={"total": images_total, "missing_alt": images_missing_alt},
            is_https=is_https,
            internal_links=internal_links,
            images_count=images_total,
            scripts_count=scripts_count,
            stylesheets_count=stylesheets_count,
            health_score=health_score,
            seo_score=seo_score,
            audit_report=audit_report,
            improvement_suggestions=suggestions
        )
        
        db.add(db_audit)
        db.commit()
        db.refresh(db_audit)
        return db_audit

    @staticmethod
    def get_user_audits(db: Session, user_id: int) -> List[WebsiteAudit]:
        return db.query(WebsiteAudit).filter(WebsiteAudit.user_id == user_id).order_by(WebsiteAudit.created_at.desc()).all()

    @staticmethod
    def get_audit(db: Session, audit_id: int, user_id: int) -> WebsiteAudit:
        return db.query(WebsiteAudit).filter(WebsiteAudit.id == audit_id, WebsiteAudit.user_id == user_id).first()
