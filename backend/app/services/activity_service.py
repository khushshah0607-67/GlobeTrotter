from datetime import time
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.activity import Activity
from app.repositories.activity_repository import ActivityRepository
from app.repositories.trip_city_repository import TripCityRepository
from app.repositories.trip_repository import TripRepository
from app.schemas.activity import ActivityCreate, ActivityUpdate


class ActivityNotFoundError(Exception):
    pass


class ActivityAccessDeniedError(Exception):
    pass


class ActivityService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.trips = TripRepository(db)
        self.cities = TripCityRepository(db)
        self.activities = ActivityRepository(db)

    def _city_for_user(self, user_id: UUID, trip_id: UUID, city_id: UUID, *, write: bool):
        trip = self.trips.get_accessible_by_id(trip_id, user_id)
        city = self.cities.get(city_id)
        if trip is None or city is None or city.trip_id != trip_id:
            raise ActivityNotFoundError
        if write and trip.owner_id != user_id:
            membership = self.trips.get_membership(trip_id, user_id)
            if membership is None or membership.role.value != "editor":
                raise ActivityAccessDeniedError
        return city

    def create_activity(
        self,
        user_id: UUID,
        trip_id: UUID,
        city_id: UUID,
        activity_data: ActivityCreate,
    ) -> Activity:
        self._city_for_user(user_id, trip_id, city_id, write=True)
        try:
            activity = self.activities.create(
                trip_city_id=city_id,
                **activity_data.model_dump(),
            )
            self.db.commit()
            return self.activities.get(activity.id) or activity
        except Exception:
            self.db.rollback()
            raise

    def list_activities(self, user_id: UUID, trip_id: UUID, city_id: UUID) -> list[Activity]:
        self._city_for_user(user_id, trip_id, city_id, write=False)
        return self.activities.list_for_city(city_id)

    def get_activity(
        self, user_id: UUID, trip_id: UUID, city_id: UUID, activity_id: UUID
    ) -> Activity:
        self._city_for_user(user_id, trip_id, city_id, write=False)
        activity = self.activities.get(activity_id)
        if activity is None or activity.trip_city_id != city_id:
            raise ActivityNotFoundError
        return activity

    def update_activity(
        self,
        user_id: UUID,
        trip_id: UUID,
        city_id: UUID,
        activity_id: UUID,
        activity_data: ActivityUpdate,
    ) -> Activity:
        self._city_for_user(user_id, trip_id, city_id, write=True)
        activity = self.activities.get(activity_id)
        if activity is None or activity.trip_city_id != city_id:
            raise ActivityNotFoundError
        fields = activity_data.model_dump(exclude_unset=True)
        start_time = fields.get("start_time", activity.start_time)
        end_time = fields.get("end_time", activity.end_time)
        if isinstance(start_time, time) and isinstance(end_time, time) and start_time >= end_time:
            raise ValueError("start_time must be before end_time")
        self.activities.update(activity, fields)
        self.db.commit()
        return self.activities.get(activity.id) or activity

    def delete_activity(self, user_id: UUID, trip_id: UUID, city_id: UUID, activity_id: UUID) -> None:
        self._city_for_user(user_id, trip_id, city_id, write=True)
        activity = self.activities.get(activity_id)
        if activity is None or activity.trip_city_id != city_id:
            raise ActivityNotFoundError
        self.activities.delete(activity)
        self.db.commit()
