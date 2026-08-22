from datetime import date
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.trip import Trip
from app.repositories.trip_repository import TripRepository
from app.schemas.trip import TripCreate, TripUpdate


class TripNotFoundError(Exception):
    pass


class TripAccessDeniedError(Exception):
    pass


class InvalidTripDatesError(Exception):
    pass


class TripService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.trips = TripRepository(db)

    def create_trip(self, user_id: UUID, trip_data: TripCreate) -> Trip:
        try:
            trip = self.trips.create(
                owner_id=user_id,
                **trip_data.model_dump(),
            )
            self.trips.create_owner_membership(trip_id=trip.id, user_id=user_id)
            self.db.commit()
            return self.trips.get_accessible_by_id(trip.id, user_id) or trip
        except Exception:
            self.db.rollback()
            raise

    def list_trips(self, user_id: UUID) -> list[Trip]:
        return self.trips.get_for_user(user_id)

    def get_trip(self, user_id: UUID, trip_id: UUID) -> Trip:
        trip = self.trips.get_accessible_by_id(trip_id, user_id)
        if trip is None:
            raise TripNotFoundError
        return trip

    def update_trip(self, user_id: UUID, trip_id: UUID, trip_data: TripUpdate) -> Trip:
        trip = self.trips.get_by_id(trip_id, load_nested=True)
        if trip is None:
            raise TripNotFoundError

        membership = self.trips.get_membership(trip_id, user_id)
        if trip.owner_id != user_id and (
            membership is None or membership.role.value != "editor"
        ):
            raise TripAccessDeniedError

        fields = trip_data.model_dump(exclude_unset=True)
        start_date = fields.get("start_date", trip.start_date)
        end_date = fields.get("end_date", trip.end_date)
        if isinstance(start_date, date) and isinstance(end_date, date) and start_date > end_date:
            raise InvalidTripDatesError

        self.trips.update(trip, fields)
        self.db.commit()
        return self.trips.get_accessible_by_id(trip.id, user_id) or trip

    def delete_trip(self, user_id: UUID, trip_id: UUID) -> None:
        trip = self.trips.get_by_id(trip_id)
        if trip is None:
            raise TripNotFoundError
        if trip.owner_id != user_id:
            raise TripAccessDeniedError
        self.trips.delete(trip)
        self.db.commit()
