"""
Module 4 – SEO Audit Service
Performs a comprehensive on-page + technical SEO audit:
  • Meta Title Analysis
  • Meta Description Analysis
  • Keyword Density Check
  • Header Structure Analysis (H1/H2/H3)
  • Content Length Analysis
  • Readability Score (Flesch Reading Ease)
  • Robots.txt Check
  • Sitemap.xml Check
  • Canonical Tags Check
  • HTTPS Verification
  • SEO Score (0-100)
  • SEO Errors Report
  • SEO Recommendations
"""

import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin
from collections import Counter
from sqlalchemy.orm import Session
from app.models.audit import WebsiteAudit
from app.schemas.audit import WebsiteAuditRequest
from typing import List, Dict, Any, Optional, Tuple
import logging

logger = logging.getLogger("uvicorn.error")

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
}

# Common English stopwords to exclude from keyword density
STOPWORDS = {
    "the","a","an","and","or","but","in","on","at","to","for","of","with",
    "by","from","as","is","was","are","were","be","been","being","have",
    "has","had","do","does","did","will","would","could","should","may",
    "might","shall","can","this","that","these","those","it","its","we",
    "our","you","your","he","she","they","their","i","my","me","us","not",
    "if","so","than","then","there","here","when","where","who","which",
    "what","how","all","any","both","each","few","more","most","other",
    "some","such","no","nor","too","very","just","also","into","through",
    "about","after","before","between","during","up","down","out","over",
    "under","again","further","once","same","own","off","while","s","t",
}


# ── Readability ────────────────────────────────────────────────────────────────

def _count_syllables(word: str) -> int:
    """Rough English syllable counter."""
    word = word.lower().strip(".,!?;:'\"")
    if not word:
        return 0
    vowels = "aeiouy"
    count = 0
    prev_vowel = False
    for ch in word:
        is_vowel = ch in vowels
        if is_vowel and not prev_vowel:
            count += 1
        prev_vowel = is_vowel
    # Silent 'e' at end
    if word.endswith("e") and count > 1:
        count -= 1
    return max(1, count)


def _flesch_reading_ease(text: str) -> Tuple[float, str]:
    """
    Compute Flesch Reading Ease score and a human-readable grade label.
    Score 90-100 → Very Easy, 60-89 → Easy/Standard, 30-59 → Difficult, <30 → Very Difficult
    """
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    words = re.findall(r'\b[a-zA-Z]+\b', text)

    if not words or not sentences:
        return 0.0, "Unknown"

    total_sentences = len(sentences)
    total_words = len(words)
    total_syllables = sum(_count_syllables(w) for w in words)

    asl = total_words / total_sentences           # avg sentence length
    asw = total_syllables / total_words           # avg syllables per word
    score = 206.835 - (1.015 * asl) - (84.6 * asw)
    score = max(0.0, min(100.0, round(score, 1)))

    if score >= 80:
        grade = "Very Easy"
    elif score >= 60:
        grade = "Easy"
    elif score >= 50:
        grade = "Standard"
    elif score >= 30:
        grade = "Difficult"
    else:
        grade = "Very Difficult"

    return score, grade


# ── Keyword density ────────────────────────────────────────────────────────────

def _keyword_density(text: str, top_n: int = 10) -> Dict[str, Any]:
    """Return top_n keywords by frequency with their density %."""
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    filtered = [w for w in words if w not in STOPWORDS]
    total = len(filtered) or 1
    counts = Counter(filtered)
    top = counts.most_common(top_n)
    return {
        "total_words_analyzed": total,
        "top_keywords": [
            {"keyword": kw, "count": cnt, "density": round(cnt / total * 100, 2)}
            for kw, cnt in top
        ],
    }


# ── HTTP helpers ───────────────────────────────────────────────────────────────

def _fetch(url: str, timeout: int = 8) -> Tuple[Optional[str], int, str]:
    """
    Fetch URL → (html_content, status_code, final_url)
    Returns (None, error_status, url) on failure.
    """
    try:
        resp = requests.get(url, headers=HEADERS, timeout=timeout, verify=False, allow_redirects=True)
        return resp.text, resp.status_code, resp.url
    except Exception as e:
        logger.warning(f"Fetch failed for {url}: {e}")
        return None, 0, url


def _url_exists(url: str, timeout: int = 5) -> bool:
    try:
        resp = requests.head(url, headers=HEADERS, timeout=timeout, verify=False, allow_redirects=True)
        return resp.status_code < 400
    except Exception:
        try:
            resp = requests.get(url, headers=HEADERS, timeout=timeout, verify=False, allow_redirects=True)
            return resp.status_code < 400
        except Exception:
            return False


# ── Main audit service ─────────────────────────────────────────────────────────

class AuditService:

    @staticmethod
    def run_audit(db: Session, user_id: int, audit_in: WebsiteAuditRequest) -> WebsiteAudit:
        url = audit_in.website_url.strip()
        if not url.startswith(("http://", "https://")):
            url = "https://" + url

        parsed = urlparse(url)
        base_url = f"{parsed.scheme}://{parsed.netloc}"
        domain = parsed.netloc

        seo_errors: List[Dict[str, Any]] = []

        # ── Fetch main page ────────────────────────────────────────────────────
        html, status_code, final_url = _fetch(url)
        is_https = final_url.startswith("https://")
        url = final_url  # Follow redirect

        if html is None:
            # Build minimal stub so the audit still saves
            html = f"<html><head><title>Unreachable</title></head><body><h1>Unreachable</h1></body></html>"
            status_code = 0
            seo_errors.append({"level": "critical", "message": f"Website unreachable. Could not connect to {url}."})

        soup = BeautifulSoup(html, "html.parser")

        # ── 1. Title Analysis ──────────────────────────────────────────────────
        title_tag = soup.find("title")
        title = title_tag.get_text().strip() if title_tag else None
        title_len = len(title) if title else 0

        if not title:
            seo_errors.append({"level": "critical", "message": "Missing <title> tag — critical for SEO."})
        elif title_len < 30:
            seo_errors.append({"level": "warning", "message": f"Title too short ({title_len} chars). Aim for 30–60 characters."})
        elif title_len > 60:
            seo_errors.append({"level": "warning", "message": f"Title too long ({title_len} chars). Keep it under 60 to avoid truncation in SERPs."})

        # ── 2. Meta Description ────────────────────────────────────────────────
        meta_desc_tag = (
            soup.find("meta", attrs={"name": "description"})
            or soup.find("meta", attrs={"property": "og:description"})
        )
        meta_desc = meta_desc_tag.get("content", "").strip() if meta_desc_tag else None
        meta_len = len(meta_desc) if meta_desc else 0

        if not meta_desc:
            seo_errors.append({"level": "critical", "message": "Missing meta description — required for SERP snippets and CTR."})
        elif meta_len < 120:
            seo_errors.append({"level": "warning", "message": f"Meta description too short ({meta_len} chars). Aim for 120–160 characters."})
        elif meta_len > 160:
            seo_errors.append({"level": "warning", "message": f"Meta description too long ({meta_len} chars). It will be truncated in search results."})

        # ── 3. Header Structure Analysis ──────────────────────────────────────
        h1s = [h.get_text(separator=" ").strip() for h in soup.find_all("h1") if h.get_text().strip()]
        h2s = [h.get_text(separator=" ").strip() for h in soup.find_all("h2") if h.get_text().strip()][:25]
        h3s = [h.get_text(separator=" ").strip() for h in soup.find_all("h3") if h.get_text().strip()][:25]

        if len(h1s) == 0:
            seo_errors.append({"level": "critical", "message": "No H1 tag found. Every page must have exactly one H1 as the primary heading."})
        elif len(h1s) > 1:
            seo_errors.append({"level": "warning", "message": f"Multiple H1 tags found ({len(h1s)}). Use only one H1 per page."})
        if len(h2s) == 0:
            seo_errors.append({"level": "info", "message": "No H2 tags found. Use H2 headings to structure your content."})

        # ── 4. Image Alt Tags ──────────────────────────────────────────────────
        images = soup.find_all("img")
        images_total = len(images)
        images_missing_alt = sum(1 for img in images if not (img.get("alt") or "").strip())

        if images_missing_alt > 0:
            seo_errors.append({
                "level": "warning",
                "message": f"{images_missing_alt}/{images_total} images missing ALT attributes — impacts accessibility and image SEO.",
            })

        # ── 5. HTTPS Check ─────────────────────────────────────────────────────
        if not is_https:
            seo_errors.append({"level": "critical", "message": "Site is NOT served over HTTPS. Google uses HTTPS as a ranking signal."})

        # ── 6. Canonical Tag Check ─────────────────────────────────────────────
        canonical_tag = soup.find("link", attrs={"rel": "canonical"})
        has_canonical = canonical_tag is not None
        canonical_url_val = canonical_tag.get("href", "").strip() if canonical_tag else None

        if not has_canonical:
            seo_errors.append({"level": "warning", "message": "No canonical tag found. Add <link rel='canonical'> to prevent duplicate-content issues."})

        # ── 7. Robots.txt Check ────────────────────────────────────────────────
        robots_url = urljoin(base_url, "/robots.txt")
        has_robots = _url_exists(robots_url)
        if not has_robots:
            seo_errors.append({"level": "warning", "message": "robots.txt not found. Search engines may crawl unwanted pages without it."})

        # ── 8. Sitemap.xml Check ──────────────────────────────────────────────
        sitemap_url = urljoin(base_url, "/sitemap.xml")
        has_sitemap = _url_exists(sitemap_url)
        if not has_sitemap:
            seo_errors.append({"level": "warning", "message": "sitemap.xml not found. A sitemap helps search engines discover and index all your pages."})

        # ── 9. Content Length & Readability ───────────────────────────────────
        # Extract visible text (exclude script/style/nav)
        for tag in soup(["script", "style", "nav", "header", "footer", "aside"]):
            tag.decompose()
        body_text = soup.get_text(separator=" ", strip=True)
        words = re.findall(r'\b[a-zA-Z]+\b', body_text)
        word_count = len(words)

        if word_count < 300:
            seo_errors.append({"level": "warning", "message": f"Low content volume ({word_count} words). Pages with 500+ words rank significantly better."})

        readability_score, readability_grade = _flesch_reading_ease(body_text)

        # ── 10. Keyword Density ────────────────────────────────────────────────
        keyword_density = _keyword_density(body_text, top_n=10)

        # ── 11. Internal Links & Assets ───────────────────────────────────────
        anchors = soup.find_all("a", href=True)
        discovered_links: set = set()
        for a in anchors:
            href = a.get("href", "").strip()
            abs_link = urljoin(url, href)
            lp = urlparse(abs_link)
            if lp.netloc == domain and abs_link not in discovered_links:
                discovered_links.add(abs_link)
                if len(discovered_links) >= 30:
                    break
        internal_links = list(discovered_links)

        # Re-parse soup from original HTML (we decomposed the original for text extraction)
        soup2 = BeautifulSoup(html, "html.parser")
        scripts_count = len(soup2.find_all("script"))
        stylesheets_count = len(soup2.find_all("link", attrs={"rel": "stylesheet"})) + len(soup2.find_all("style"))

        if scripts_count > 20:
            seo_errors.append({"level": "info", "message": f"High script count ({scripts_count}). Consider deferring or combining JS files to improve page speed."})
        if stylesheets_count > 10:
            seo_errors.append({"level": "info", "message": f"High stylesheet count ({stylesheets_count}). Consolidate CSS files to reduce render-blocking resources."})

        # ── SEO SCORE (0–100) ─────────────────────────────────────────────────
        # Weighted check-list scoring:
        seo_score = 0
        # HTTPS: 15 pts
        if is_https:
            seo_score += 15
        # Title: 15 pts
        if title:
            seo_score += 10
            if 30 <= title_len <= 60:
                seo_score += 5
        # Meta description: 15 pts
        if meta_desc:
            seo_score += 10
            if 120 <= meta_len <= 160:
                seo_score += 5
        # H1: 10 pts
        if len(h1s) == 1:
            seo_score += 10
        elif len(h1s) > 1:
            seo_score += 5
        # H2: 5 pts
        if h2s:
            seo_score += 5
        # Images alt: 10 pts
        if images_total > 0:
            alt_ratio = (images_total - images_missing_alt) / images_total
            seo_score += int(alt_ratio * 10)
        else:
            seo_score += 10
        # Canonical: 5 pts
        if has_canonical:
            seo_score += 5
        # Robots: 5 pts
        if has_robots:
            seo_score += 5
        # Sitemap: 5 pts
        if has_sitemap:
            seo_score += 5
        # Content length: 5 pts
        if word_count >= 500:
            seo_score += 5
        elif word_count >= 300:
            seo_score += 3
        # Internal links: 5 pts
        if len(internal_links) >= 5:
            seo_score += 5
        elif internal_links:
            seo_score += 2

        seo_score = min(100, max(0, seo_score))

        # ── HEALTH SCORE (0–100) ───────────────────────────────────────────────
        health_score = 0
        if status_code and status_code < 400:
            health_score += 20
        if is_https:
            health_score += 15
        if title:
            health_score += 10 if 30 <= title_len <= 60 else 7
        if meta_desc:
            health_score += 10 if 120 <= meta_len <= 160 else 7
        if h1s and h2s:
            health_score += 15
        elif h1s or h2s:
            health_score += 8
        bloat = max(0, (scripts_count - 15) + (stylesheets_count - 8))
        health_score += max(0, 15 - bloat)
        if word_count >= 500:
            health_score += 10
        elif word_count >= 200:
            health_score += 5
        if readability_score >= 60:
            health_score += 5

        if status_code == 0:
            health_score = 5
            seo_score = 5

        health_score = min(100, max(0, health_score))

        # ── RECOMMENDATIONS ────────────────────────────────────────────────────
        suggestions: List[str] = []

        if not is_https:
            suggestions.append("🔒 Enable HTTPS. Install an SSL certificate — it's a confirmed Google ranking factor and critical for user trust.")
        if not title:
            suggestions.append("📝 Add a descriptive <title> tag. It's the single most important on-page SEO element and appears in browser tabs and search results.")
        elif title_len < 30 or title_len > 60:
            suggestions.append(f"✏️ Optimize your title length (currently {title_len} chars). Keep it between 30–60 characters to avoid truncation in Google results.")
        if not meta_desc:
            suggestions.append("📄 Write a compelling meta description (120–160 chars). Although not a direct ranking factor, it significantly improves click-through rates from search results.")
        elif meta_len < 120 or meta_len > 160:
            suggestions.append(f"✏️ Adjust meta description length (currently {meta_len} chars). Aim for 120–160 characters.")
        if len(h1s) == 0:
            suggestions.append("🏷️ Add exactly one H1 tag to each page to define the main topic for search engines.")
        elif len(h1s) > 1:
            suggestions.append(f"🏷️ Reduce to a single H1 tag (found {len(h1s)}). Multiple H1s confuse search engine crawlers about your page topic.")
        if not h2s:
            suggestions.append("📑 Add H2 subheadings to break up content — they improve readability and help search engines understand your content structure.")
        if images_missing_alt > 0:
            suggestions.append(f"🖼️ Add ALT text to {images_missing_alt} image(s). ALT attributes help visually impaired users and allow search engines to index your image content.")
        if not has_canonical:
            suggestions.append("🔗 Add a <link rel='canonical'> tag to specify the authoritative version of each page and prevent duplicate-content penalties.")
        if not has_robots:
            suggestions.append("🤖 Create a robots.txt file at the root of your domain. It guides search engine crawlers and prevents indexing of sensitive areas.")
        if not has_sitemap:
            suggestions.append("🗺️ Submit an XML sitemap at /sitemap.xml. It ensures all your important pages are discoverable by search engines, especially new content.")
        if word_count < 300:
            suggestions.append(f"📖 Increase your content length (currently {word_count} words). Pages with 600+ words tend to rank significantly higher due to deeper topic coverage.")
        if readability_grade in ("Difficult", "Very Difficult"):
            suggestions.append(f"📖 Improve readability (Flesch score: {readability_score}/100 — {readability_grade}). Use shorter sentences and simpler vocabulary to engage a wider audience.")
        if scripts_count > 20:
            suggestions.append(f"⚡ Reduce JavaScript load ({scripts_count} scripts). Defer non-critical JS and bundle files to improve page speed scores.")
        if stylesheets_count > 10:
            suggestions.append(f"⚡ Consolidate CSS files ({stylesheets_count} stylesheets). Minify and combine stylesheets to reduce render-blocking resources.")
        if len(internal_links) < 3:
            suggestions.append("🔗 Add more internal links. Interlinking pages distributes link equity across your site and helps users and crawlers discover related content.")

        if not suggestions:
            suggestions.append("🎉 Excellent! Your page passes all key SEO checks. Keep creating high-quality content and monitor Core Web Vitals in Google Search Console for continued improvement.")

        # ── Audit Report Breakdown ─────────────────────────────────────────────
        audit_report = {
            "status_code": status_code,
            "is_https": is_https,
            # Title
            "has_title": title is not None,
            "title_length": title_len,
            "title_optimal": 30 <= title_len <= 60 if title else False,
            # Meta
            "has_meta_desc": meta_desc is not None,
            "meta_desc_length": meta_len,
            "meta_desc_optimal": 120 <= meta_len <= 160 if meta_desc else False,
            # Headers
            "h1_count": len(h1s),
            "h2_count": len(h2s),
            "h3_count": len(h3s),
            # Images
            "images_total": images_total,
            "images_missing_alt": images_missing_alt,
            "image_alt_coverage": round((images_total - images_missing_alt) / images_total * 100, 1) if images_total else 100,
            # Technical
            "has_canonical": has_canonical,
            "canonical_url": canonical_url_val,
            "has_robots_txt": has_robots,
            "has_sitemap": has_sitemap,
            # Assets
            "scripts_count": scripts_count,
            "stylesheets_count": stylesheets_count,
            # Content
            "word_count": word_count,
            "readability_score": readability_score,
            "readability_grade": readability_grade,
            # Links
            "internal_links_count": len(internal_links),
            # Errors
            "total_errors": len([e for e in seo_errors if e["level"] == "critical"]),
            "total_warnings": len([e for e in seo_errors if e["level"] == "warning"]),
            "total_infos": len([e for e in seo_errors if e["level"] == "info"]),
        }

        # ── Save to DB ─────────────────────────────────────────────────────────
        db_audit = WebsiteAudit(
            user_id=user_id,
            website_url=url,
            title=title,
            meta_description=meta_desc,
            h1_tags=h1s,
            h2_tags=h2s,
            h3_tags=h3s,
            image_alt_tags={"total": images_total, "missing_alt": images_missing_alt},
            images_count=images_total,
            is_https=is_https,
            has_robots_txt=has_robots,
            has_sitemap=has_sitemap,
            has_canonical=has_canonical,
            canonical_url=canonical_url_val,
            internal_links=internal_links,
            scripts_count=scripts_count,
            stylesheets_count=stylesheets_count,
            word_count=word_count,
            readability_score=readability_score,
            readability_grade=readability_grade,
            keyword_density=keyword_density,
            health_score=health_score,
            seo_score=seo_score,
            audit_report=audit_report,
            improvement_suggestions=suggestions,
            seo_errors=seo_errors,
        )

        db.add(db_audit)
        db.commit()
        db.refresh(db_audit)
        return db_audit

    @staticmethod
    def get_user_audits(db: Session, user_id: int) -> List[WebsiteAudit]:
        return (
            db.query(WebsiteAudit)
            .filter(WebsiteAudit.user_id == user_id)
            .order_by(WebsiteAudit.created_at.desc())
            .all()
        )

    @staticmethod
    def get_audit(db: Session, audit_id: int, user_id: int) -> Optional[WebsiteAudit]:
        return (
            db.query(WebsiteAudit)
            .filter(WebsiteAudit.id == audit_id, WebsiteAudit.user_id == user_id)
            .first()
        )
