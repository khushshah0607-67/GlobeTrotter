from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import TokenResponse
from app.schemas.user import UserCreate


class DuplicateEmailError(Exception):
    pass


class InvalidCredentialsError(Exception):
    pass


class AuthService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.users = UserRepository(db)

    def register(self, user_data: UserCreate) -> User:
        email = str(user_data.email).strip().lower()
        if self.users.get_by_email(email) is not None:
            raise DuplicateEmailError

        user = self.users.create(
            full_name=user_data.full_name,
            email=email,
            password_hash=hash_password(user_data.password),
        )
        try:
            self.users.save(user)
            self.db.commit()
        except IntegrityError as exc:
            self.db.rollback()
            raise DuplicateEmailError from exc
        return user

    def login(self, email: str, password: str) -> TokenResponse:
        user = self.users.get_by_email(email.strip().lower())
        if user is None or not verify_password(password, user.password_hash):
            raise InvalidCredentialsError
        return TokenResponse(access_token=create_access_token(user.id))
