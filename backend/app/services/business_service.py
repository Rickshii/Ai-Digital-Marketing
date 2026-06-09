from sqlalchemy.orm import Session
from app.models.business import BusinessProfile
from app.schemas.business import BusinessProfileCreate, BusinessProfileUpdate
from typing import List, Dict, Any, Tuple

def analyze_business_profile(profile_data: Dict[str, Any]) -> Tuple[int, List[str], List[str]]:
    score = 0
    missing_report = []
    suggestions = []

    # 1. Website Available (20 Marks)
    website = profile_data.get("website_url")
    if website and str(website).strip():
        score += 20
    else:
        missing_report.append("Website URL")
        suggestions.append("Set up a professional business website. Your website acts as a 24/7 digital storefront that builds credibility and captures inbound leads.")

    # 2. Description Length > 100 Words (20 Marks)
    desc = profile_data.get("description") or ""
    word_count = len(desc.split())
    if word_count > 100:
        score += 20
    else:
        missing_report.append("Detailed Business Description (> 100 words)")
        if word_count == 0:
            suggestions.append("Add a detailed business description. Explain your unique value proposition, services, and core mission to help visitors understand your company.")
        else:
            suggestions.append(f"Expand your business description. It currently has only {word_count} words. Expand it to 100+ words to improve search engine indexing and clarify your offerings to prospects.")

    # 3. Contact Information Available (20 Marks)
    contact = profile_data.get("contact_number")
    email = profile_data.get("email")
    if (contact and str(contact).strip()) or (email and str(email).strip()):
        score += 20
    else:
        missing_report.append("Contact Information (Email or Phone)")
        suggestions.append("Provide direct contact channels (email or phone). Visitors and prospects need a low-friction way to reach your sales or support teams.")

    # 4. Social Media Links Available (20 Marks)
    socials = profile_data.get("social_media_links") or {}
    has_socials = False
    if isinstance(socials, dict):
        has_socials = any(val and str(val).strip() for val in socials.values())
    
    if has_socials:
        score += 20
    else:
        missing_report.append("Social Media Links")
        suggestions.append("Link your social media profiles (LinkedIn, Facebook, Instagram, or Twitter). Active profiles build social proof, boost brand awareness, and enhance consumer trust.")

    # 5. Business Location Available (20 Marks)
    location = profile_data.get("business_location")
    if location and str(location).strip():
        score += 20
    else:
        missing_report.append("Business Location")
        suggestions.append("Add your business location. Even if you operate entirely online, displaying a target region or office headquarters builds geographical trust and local SEO value.")

    # Additional marketing suggestions if score is perfect
    if score == 100:
        suggestions.append("Great job! Your business profile is complete. Focus next on running a technical SEO audit on your website to ensure search engines can find and index your content.")

    return score, missing_report, suggestions

class BusinessService:
    @staticmethod
    def create_profile(db: Session, user_id: int, profile_in: BusinessProfileCreate) -> BusinessProfile:
        profile_data = profile_in.model_dump()
        score, missing, suggestions = analyze_business_profile(profile_data)
        
        db_profile = BusinessProfile(
            user_id=user_id,
            business_name=profile_data["business_name"],
            industry_type=profile_data["industry_type"],
            website_url=profile_data["website_url"],
            business_location=profile_data["business_location"],
            target_audience=profile_data["target_audience"],
            description=profile_data["description"],
            contact_number=profile_data["contact_number"],
            email=profile_data["email"],
            social_media_links=profile_data["social_media_links"],
            completeness_score=score,
            missing_info_report=missing,
            improvement_suggestions=suggestions
        )
        db.add(db_profile)
        db.commit()
        db.refresh(db_profile)
        return db_profile

    @staticmethod
    def update_profile(db: Session, profile_id: int, user_id: int, profile_in: BusinessProfileUpdate) -> BusinessProfile:
        db_profile = db.query(BusinessProfile).filter(BusinessProfile.id == profile_id, BusinessProfile.user_id == user_id).first()
        if not db_profile:
            return None
        
        # Merge changes
        update_data = profile_in.model_dump(exclude_unset=True)
        current_data = {
            "business_name": db_profile.business_name,
            "industry_type": db_profile.industry_type,
            "website_url": db_profile.website_url,
            "business_location": db_profile.business_location,
            "target_audience": db_profile.target_audience,
            "description": db_profile.description,
            "contact_number": db_profile.contact_number,
            "email": db_profile.email,
            "social_media_links": db_profile.social_media_links,
        }
        current_data.update(update_data)
        
        # Re-analyze
        score, missing, suggestions = analyze_business_profile(current_data)
        
        for field, value in update_data.items():
            setattr(db_profile, field, value)
            
        db_profile.completeness_score = score
        db_profile.missing_info_report = missing
        db_profile.improvement_suggestions = suggestions
        
        db.commit()
        db.refresh(db_profile)
        return db_profile

    @staticmethod
    def get_user_profiles(db: Session, user_id: int) -> List[BusinessProfile]:
        return db.query(BusinessProfile).filter(BusinessProfile.user_id == user_id).all()

    @staticmethod
    def get_profile(db: Session, profile_id: int, user_id: int) -> BusinessProfile:
        return db.query(BusinessProfile).filter(BusinessProfile.id == profile_id, BusinessProfile.user_id == user_id).first()

    @staticmethod
    def delete_profile(db: Session, profile_id: int, user_id: int) -> bool:
        db_profile = db.query(BusinessProfile).filter(BusinessProfile.id == profile_id, BusinessProfile.user_id == user_id).first()
        if not db_profile:
            return False
        db.delete(db_profile)
        db.commit()
        return True
