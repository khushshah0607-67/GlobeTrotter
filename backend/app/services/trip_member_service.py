from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.trip_member import TripMember, TripMemberRole
from app.repositories.trip_member_repository import TripMemberRepository
from app.repositories.trip_repository import TripRepository
from app.repositories.user_repository import UserRepository
from app.schemas.trip import MemberCreate, MemberRoleUpdate


class MemberNotFoundError(Exception):
    pass


class MemberAccessDeniedError(Exception):
    pass


class MemberAlreadyExistsError(Exception):
    pass


class InvalidMemberRoleError(Exception):
    pass


class MemberService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.trips = TripRepository(db)
        self.members = TripMemberRepository(db)
        self.users = UserRepository(db)

    def _trip_for_user(self, trip_id: UUID, user_id: UUID):
        trip = self.trips.get_accessible_by_id(trip_id, user_id)
        if trip is None:
            raise MemberNotFoundError
        return trip

    def _require_owner(self, trip_id: UUID, user_id: UUID):
        trip = self._trip_for_user(trip_id, user_id)
        if trip.owner_id != user_id:
            raise MemberAccessDeniedError
        return trip

    @staticmethod
    def _response(member: TripMember) -> dict[str, object]:
        return {
            "id": member.id,
            "trip_id": member.trip_id,
            "user_id": member.user_id,
            "role": member.role,
            "joined_at": member.joined_at,
            "full_name": member.user.full_name,
            "email": member.user.email,
        }

    def list_members(self, trip_id: UUID, user_id: UUID) -> list[TripMember]:
        self._trip_for_user(trip_id, user_id)
        return [self._response(member) for member in self.members.list_for_trip(trip_id)]

    def add_member(self, trip_id: UUID, user_id: UUID, member_data: MemberCreate) -> TripMember:
        self._require_owner(trip_id, user_id)
        if member_data.role == TripMemberRole.OWNER:
            raise InvalidMemberRoleError
        target = self.users.get_by_email(str(member_data.email).strip().lower())
        if target is None:
            raise MemberNotFoundError
        if target.id == user_id or self.members.get(trip_id, target.id) is not None:
            raise MemberAlreadyExistsError
        try:
            member = self.members.create(
                trip_id=trip_id,
                user_id=target.id,
                role=member_data.role,
            )
            self.db.commit()
            return self._response(self.members.get(trip_id, target.id) or member)
        except IntegrityError as exc:
            self.db.rollback()
            raise MemberAlreadyExistsError from exc

    def update_role(
        self,
        trip_id: UUID,
        owner_id: UUID,
        target_user_id: UUID,
        role_data: MemberRoleUpdate,
    ) -> TripMember:
        self._require_owner(trip_id, owner_id)
        if role_data.role == TripMemberRole.OWNER or target_user_id == owner_id:
            raise InvalidMemberRoleError
        member = self.members.get(trip_id, target_user_id)
        if member is None:
            raise MemberNotFoundError
        member = self.members.update_role(member, role_data.role)
        self.db.commit()
        return self._response(member)

    def remove_member(self, trip_id: UUID, owner_id: UUID, target_user_id: UUID) -> None:
        self._require_owner(trip_id, owner_id)
        if target_user_id == owner_id:
            raise InvalidMemberRoleError
        member = self.members.get(trip_id, target_user_id)
        if member is None:
            raise MemberNotFoundError
        self.members.delete(member)
        self.db.commit()
