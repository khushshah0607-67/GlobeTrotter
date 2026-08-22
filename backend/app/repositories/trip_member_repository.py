from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.trip_member import TripMember


class TripMemberRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_for_trip(self, trip_id: UUID) -> list[TripMember]:
        statement = (
            select(TripMember)
            .where(TripMember.trip_id == trip_id)
            .options(joinedload(TripMember.user))
            .order_by(TripMember.joined_at, TripMember.id)
        )
        return list(self.db.scalars(statement).all())

    def get(self, trip_id: UUID, user_id: UUID) -> TripMember | None:
        statement = select(TripMember).where(
            TripMember.trip_id == trip_id,
            TripMember.user_id == user_id,
        )
        return self.db.scalar(statement)

    def create(self, *, trip_id: UUID, user_id: UUID, role: object) -> TripMember:
        member = TripMember(trip_id=trip_id, user_id=user_id, role=role)
        self.db.add(member)
        self.db.flush()
        return member

    def update_role(self, member: TripMember, role: object) -> TripMember:
        member.role = role
        self.db.flush()
        self.db.refresh(member)
        return member

    def delete(self, member: TripMember) -> None:
        self.db.delete(member)
        self.db.flush()
