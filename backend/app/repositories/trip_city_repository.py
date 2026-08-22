from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.trip_city import TripCity


class TripCityRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, *, trip_id: UUID, **fields: object) -> TripCity:
        city = TripCity(trip_id=trip_id, **fields)
        self.db.add(city)
        self.db.flush()
        return city

    def list_for_trip(self, trip_id: UUID) -> list[TripCity]:
        statement = (
            select(TripCity)
            .where(TripCity.trip_id == trip_id)
            .order_by(TripCity.order_index, TripCity.id)
        )
        return list(self.db.scalars(statement).all())

    def get(self, city_id: UUID, *, load_activities: bool = False) -> TripCity | None:
        statement = select(TripCity).where(TripCity.id == city_id)
        if load_activities:
            statement = statement.options(selectinload(TripCity.activities))
        return self.db.scalar(statement)

    def update(self, city: TripCity, fields: dict[str, object]) -> TripCity:
        for field, value in fields.items():
            setattr(city, field, value)
        self.db.flush()
        self.db.refresh(city)
        return city

    def delete(self, city: TripCity) -> None:
        self.db.delete(city)
        self.db.flush()
