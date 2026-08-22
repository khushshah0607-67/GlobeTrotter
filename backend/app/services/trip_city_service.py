from datetime import date
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.trip_city import TripCity
from app.repositories.trip_city_repository import TripCityRepository
from app.repositories.trip_repository import TripRepository
from app.schemas.trip_city import TripCityCreate, TripCityUpdate


class TripCityNotFoundError(Exception):
    pass


class TripCityAccessDeniedError(Exception):
    pass


class InvalidTripCityDatesError(Exception):
    pass


class TripCityService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.trips = TripRepository(db)
        self.cities = TripCityRepository(db)

    def _trip_for_user(self, trip_id: UUID, user_id: UUID, *, write: bool):
        trip = self.trips.get_accessible_by_id(trip_id, user_id)
        if trip is None:
            raise TripCityNotFoundError
        if write and trip.owner_id != user_id:
            membership = self.trips.get_membership(trip_id, user_id)
            if membership is None or membership.role.value != "editor":
                raise TripCityAccessDeniedError
        return trip

    def create_city(self, user_id: UUID, trip_id: UUID, city_data: TripCityCreate) -> TripCity:
        self._trip_for_user(trip_id, user_id, write=True)
        try:
            city = self.cities.create(trip_id=trip_id, **city_data.model_dump())
            self.db.commit()
            return self.cities.get(city.id, load_activities=True) or city
        except Exception:
            self.db.rollback()
            raise

    def list_cities(self, user_id: UUID, trip_id: UUID) -> list[TripCity]:
        self._trip_for_user(trip_id, user_id, write=False)
        return self.cities.list_for_trip(trip_id)

    def get_city(self, user_id: UUID, trip_id: UUID, city_id: UUID) -> TripCity:
        self._trip_for_user(trip_id, user_id, write=False)
        city = self.cities.get(city_id, load_activities=True)
        if city is None or city.trip_id != trip_id:
            raise TripCityNotFoundError
        return city

    def update_city(
        self,
        user_id: UUID,
        trip_id: UUID,
        city_id: UUID,
        city_data: TripCityUpdate,
    ) -> TripCity:
        self._trip_for_user(trip_id, user_id, write=True)
        city = self.cities.get(city_id, load_activities=True)
        if city is None or city.trip_id != trip_id:
            raise TripCityNotFoundError
        fields = city_data.model_dump(exclude_unset=True)
        arrival_date = fields.get("arrival_date", city.arrival_date)
        departure_date = fields.get("departure_date", city.departure_date)
        if isinstance(arrival_date, date) and isinstance(departure_date, date) and arrival_date > departure_date:
            raise InvalidTripCityDatesError
        self.cities.update(city, fields)
        self.db.commit()
        return self.cities.get(city.id, load_activities=True) or city

    def delete_city(self, user_id: UUID, trip_id: UUID, city_id: UUID) -> None:
        self._trip_for_user(trip_id, user_id, write=True)
        city = self.cities.get(city_id)
        if city is None or city.trip_id != trip_id:
            raise TripCityNotFoundError
        self.cities.delete(city)
        self.db.commit()
