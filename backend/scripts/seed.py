"""Seed default roles and an initial admin user.

Run:  python -m scripts.seed
(activate venv first)

Default admin credentials are printed once. Change the password after first login.
"""
import sys

from sqlmodel import Session, select

from app.core.database import engine, init_db
from app.core.security import hash_password
from app.models.auth import Role, RoleName, User, UserStatus, UserRole

ADMIN_USERNAME = "admin"
ADMIN_EMAIL = "admin@managementhub.local"
ADMIN_PASSWORD = "Admin123!"


def seed() -> None:
    init_db()
    with Session(engine) as session:
        roles = {}
        for name in RoleName:
            role = session.exec(select(Role).where(Role.name == name)).first()
            if not role:
                role = Role(name=name, description=name.value.capitalize())
                session.add(role)
                session.commit()
                session.refresh(role)
            roles[name] = role

        admin = session.exec(select(User).where(User.username == ADMIN_USERNAME)).first()
        if not admin:
            admin = User(
                username=ADMIN_USERNAME,
                display_name="Administrator",
                email=ADMIN_EMAIL,
                password_hash=hash_password(ADMIN_PASSWORD),
                status=UserStatus.active,
                is_admin=True,
            )
            session.add(admin)
            session.commit()
            session.refresh(admin)
            print(f"[seed] Created admin user: {ADMIN_USERNAME} / {ADMIN_PASSWORD}")
            print("[seed] CHANGE THIS PASSWORD after first login.")
        else:
            print(f"[seed] Admin user already exists: {ADMIN_USERNAME}")

        admin_role = roles[RoleName.admin]
        link = session.exec(
            select(UserRole).where(
                UserRole.user_id == admin.id, UserRole.role_id == admin_role.id
            )
        ).first()
        if not link:
            session.add(UserRole(user_id=admin.id, role_id=admin_role.id))
            session.commit()
            print("[seed] Linked admin role to admin user.")

        for name in RoleName:
            if name != RoleName.admin:
                print(f"[seed] Role '{name.value}' ready (id={roles[name].id})")


if __name__ == "__main__":
    seed()
