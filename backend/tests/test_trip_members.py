from types import SimpleNamespace
from unittest.mock import patch
from uuid import uuid4

import pytest

from app.models.trip_member import TripMemberRole
from app.schemas.trip import MemberCreate
from app.services.trip_member_service import (
    InvalidMemberRoleError,
    MemberAlreadyExistsError,
    MemberService,
)


class FakeSession:
    def commit(self) -> None:
        pass

    def rollback(self) -> None:
        pass


def owner_trip(owner_id):
    return SimpleNamespace(owner_id=owner_id)


def test_owner_role_is_rejected_for_new_members() -> None:
    owner_id = uuid4()
    with patch("app.services.trip_member_service.TripRepository") as repository_type:
        repository_type.return_value.get_accessible_by_id.return_value = owner_trip(owner_id)
        service = MemberService(FakeSession())
        with pytest.raises(InvalidMemberRoleError):
            service.add_member(
                uuid4(),
                owner_id,
                MemberCreate(email="member@example.com", role=TripMemberRole.OWNER),
            )


def test_duplicate_member_is_rejected() -> None:
    owner_id = uuid4()
    target_id = uuid4()
    with (
        patch("app.services.trip_member_service.TripRepository") as trips_type,
        patch("app.services.trip_member_service.UserRepository") as users_type,
        patch("app.services.trip_member_service.TripMemberRepository") as members_type,
    ):
        trips_type.return_value.get_accessible_by_id.return_value = owner_trip(owner_id)
        users_type.return_value.get_by_email.return_value = SimpleNamespace(id=target_id)
        members_type.return_value.get.return_value = SimpleNamespace(user_id=target_id)
        service = MemberService(FakeSession())
        with pytest.raises(MemberAlreadyExistsError):
            service.add_member(
                uuid4(),
                owner_id,
                MemberCreate(email="member@example.com", role=TripMemberRole.VIEWER),
            )
