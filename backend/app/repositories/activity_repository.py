from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.activity import Activity


class ActivityRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, *, trip_city_id: UUID, **fields: object) -> Activity:
        activity = Activity(trip_city_id=trip_city_id, **fields)
        self.db.add(activity)
        self.db.flush()
        return activity

    def list_for_city(self, trip_city_id: UUID) -> list[Activity]:
        statement = (
            select(Activity)
            .where(Activity.trip_city_id == trip_city_id)
            .order_by(Activity.order_index, Activity.id)
        )
        return list(self.db.scalars(statement).all())

    def get(self, activity_id: UUID) -> Activity | None:
        return self.db.scalar(select(Activity).where(Activity.id == activity_id))

    def update(self, activity: Activity, fields: dict[str, object]) -> Activity:
        for field, value in fields.items():
            setattr(activity, field, value)
        self.db.flush()
        self.db.refresh(activity)
        return activity

    def delete(self, activity: Activity) -> None:
        self.db.delete(activity)
        self.db.flush()
