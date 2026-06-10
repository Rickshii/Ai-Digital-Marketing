import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin
from sqlalchemy.orm import Session
from app.models.social_media import SocialMediaAnalysis
from app.schemas.social_media import SocialMediaAnalysisRequest
from typing import List, Dict, Any, Optional
import logging
import re
import time

logger = logging.getLogger("uvicorn.error")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

PLATFORM_PATTERNS = {
    "facebook": {
        "domain_hints": ["facebook.com", "fb.com"],
        "bio_selectors": ["[data-testid='profile_intro_card']", ".profileText", "meta[name='description']"],
        "contact_patterns": [r'\+?\d[\d\s\-]{7,}', r'[\w.+-]+@[\w-]+\.\w+'],
    },
    "instagram": {
        "domain_hints": ["instagram.com"],
        "bio_selectors": ["meta[name='description']", "meta[property='og:description']"],
        "contact_patterns": [r'[\w.+-]+@[\w-]+\.\w+', r'linktree|linktr\.ee'],
    },
    "linkedin": {
        "domain_hints": ["linkedin.com"],
        "bio_selectors": ["meta[name='description']", "meta[property='og:description']"],
        "contact_patterns": [r'[\w.+-]+@[\w-]+\.\w+'],
    },
    "youtube": {
        "domain_hints": ["youtube.com", "youtu.be"],
        "bio_selectors": ["meta[name='description']", "meta[property='og:description']"],
        "contact_patterns": [r'[\w.+-]+@[\w-]+\.\w+'],
    },
}


def _fetch_page(url: str, timeout: int = 8) -> Optional[str]:
    """Fetch a URL and return its HTML content or None on failure."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=timeout, verify=False, allow_redirects=True)
        if resp.status_code < 400:
            return resp.text
    except Exception as e:
        logger.warning(f"Failed to fetch {url}: {e}")
    return None


def _normalize_url(url: str) -> str:
    if not url:
        return url
    url = url.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    return url


def _analyze_platform(platform: str, url: str) -> Dict[str, Any]:
    """
    Analyze a single social media profile URL and return a structured result dict.
    """
    result = {
        "platform": platform,
        "url": url,
        "reachable": False,
        "profile_found": False,
        "has_bio": False,
        "has_contact": False,
        "has_website_link": False,
        "has_recent_activity": False,
        "posting_frequency": "Unknown",
        "followers": None,
        "posts_count": None,
        "profile_picture": False,
        "completeness_score": 0,
        "issues": [],
        "strengths": [],
    }

    if not url:
        result["issues"].append(f"No {platform.capitalize()} URL provided")
        return result

    url = _normalize_url(url)
    result["url"] = url

    html = _fetch_page(url)
    if not html:
        result["issues"].append(f"Could not reach the {platform.capitalize()} profile. It may be private, blocked, or the URL is incorrect.")
        return result

    result["reachable"] = True
    soup = BeautifulSoup(html, "html.parser")

    # ── Check OG / meta tags which social platforms expose publicly ──────────

    og_title = soup.find("meta", property="og:title") or soup.find("meta", attrs={"name": "title"})
    og_desc = soup.find("meta", property="og:description") or soup.find("meta", attrs={"name": "description"})
    og_image = soup.find("meta", property="og:image")

    title_text = (og_title.get("content", "") if og_title else soup.title.string if soup.title else "") or ""
    desc_text = (og_desc.get("content", "") if og_desc else "") or ""
    image_url = (og_image.get("content", "") if og_image else "") or ""

    # Profile found if we got a meaningful title
    result["profile_found"] = bool(title_text.strip())

    # Bio check — description in meta tags
    if desc_text and len(desc_text.strip()) > 10:
        result["has_bio"] = True
        result["strengths"].append("Bio / About section is present")
    else:
        result["issues"].append("Bio/About section appears empty or missing")

    # Profile picture
    if image_url and image_url.startswith("http"):
        result["profile_picture"] = True
        result["strengths"].append("Profile picture is set")
    else:
        result["issues"].append("Profile picture could not be confirmed")

    # Website link — look for external links that are NOT the same platform
    platform_hints = PLATFORM_PATTERNS[platform]["domain_hints"]
    page_links = [a.get("href", "") for a in soup.find_all("a", href=True)]
    external_links = [
        lnk for lnk in page_links
        if lnk.startswith("http") and not any(h in lnk for h in platform_hints)
        and "javascript" not in lnk
    ]
    if external_links:
        result["has_website_link"] = True
        result["strengths"].append("Website/external link found in profile")
    else:
        result["issues"].append("No website link detected in the profile")

    # Contact check — look for emails / phone in body text
    body_text = soup.get_text(" ", strip=True)
    contact_patterns = PLATFORM_PATTERNS[platform]["contact_patterns"]
    for pattern in contact_patterns:
        if re.search(pattern, body_text, re.IGNORECASE):
            result["has_contact"] = True
            result["strengths"].append("Contact information found in profile")
            break
    if not result["has_contact"]:
        result["issues"].append("No direct contact information (email/phone) found")

    # Recent activity heuristic — look for dates / time elements on public pages
    time_elements = soup.find_all(["time", "span"], attrs={"datetime": True})
    if time_elements:
        result["has_recent_activity"] = True
        result["posting_frequency"] = "Active (recent posts detected)"
        result["strengths"].append("Recent activity detected on profile")
    else:
        # Some platforms hide dates behind JS; mark as uncertain
        result["posting_frequency"] = "Could not determine (JS-rendered or private)"
        result["issues"].append("Recent activity could not be confirmed — profile may need manual review")

    # ── Platform-specific follower extraction from meta description ───────────
    follower_patterns = [
        r'([\d,\.]+[KMB]?)\s*(followers|subscribers|fans)',
        r'([\d,\.]+[KMB]?)\s*(مشترك|متابع)',  # Arabic support
    ]
    for pat in follower_patterns:
        m = re.search(pat, desc_text + " " + title_text, re.IGNORECASE)
        if m:
            result["followers"] = m.group(1)
            result["strengths"].append(f"Follower count detected: {m.group(1)}")
            break

    # Post count
    post_patterns = [r'([\d,\.]+[KMB]?)\s*(posts|videos|uploads)']
    for pat in post_patterns:
        m = re.search(pat, desc_text + " " + title_text, re.IGNORECASE)
        if m:
            result["posts_count"] = m.group(1)
            break

    # ── Compute completeness score ────────────────────────────────────────────
    score = 0
    checks = [
        ("reachable", 20),
        ("profile_found", 10),
        ("has_bio", 20),
        ("has_contact", 15),
        ("has_website_link", 15),
        ("has_recent_activity", 10),
        ("profile_picture", 10),
    ]
    for key, pts in checks:
        if result.get(key):
            score += pts

    result["completeness_score"] = min(100, score)
    return result


class SocialMediaService:

    @staticmethod
    def run_analysis(
        db: Session,
        user_id: int,
        analysis_in: SocialMediaAnalysisRequest,
    ) -> SocialMediaAnalysis:

        platforms_input = {
            "facebook": analysis_in.facebook_url,
            "instagram": analysis_in.instagram_url,
            "linkedin": analysis_in.linkedin_url,
            "youtube": analysis_in.youtube_url,
        }

        platform_results: Dict[str, Dict] = {}
        platforms_found = 0
        platforms_analyzed = 0
        missing_elements: List[str] = []
        growth_suggestions: List[str] = []

        for platform, url in platforms_input.items():
            if url and url.strip():
                platforms_found += 1
                result = _analyze_platform(platform, url)
                platform_results[platform] = result
                platforms_analyzed += 1
            else:
                platform_results[platform] = None
                missing_elements.append(f"{platform.capitalize()} profile URL not provided")

        # ── Overall score computation ──────────────────────────────────────────
        # 40 pts: platform coverage (10 per platform that exists)
        # 60 pts: average completeness of provided platforms

        coverage_score = min(40, platforms_found * 10)
        completeness_scores = [
            r["completeness_score"] for r in platform_results.values() if r is not None
        ]
        avg_completeness = (sum(completeness_scores) / len(completeness_scores)) if completeness_scores else 0
        social_score = int(coverage_score + (avg_completeness * 0.6))
        social_score = min(100, max(0, social_score))

        # ── Profile completeness aggregate ─────────────────────────────────────
        profile_completeness = int(avg_completeness)

        # ── Missing elements report ────────────────────────────────────────────
        for platform, result in platform_results.items():
            if result is None:
                continue
            for issue in result.get("issues", []):
                missing_elements.append(f"{platform.capitalize()}: {issue}")

        # ── Growth suggestions ─────────────────────────────────────────────────
        if platforms_found == 0:
            growth_suggestions.append(
                "Set up profiles on at least Facebook, Instagram, and LinkedIn to establish a multi-channel social media presence."
            )
        elif platforms_found < 3:
            growth_suggestions.append(
                f"You have {platforms_found} platform(s) set up. Expand to 3–4 platforms to maximize reach across different audience demographics."
            )

        for platform, result in platform_results.items():
            if result is None:
                growth_suggestions.append(
                    f"Create a {platform.capitalize()} profile. It's a key platform for your audience."
                )
                continue
            if not result.get("has_bio"):
                growth_suggestions.append(
                    f"Add a compelling bio to your {platform.capitalize()} profile. A clear bio increases profile conversions by up to 30%."
                )
            if not result.get("has_website_link"):
                growth_suggestions.append(
                    f"Add your website URL to your {platform.capitalize()} profile to drive traffic and improve SEO authority."
                )
            if not result.get("has_contact"):
                growth_suggestions.append(
                    f"Include contact details (email or phone) in your {platform.capitalize()} profile to lower the barrier for customer inquiries."
                )
            if not result.get("has_recent_activity"):
                growth_suggestions.append(
                    f"Post more consistently on {platform.capitalize()}. Aim for at least 3–5 posts per week to stay relevant in the algorithm."
                )

        # Bonus universal suggestions
        growth_suggestions.append(
            "Use a consistent brand voice, color palette, and profile imagery across all platforms to build instant brand recognition."
        )
        growth_suggestions.append(
            "Schedule posts in advance using a social media management tool (e.g., Buffer or Hootsuite) to maintain posting consistency."
        )
        growth_suggestions.append(
            "Engage with comments and DMs within the first hour of posting — early engagement signals boost algorithmic distribution significantly."
        )

        # ── Summary ────────────────────────────────────────────────────────────
        analysis_summary = {
            "platforms_found": platforms_found,
            "platforms_analyzed": platforms_analyzed,
            "social_score": social_score,
            "profile_completeness": profile_completeness,
            "total_issues": len(missing_elements),
            "total_suggestions": len(growth_suggestions),
            "per_platform_scores": {
                p: (r["completeness_score"] if r else 0)
                for p, r in platform_results.items()
            },
        }

        # ── Persist to DB ──────────────────────────────────────────────────────
        db_analysis = SocialMediaAnalysis(
            user_id=user_id,
            business_profile_id=analysis_in.business_profile_id,
            facebook_url=analysis_in.facebook_url,
            instagram_url=analysis_in.instagram_url,
            linkedin_url=analysis_in.linkedin_url,
            youtube_url=analysis_in.youtube_url,
            facebook_analysis=platform_results.get("facebook"),
            instagram_analysis=platform_results.get("instagram"),
            linkedin_analysis=platform_results.get("linkedin"),
            youtube_analysis=platform_results.get("youtube"),
            platforms_found=platforms_found,
            platforms_analyzed=platforms_analyzed,
            social_score=social_score,
            profile_completeness=profile_completeness,
            missing_elements=missing_elements,
            growth_suggestions=growth_suggestions,
            analysis_summary=analysis_summary,
        )

        db.add(db_analysis)
        db.commit()
        db.refresh(db_analysis)
        return db_analysis

    @staticmethod
    def get_user_analyses(db: Session, user_id: int) -> List[SocialMediaAnalysis]:
        return (
            db.query(SocialMediaAnalysis)
            .filter(SocialMediaAnalysis.user_id == user_id)
            .order_by(SocialMediaAnalysis.created_at.desc())
            .all()
        )

    @staticmethod
    def get_analysis(db: Session, analysis_id: int, user_id: int) -> Optional[SocialMediaAnalysis]:
        return (
            db.query(SocialMediaAnalysis)
            .filter(
                SocialMediaAnalysis.id == analysis_id,
                SocialMediaAnalysis.user_id == user_id,
            )
            .first()
        )
