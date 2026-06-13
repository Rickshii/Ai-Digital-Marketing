from sqlalchemy.orm import Session
from app.models.marketing_strategy import MarketingStrategy
from app.models.business import BusinessProfile
from app.models.audit import WebsiteAudit
from app.models.social_media import SocialMediaAnalysis
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger("uvicorn.error")

class MarketingStrategyService:

    @staticmethod
    def generate_strategy(db: Session, user_id: int, business_profile_id: Optional[int] = None) -> MarketingStrategy:
        # 1. Fetch input data
        profile = None
        if business_profile_id:
            profile = db.query(BusinessProfile).filter(BusinessProfile.id == business_profile_id, BusinessProfile.user_id == user_id).first()
        else:
            profile = db.query(BusinessProfile).filter(BusinessProfile.user_id == user_id).order_by(BusinessProfile.updated_at.desc()).first()

        audit = db.query(WebsiteAudit).filter(WebsiteAudit.user_id == user_id).order_by(WebsiteAudit.created_at.desc()).first()
        social = db.query(SocialMediaAnalysis).filter(SocialMediaAnalysis.user_id == user_id).order_by(SocialMediaAnalysis.created_at.desc()).first()

        # 2. Extract scores or use default base scores
        biz_score = profile.completeness_score if profile else 50
        web_health = audit.health_score if audit else 50
        seo_score = audit.seo_score if audit else 50
        social_score = social.social_score if social else 50

        # Calculate overall strategy score
        strategy_score = int((biz_score + web_health + seo_score + social_score) / 4)
        strategy_score = min(100, max(10, strategy_score))

        # 3. Context variables
        biz_name = profile.business_name if profile else "Your Business"
        industry = profile.industry_type if profile else "General Business"
        target_audience = profile.target_audience if (profile and profile.target_audience) else "target audience"
        biz_desc = profile.description if (profile and profile.description) else "your premium products and services"

        # 4. Generate branding strategy
        brand_voice = "Helpful, transparent, innovative, and customer-focused."
        positioning_desc = "high quality, trust, and modern reliability"
        
        if profile:
            ind_lower = industry.lower()
            if "retail" in ind_lower or "commerce" in ind_lower:
                brand_voice = "Friendly, enthusiastic, vibrant, and visually inspiring."
                positioning_desc = "seamless online shopping, eco-friendly options, and fast support"
            elif "food" in ind_lower or "beverage" in ind_lower or "restaurant" in ind_lower:
                brand_voice = "Warm, inviting, sensory-rich, and community-focused."
                positioning_desc = "fresh local ingredients, cozy dining experiences, and culinary expertise"
            elif "professional" in ind_lower or "service" in ind_lower or "consult" in ind_lower or "b2b" in ind_lower:
                brand_voice = "Authoritative, professional, trustworthy, and detail-oriented."
                positioning_desc = "data-driven ROI, industry expertise, and high-impact strategy consultations"

        branding_strategy = {
            "brand_voice": brand_voice,
            "positioning_statement": f"For {target_audience} who need reliable {industry} services, {biz_name} offers a premium experience focused on {biz_desc[:120]}... Unlike competitors, we build long-term value through {positioning_desc}.",
            "visual_identity_tips": [
                "Establish a consistent 3-color brand palette representing your industry value (e.g. green for eco/food, purple/blue for tech/consulting).",
                "Ensure typography is readable and modern across website templates and social media graphics.",
                "Maintain uniform profile photos, logo markers, and header banners on every digital touchpoint."
            ]
        }

        # 5. Generate lead generation strategy
        lead_magnet = "Ultimate Resource Checklist & Getting Started Guide"
        landing_page_tip = "Include a high-contrast form above the fold with a single, clear call-to-action button."
        
        if profile:
            ind_lower = industry.lower()
            if "retail" in ind_lower or "commerce" in ind_lower:
                lead_magnet = "Exclusive 15% Welcome Discount Code + Shop Gift Finder Quiz"
                landing_page_tip = "Use shoppable landing pages with customer reviews, high-res photos, and immediate checkout triggers."
            elif "food" in ind_lower or "beverage" in ind_lower or "restaurant" in ind_lower:
                lead_magnet = "Free Recipe eBook & BOGO (Buy-One-Get-One) Dining Coupon"
                landing_page_tip = "Display a highly visible 'Order Online' or 'Reserve Table' button with interactive menus."
            elif "professional" in ind_lower or "service" in ind_lower or "consult" in ind_lower or "b2b" in ind_lower:
                lead_magnet = "Industry Growth Whitepaper & Free 15-Minute Strategy Audit Call"
                landing_page_tip = "Highlight success stories, detailed client case studies, and clear contact forms."

        lead_gen_strategy = {
            "recommended_lead_magnet": lead_magnet,
            "conversion_funnel": [
                "1. Drive targeted traffic from search engines (SEO) and social media posting.",
                "2. Offer your specific lead magnet via a clean, exit-intent popup or banner.",
                "3. Deliver the asset instantly and trigger a 4-part automated welcome email sequence."
            ],
            "landing_page_tips": [
                landing_page_tip,
                "Leverage strong social proof by placing client logos or 5-star testimonials near the signup forms.",
                "Optimize for mobile devices. Ensure form fields are large and load times are under 2 seconds."
            ]
        }

        # 6. Generate content marketing strategy
        content_pillars = ["Educational / Industry News (40%)", "Product / Service Spotlights (30%)", "Customer Reviews & Behind-the-Scenes (30%)"]
        if "retail" in industry.lower() or "commerce" in industry.lower():
            content_pillars = ["Product Guides & Styling Tips (45%)", "Customer Testimonials & UGC (35%)", "Exclusive Sales / Promotions (20%)"]

        content_strategy = {
            "content_pillars": content_pillars,
            "suggested_formats": ["Blog Articles (800+ words)", "Short-form Social Videos (Instagram Reels/TikToks)", "Customer Success Case Studies", "Interactive Newsletters"],
            "calendar_snapshot": [
                {"day": "Monday", "format": "Educational Blog Post", "topic": f"How to choose the best {industry} products for your needs"},
                {"day": "Wednesday", "format": "Social Media Reels", "topic": f"Quick tips & hacks for {target_audience}"},
                {"day": "Friday", "format": "Customer Review / Spotlight", "topic": f"Shouting out a happy client story"}
            ]
        }

        # 7. Generate social media strategy (Channel Mix / Budgets)
        seo_weight = 35
        social_weight = 25
        email_weight = 20
        google_ads_weight = 15
        influencer_weight = 5

        if profile:
            ind_lower = industry.lower()
            if "retail" in ind_lower or "commerce" in ind_lower:
                seo_weight, social_weight, email_weight, influencer_weight, google_ads_weight = 25, 35, 20, 15, 5
            elif "food" in ind_lower or "beverage" in ind_lower or "restaurant" in ind_lower:
                seo_weight, social_weight, email_weight, influencer_weight, google_ads_weight = 15, 40, 10, 25, 10
            elif "professional" in ind_lower or "service" in ind_lower or "consult" in ind_lower or "b2b" in ind_lower:
                seo_weight, social_weight, email_weight, influencer_weight, google_ads_weight = 40, 10, 25, 5, 20

        # Let's adjust based on website SEO/Social scores if available
        if seo_score < 50:
            # Shift 5% more budget into SEO/Content to cover the technical gaps
            seo_weight += 5
            google_ads_weight = max(5, google_ads_weight - 5)
        if social_score < 50:
            # Shift 5% more budget into Social
            social_weight += 5
            email_weight = max(5, email_weight - 5)

        # Re-verify sum is 100
        total_sum = seo_weight + social_weight + email_weight + google_ads_weight + influencer_weight
        if total_sum != 100:
            # Adjust SEO weight to balance out
            seo_weight += (100 - total_sum)

        social_media_strategy = {
            "channel_mix": [
                {"name": "SEO & Content", "budget": seo_weight, "channel_focus": "Google Organic search & value blogs"},
                {"name": "Paid Social Ads", "budget": social_weight, "channel_focus": "Instagram, Facebook & TikTok demographics"},
                {"name": "Email Marketing", "budget": email_weight, "channel_focus": "Newsletter lists, offers, and flows"},
                {"name": "Google Ads", "budget": google_ads_weight, "channel_focus": "Search intent keywords"},
                {"name": "Influencer Outreach", "budget": influencer_weight, "channel_focus": "Micro-influencers in your niche"}
            ],
            "posting_schedule": "Post at least 3-4 times per week on social media, focusing on peak engagement hours (12 PM - 2 PM, 6 PM - 8 PM local time)."
        }

        # 8. Generate 30-Day Marketing Plan (Week by Week)
        w1_tasks = ["Establish core brand identity and messaging doc", "Audit competitor search rankings for top 5 key search terms"]
        w2_tasks = ["Publish first cornerstone long-form article (1,200+ words)", "Add newsletter sign-up form on website homepage"]
        w3_tasks = ["Configure standard automated welcome sequence (3-4 emails)", "Schedule 3 educational social media posts"]
        w4_tasks = ["Launch lead magnet download campaign", "Review website analytics for initial organic traffic trends"]

        # Customize based on audit results
        if audit:
            if not audit.is_https:
                w1_tasks.insert(0, "🔒 Crucial: Install an SSL certificate and redirect all HTTP traffic to HTTPS")
            if not audit.title:
                w1_tasks.append("📝 Write custom meta title tags for key web pages")
            elif audit.title and (len(audit.title) < 30 or len(audit.title) > 60):
                w1_tasks.append(f"✏️ Optimize home page title tag (currently {len(audit.title)} chars) to be between 30-60 characters")
            
            if not audit.has_sitemap:
                w2_tasks.insert(0, "🗺️ Create sitemap.xml and submit it to Google Search Console")
            if not audit.has_robots_txt:
                w2_tasks.append("🤖 Create a standard robots.txt file at your website root")
            
            image_info = audit.image_alt_tags or {}
            missing_alt = image_info.get("missing_alt", 0)
            if missing_alt > 0:
                w2_tasks.append(f"🖼️ Add descriptive ALT tags to the {missing_alt} images missing them")
            
            if audit.word_count < 300:
                w2_tasks.append(f"📖 Add more text content to homepage (current word count is low: {audit.word_count})")

        if social:
            missing_platforms = social.missing_elements or []
            if any("not provided" in mp.lower() for mp in missing_platforms):
                w3_tasks.insert(0, "🌐 Set up all key social media channels (LinkedIn, Facebook, Instagram)")
            
            growth_suggs = social.growth_suggestions or []
            if any("compelling bio" in gs.lower() for gs in growth_suggs):
                w3_tasks.append("✍️ Fill out the bio/about sections on all active social platforms")
            if any("website URL" in gs.lower() for gs in growth_suggs):
                w3_tasks.append("🔗 Add website link to all social platform bios")

        plan_30_day = [
            {"week": "Week 1", "title": "Foundation & Brand Alignment", "tasks": w1_tasks[:4], "status": "active"},
            {"week": "Week 2", "title": "SEO & Content Initialization", "tasks": w2_tasks[:4], "status": "pending"},
            {"week": "Week 3", "title": "Social & Engagement Launch", "tasks": w3_tasks[:4], "status": "pending"},
            {"week": "Week 4", "title": "Lead Gen & System Review", "tasks": w4_tasks[:4], "status": "pending"}
        ]

        # Calculate active tasks count (e.g. 1 out of 16 tasks starts as done or similar)
        total_tasks_count = sum(len(w["tasks"]) for w in plan_30_day)
        # Mark first week's first task as done for UX progress feeling
        active_tasks_str = f"0/{total_tasks_count}"

        # 9. Generate 90-Day Growth Plan (Month 2, Month 3, Ongoing)
        plan_90_day = [
            {
                "month": "Month 2", 
                "title": "Growth & Scale", 
                "desc": f"Scale organic search traffic by launching a weekly blog schedule. Deploy your {lead_magnet} across premium visual ads. Target at least {int(strategy_score * 1.5)}% organic traffic growth."
            },
            {
                "month": "Month 3", 
                "title": "Revenue & CRO", 
                "desc": "A/B test homepage call-to-actions. Launch retargeting ads to recapture cart abandoners or page bounces. Refine onboarding emails to increase lifetime customer value."
            },
            {
                "month": "Ongoing", 
                "title": "Authority Building", 
                "desc": "Partner with micro-influencers and publish industry case studies. Build brand authority through high-quality guest posts, interviews, and community sponsorships."
            }
        ]

        # Estimates
        reach_val = f"{int(strategy_score * 0.5)}K+"
        roi_val = f"{int(strategy_score * 4)}%"

        # 10. Save strategy
        db_strategy = MarketingStrategy(
            user_id=user_id,
            business_profile_id=profile.id if profile else None,
            strategy_score=strategy_score,
            active_tasks=active_tasks_str,
            reach_estimate=reach_val,
            projected_roi=roi_val,
            scores_used={
                "business_score": biz_score,
                "website_health_score": web_health,
                "seo_score": seo_score,
                "social_media_score": social_score
            },
            plan_30_day=plan_30_day,
            plan_90_day=plan_90_day,
            branding_strategy=branding_strategy,
            lead_gen_strategy=lead_gen_strategy,
            content_strategy=content_strategy,
            social_media_strategy=social_media_strategy
        )

        db.add(db_strategy)
        db.commit()
        db.refresh(db_strategy)
        return db_strategy

    @staticmethod
    def get_latest_strategy(db: Session, user_id: int) -> Optional[MarketingStrategy]:
        return db.query(MarketingStrategy).filter(MarketingStrategy.user_id == user_id).order_by(MarketingStrategy.created_at.desc()).first()

    @staticmethod
    def get_strategy_history(db: Session, user_id: int) -> List[MarketingStrategy]:
        return db.query(MarketingStrategy).filter(MarketingStrategy.user_id == user_id).order_by(MarketingStrategy.created_at.desc()).all()
