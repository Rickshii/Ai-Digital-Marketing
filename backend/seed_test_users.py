#!/usr/bin/env python3
"""
Seed test users into the database for local development and testing.
Run this after initializing the database with init_db.py
"""

import sys
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)

# Import after path is set
from app.core.database import SessionLocal, engine, Base
from app.models.user import User
from app.core.security import get_password_hash
from app.services.access_service import AccessService

def seed_test_users():
    """Create test users for development."""
    logger.info("Seeding test users...")
    db = SessionLocal()
    
    try:
        # Check if users already exist
        existing_count = db.query(User).count()
        if existing_count > 1:  # More than just the admin
            logger.info(f"  (Test users already exist: {existing_count} users)")
            return True
        
        # Test users to create
        test_users = [
            {
                "email": "demo@marketerai.com",
                "password": "demo1234",
                "full_name": "Demo User",
                "role": "admin"
            },
            {
                "email": "rickshii@gmail.com",
                "password": "rickshii123",
                "full_name": "Rickshii Developer",
                "role": "user"
            },
            {
                "email": "user@example.com",
                "password": "user1234",
                "full_name": "Test User",
                "role": "user"
            },
            {
                "email": "business@example.com",
                "password": "business123",
                "full_name": "Business Owner",
                "role": "user"
            },
        ]
        
        created_count = 0
        for user_data in test_users:
            # Check if user already exists
            existing = db.query(User).filter(User.email == user_data["email"]).first()
            if existing:
                logger.info(f"  ✓ User already exists: {user_data['email']}")
                continue
            
            # Create new user
            user = User(
                email=user_data["email"],
                full_name=user_data["full_name"],
                hashed_password=get_password_hash(user_data["password"]),
                role=user_data["role"]
            )
            db.add(user)
            db.flush()  # Flush to get the user ID
            
            # Start trial for new users (3 days)
            try:
                AccessService.start_trial(db, user.id)
            except Exception as e:
                logger.warning(f"  ⚠ Could not start trial for {user_data['email']}: {e}")
            
            logger.info(f"  ✓ Created: {user_data['email']} (password: {user_data['password']})")
            created_count += 1
        
        db.commit()
        logger.info(f"✓ Seeded {created_count} test users")
        
        # Display all users
        all_users = db.query(User).all()
        logger.info("\nAll users in database:")
        logger.info("─" * 70)
        for user in all_users:
            logger.info(f"  {user.email:<30} | {user.full_name:<20} | {user.role}")
        logger.info("─" * 70)
        
        return True
        
    except Exception as e:
        logger.error(f"✗ Failed to seed test users: {e}")
        db.rollback()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    try:
        success = seed_test_users()
        sys.exit(0 if success else 1)
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)
