from sqlalchemy.orm import Session
from app.models.report import Report
from app.models.business import BusinessProfile
from app.models.audit import WebsiteAudit
from app.models.social_media import SocialMediaAnalysis
from app.models.marketing_strategy import MarketingStrategy
from app.services.marketing_strategy_service import MarketingStrategyService
from app.schemas.report import ReportCreate
from typing import List, Optional, Dict, Any
from datetime import datetime

class ReportService:

    @staticmethod
    def generate_report(db: Session, user_id: int, report_in: ReportCreate) -> Report:
        # Fetch latest snapshots
        profile = db.query(BusinessProfile).filter(BusinessProfile.user_id == user_id).order_by(BusinessProfile.updated_at.desc()).first()
        audit = db.query(WebsiteAudit).filter(WebsiteAudit.user_id == user_id).order_by(WebsiteAudit.created_at.desc()).first()
        social = db.query(SocialMediaAnalysis).filter(SocialMediaAnalysis.user_id == user_id).order_by(SocialMediaAnalysis.created_at.desc()).first()
        strategy = db.query(MarketingStrategy).filter(MarketingStrategy.user_id == user_id).order_by(MarketingStrategy.created_at.desc()).first()

        # If no strategy, let's generate it
        if not strategy:
            strategy = MarketingStrategyService.generate_strategy(db=db, user_id=user_id)

        # Consolidate scores
        biz_score = profile.completeness_score if profile else 0
        health_score = audit.health_score if audit else 0
        seo_score = audit.seo_score if audit else 0
        social_score = social.social_score if social else 0
        strategy_score = strategy.strategy_score if strategy else 0

        scores = {
            "business": biz_score,
            "health": health_score,
            "seo": seo_score,
            "social": social_score,
            "marketing": strategy_score
        }

        # Build snapshot representations
        business_overview = {
            "business_name": profile.business_name if profile else "No business profile created",
            "industry_type": profile.industry_type if profile else "N/A",
            "website_url": profile.website_url if profile else "N/A",
            "business_location": profile.business_location if profile else "N/A",
            "target_audience": profile.target_audience if profile else "N/A",
            "description": profile.description if profile else "N/A",
            "completeness_score": biz_score,
            "missing_info_report": profile.missing_info_report if profile else [],
            "improvement_suggestions": profile.improvement_suggestions if profile else []
        } if profile else None

        website_snapshot = {
            "website_url": audit.website_url if audit else "N/A",
            "title": audit.title if audit else None,
            "meta_description": audit.meta_description if audit else None,
            "is_https": audit.is_https if audit else False,
            "health_score": health_score,
            "seo_score": seo_score,
            "images_count": audit.images_count if audit else 0,
            "scripts_count": audit.scripts_count if audit else 0,
            "stylesheets_count": audit.stylesheets_count if audit else 0,
            "word_count": audit.word_count if audit else 0,
            "readability_score": audit.readability_score if audit else 0,
            "readability_grade": audit.readability_grade if audit else "N/A",
            "improvement_suggestions": audit.improvement_suggestions if audit else []
        } if audit else None

        seo_snapshot = {
            "seo_score": seo_score,
            "has_robots_txt": audit.has_robots_txt if audit else False,
            "has_sitemap": audit.has_sitemap if audit else False,
            "has_canonical": audit.has_canonical if audit else False,
            "canonical_url": audit.canonical_url if audit else None,
            "seo_errors": audit.seo_errors if audit else [],
            "keyword_density": audit.keyword_density if audit else {}
        } if audit else None

        social_snapshot = {
            "social_score": social_score,
            "profile_completeness": social.profile_completeness if social else 0,
            "facebook_url": social.facebook_url if social else None,
            "instagram_url": social.instagram_url if social else None,
            "linkedin_url": social.linkedin_url if social else None,
            "youtube_url": social.youtube_url if social else None,
            "missing_elements": social.missing_elements if social else [],
            "growth_suggestions": social.growth_suggestions if social else []
        } if social else None

        strategy_snapshot = {
            "strategy_score": strategy_score,
            "active_tasks": strategy.active_tasks if strategy else "0/0",
            "reach_estimate": strategy.reach_estimate if strategy else "N/A",
            "projected_roi": strategy.projected_roi if strategy else "N/A",
            "plan_30_day": strategy.plan_30_day if strategy else [],
            "plan_90_day": strategy.plan_90_day if strategy else [],
            "branding_strategy": strategy.branding_strategy if strategy else {},
            "lead_gen_strategy": strategy.lead_gen_strategy if strategy else {},
            "content_strategy": strategy.content_strategy if strategy else {},
            "social_media_strategy": strategy.social_media_strategy if strategy else {}
        } if strategy else None

        # Build title
        biz_title = profile.business_name if profile else "Digital Marketing"
        report_title = report_in.title or f"{biz_title} Consolidated Audit Report"

        report_id = Report.generate_report_id()

        db_report = Report(
            user_id=user_id,
            report_id=report_id,
            title=report_title,
            type=report_in.type,
            scores=scores,
            business_overview=business_overview,
            website_audit=website_snapshot,
            seo_audit=seo_snapshot,
            social_media_analysis=social_snapshot,
            marketing_strategy=strategy_snapshot
        )

        db.add(db_report)
        db.commit()
        db.refresh(db_report)
        return db_report

    @staticmethod
    def get_user_reports(db: Session, user_id: int) -> List[Report]:
        return db.query(Report).filter(Report.user_id == user_id).order_by(Report.created_at.desc()).all()

    @staticmethod
    def get_report(db: Session, report_id: int, user_id: int) -> Optional[Report]:
        return db.query(Report).filter(Report.id == report_id, Report.user_id == user_id).first()

    @staticmethod
    def delete_report(db: Session, report_id: int, user_id: int) -> bool:
        db_report = db.query(Report).filter(Report.id == report_id, Report.user_id == user_id).first()
        if not db_report:
            return False
        db.delete(db_report)
        db.commit()
        return True
