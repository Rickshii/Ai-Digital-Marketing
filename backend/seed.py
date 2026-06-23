import sys
import os
# Add the current directory and app directory to python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "app"))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User
from app.models.business import BusinessProfile
from app.models.audit import WebsiteAudit
from datetime import datetime

def seed_database():
    print("Initializing database...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 1. Create Users
        print("Seeding Users...")
        # Check standard user
        user = db.query(User).filter(User.email == "user@example.com").first()
        if not user:
            user = User(
                email="user@example.com",
                full_name="Alex Digital Marketer",
                hashed_password=get_password_hash("password123"),
                role="user"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print("  Created user: user@example.com (password: password123)")
        else:
            print("  User user@example.com already exists.")

        # Create admin user if missing
        admin = db.query(User).filter(User.email == "admin@example.com").first()
        if not admin:
            admin = User(
                email="admin@example.com",
                full_name="Sarah Administrator",
                hashed_password=get_password_hash("admin123"),
                role="admin"
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print("  Created admin: admin@example.com (password: admin123)")
        else:
            print("  Admin admin@example.com already exists.")

        # 2. Create Business Profiles
        print("Seeding Business Profiles...")
        profile = db.query(BusinessProfile).filter(BusinessProfile.user_id == user.id).first()
        if not profile:
            profile = BusinessProfile(
                user_id=user.id,
                business_name="Quantum E-Commerce",
                industry_type="Retail & E-commerce",
                website_url="https://quantum-shop-example.com",
                business_location="Austin, Texas, USA",
                target_audience="Tech-savvy young adults aged 18-35 interested in eco-friendly gadgets",
                description="Quantum E-Commerce is a leading online retailer specializing in sustainable, high-tech, and energy-efficient consumer electronics. We aim to bridge the gap between cutting-edge technology and environmental responsibility. Our catalog includes solar-powered phone chargers, bamboo casing keyboards, and energy-monitoring smart plugs designed to fit modern smart homes.",
                contact_number="+1-512-555-0199",
                email="hello@quantum-shop-example.com",
                social_media_links={
                    "linkedin": "https://linkedin.com/company/quantum-ecommerce",
                    "twitter": "https://twitter.com/quantum_shop",
                    "instagram": "https://instagram.com/quantum_eco_tech"
                },
                completeness_score=100,
                missing_info_report=[],
                improvement_suggestions=[
                    "Great job! Your business profile is complete. Focus next on running a technical SEO audit on your website to ensure search engines can find and index your content."
                ]
            )
            db.add(profile)
            
            # Create a second, incomplete profile for testing
            incomplete_profile = BusinessProfile(
                user_id=user.id,
                business_name="Local Bakery Cafe",
                industry_type="Food & Beverage",
                website_url="",
                business_location="Seattle, WA",
                target_audience="Local residents and coffee lovers",
                description="A cozy bakery serving fresh pastries.",
                contact_number="",
                email="info@localbakery.com",
                social_media_links={},
                completeness_score=40,
                missing_info_report=["Website URL", "Detailed Business Description (> 100 words)", "Contact Information (Phone)", "Social Media Links"],
                improvement_suggestions=[
                    "Set up a professional business website. Your website acts as a 24/7 digital storefront that builds credibility and captures inbound leads.",
                    "Expand your business description. It currently has only 7 words. Expand it to 100+ words to improve search engine indexing and clarify your offerings to prospects.",
                    "Link your social media profiles (LinkedIn, Facebook, Instagram, or Twitter). Active profiles build social proof, boost brand awareness, and enhance consumer trust."
                ]
            )
            db.add(incomplete_profile)
            
            db.commit()
            print("  Seeded sample business profiles.")
        else:
            print("  Business profiles already exist.")

        # 3. Create Website Audits
        print("Seeding Website Audits...")
        audit = db.query(WebsiteAudit).filter(WebsiteAudit.user_id == user.id).first()
        if not audit:
            audit = WebsiteAudit(
                user_id=user.id,
                website_url="https://quantum-shop-example.com",
                title="Quantum E-Commerce | Eco-Friendly Smart Electronics",
                meta_description="Shop sustainable high-tech consumer electronics. Fast shipping on solar phone chargers, smart home devices, and energy-monitoring smart plugs.",
                h1_tags=["Eco-Friendly Tech for the Modern Home", "Shop Best Sellers"],
                h2_tags=["Our Sustainable Mission", "Solar Chargers", "Smart Plugs", "What Our Customers Say", "Subscribe to our Newsletter"],
                image_alt_tags={"total": 12, "missing_alt": 3},
                is_https=True,
                internal_links=[
                    "https://quantum-shop-example.com/shop",
                    "https://quantum-shop-example.com/about",
                    "https://quantum-shop-example.com/blog",
                    "https://quantum-shop-example.com/contact",
                    "https://quantum-shop-example.com/privacy-policy"
                ],
                images_count=12,
                scripts_count=8,
                stylesheets_count=4,
                health_score=85,
                seo_score=80,
                audit_report={
                    "status_code": 200,
                    "error_detail": None,
                    "has_title": True,
                    "title_length": 53,
                    "has_meta_desc": True,
                    "meta_desc_length": 140,
                    "h1_count": 2,
                    "h2_count": 5,
                    "images_total": 12,
                    "images_missing_alt": 3,
                    "scripts_count": 8,
                    "stylesheets_count": 4,
                    "internal_links_count": 5,
                },
                improvement_suggestions=[
                    "Reduce H1 tags. Found 2 H1 tags. Use only one H1 tag per page to maintain clear hierarchy; use H2/H3 for subheadings.",
                    "Fix missing ALT attributes on images. Out of 12 images, 3 are missing ALT text. Screen readers and search crawlers rely on ALT tags to understand visual content."
                ]
            )
            db.add(audit)
            db.commit()
            print("  Seeded sample website audit.")
        else:
            print("  Website audits already exist.")
            
        print("Database seeded successfully!")
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
