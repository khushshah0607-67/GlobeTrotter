import os
from types import SimpleNamespace
from unittest.mock import patch
from uuid import uuid4

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg2://test:test@localhost:5432/test")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-with-at-least-32-characters")

from app.core.security import create_access_token, decode_access_token, hash_password, verify_password
from app.schemas.user import UserCreate
from app.services.auth_service import AuthService, InvalidCredentialsError


class FakeSession:
    def __init__(self) -> None:
        self.committed = False
        self.rolled_back = False

    def add(self, user: object) -> None:
        pass

    def flush(self) -> None:
        pass

    def refresh(self, user: object) -> None:
        pass

    def commit(self) -> None:
        self.committed = True

    def rollback(self) -> None:
        self.rolled_back = True


def test_password_hashing_and_jwt() -> None:
    user_id = uuid4()
    hashed = hash_password("secret")
    assert hashed != "secret"
    assert verify_password("secret", hashed)
    assert not verify_password("wrong", hashed)
    assert decode_access_token(create_access_token(user_id)) == user_id


def test_registration_hashes_password_and_commits() -> None:
    db = FakeSession()
    user = SimpleNamespace(id=uuid4(), password_hash=None)

    with patch("app.services.auth_service.UserRepository") as repository_type:
        repository = repository_type.return_value
        repository.get_by_email.return_value = None
        repository.create.return_value = user
        service = AuthService(db)
        result = service.register(
            UserCreate(full_name="Khush Shah", email="KHUSH@example.com", password="secret")
        )

    assert result is user
    assert db.committed
    assert repository.create.call_args.kwargs["email"] == "khush@example.com"
    password_hash = repository.create.call_args.kwargs["password_hash"]
    assert password_hash.startswith("$argon2")
    assert "password_hash" not in {"id": str(user.id), "full_name": "Khush Shah"}


def test_invalid_login_uses_generic_failure() -> None:
    db = FakeSession()
    with patch("app.services.auth_service.UserRepository") as repository_type:
        repository_type.return_value.get_by_email.return_value = None
        try:
            AuthService(db).login("missing@example.com", "secret")
        except InvalidCredentialsError:
            pass
        else:
            raise AssertionError("invalid credentials must be rejected")
