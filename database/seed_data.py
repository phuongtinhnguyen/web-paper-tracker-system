import logging

import bcrypt

from database import SessionLocal
from models import User


logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(message)s")
logger = logging.getLogger(__name__)


def seed_users():
    db = SessionLocal()

    try:
        raw_password = "password123"

        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(
            raw_password.encode("utf-8"),
            salt,
        ).decode("utf-8")

        sample_users = [
            User(
                email="admin@webpaper.com",
                hashed_password=hashed_password,
                full_name="Admin Test",
            ),
            User(
                email="duy.db@webpaper.com",
                hashed_password=hashed_password,
                full_name="Duy DB",
            ),
            User(
                email="phuc.ai@webpaper.com",
                hashed_password=hashed_password,
                full_name="Phuc AI",
            ),
            User(
                email="tinh.be@webpaper.com",
                hashed_password=hashed_password,
                full_name="Tinh BE",
            ),
            User(
                email="diem.fe@webpaper.com",
                hashed_password=hashed_password,
                full_name="Diem FE",
            ),
        ]

        users_added = 0
        for user in sample_users:
            existing_user = db.query(User).filter(User.email == user.email).first()
            if not existing_user:
                db.add(user)
                users_added += 1

        if users_added > 0:
            db.commit()
            logger.info("Da tao thanh cong %s user mau.", users_added)
            logger.info("Mat khau chung cho tat ca user mau: %s", raw_password)
        else:
            logger.info("Cac user mau da ton tai trong Database, khong can tao lai.")

    except Exception as error:
        logger.error("Loi khi tao du lieu mau: %s", error)
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    logger.info("--- BAT DAU CHAY SEED DATA ---")
    seed_users()
