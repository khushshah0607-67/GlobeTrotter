from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.trip import Trip
from app.models.trip_city import TripCity
from app.models.trip_member import TripMember, TripMemberRole


class TripRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, *, owner_id: UUID, **fields: object) -> Trip:
        trip = Trip(owner_id=owner_id, **fields)
        self.db.add(trip)
        self.db.flush()
        return trip

    def create_owner_membership(self, *, trip_id: UUID, user_id: UUID) -> TripMember:
        membership = TripMember(
            trip_id=trip_id,
            user_id=user_id,
            role=TripMemberRole.OWNER,
        )
        self.db.add(membership)
        self.db.flush()
        return membership

    def get_by_id(self, trip_id: UUID, *, load_nested: bool = False) -> Trip | None:
        statement = select(Trip).where(Trip.id == trip_id)
        if load_nested:
            statement = statement.options(
                selectinload(Trip.cities).selectinload(TripCity.activities)
            )
        return self.db.scalar(statement)

    def get_accessible_by_id(self, trip_id: UUID, user_id: UUID) -> Trip | None:
        statement = (
            select(Trip)
            .where(
                Trip.id == trip_id,
                or_(
                    Trip.owner_id == user_id,
                    Trip.members.any(TripMember.user_id == user_id),
                ),
            )
            .options(selectinload(Trip.cities).selectinload(TripCity.activities))
        )
        return self.db.scalar(statement)

    def get_for_user(self, user_id: UUID) -> list[Trip]:
        statement = (
            select(Trip)
            .where(
                or_(
                    Trip.owner_id == user_id,
                    Trip.members.any(TripMember.user_id == user_id),
                )
            )
            .order_by(Trip.created_at.desc())
        )
        return list(self.db.scalars(statement).all())

    def get_membership(self, trip_id: UUID, user_id: UUID) -> TripMember | None:
        statement = select(TripMember).where(
            TripMember.trip_id == trip_id,
            TripMember.user_id == user_id,
        )
        return self.db.scalar(statement)

    def update(self, trip: Trip, fields: dict[str, object]) -> Trip:
        for field, value in fields.items():
            setattr(trip, field, value)
        self.db.flush()
        self.db.refresh(trip)
        return trip

    def delete(self, trip: Trip) -> None:
        self.db.delete(trip)
        self.db.flush()
