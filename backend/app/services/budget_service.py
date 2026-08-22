from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.activity import Activity
from app.models.budget import Budget
from app.models.trip import Trip
from app.models.trip_city import TripCity
from app.repositories.budget_repository import BudgetRepository
from app.repositories.trip_repository import TripRepository
from app.schemas.budget import BudgetCreate, BudgetUpdate


class BudgetNotFoundError(Exception):
    pass


class BudgetAccessDeniedError(Exception):
    pass


class BudgetAlreadyExistsError(Exception):
    pass


class BudgetService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.trips = TripRepository(db)
        self.budgets = BudgetRepository(db)

    def _trip_for_user(self, trip_id: UUID, user_id: UUID, *, write: bool) -> Trip:
        trip = self.trips.get_accessible_by_id(trip_id, user_id)
        if trip is None:
            raise BudgetNotFoundError
        if write and trip.owner_id != user_id:
            membership = self.trips.get_membership(trip_id, user_id)
            if membership is None or membership.role.value != "editor":
                raise BudgetAccessDeniedError
        return trip

    def get_budget(self, user_id: UUID, trip_id: UUID) -> Budget:
        self._trip_for_user(trip_id, user_id, write=False)
        budget = self.budgets.get_for_trip(trip_id)
        if budget is None:
            raise BudgetNotFoundError
        return budget

    def create_budget(self, user_id: UUID, trip_id: UUID, budget_data: BudgetCreate) -> Budget:
        self._trip_for_user(trip_id, user_id, write=True)
        if self.budgets.get_for_trip(trip_id) is not None:
            raise BudgetAlreadyExistsError
        try:
            budget = self.budgets.create(trip_id=trip_id, **budget_data.model_dump())
            self.db.commit()
            return budget
        except Exception:
            self.db.rollback()
            raise

    def update_budget(
        self,
        user_id: UUID,
        trip_id: UUID,
        budget_data: BudgetUpdate,
    ) -> Budget:
        self._trip_for_user(trip_id, user_id, write=True)
        budget = self.budgets.get_for_trip(trip_id)
        if budget is None:
            raise BudgetNotFoundError
        self.budgets.update(budget, budget_data.model_dump(exclude_unset=True))
        self.db.commit()
        return budget

    def spending_summary(self, user_id: UUID, trip_id: UUID) -> dict[str, object]:
        trip = self._trip_for_user(trip_id, user_id, write=False)
        cities_count, activities_count, total_activity_cost = self.db.execute(
            select(
                func.count(func.distinct(TripCity.id)),
                func.count(Activity.id),
                func.coalesce(func.sum(Activity.estimated_cost), Decimal("0")),
            )
            .select_from(TripCity)
            .outerjoin(Activity, Activity.trip_city_id == TripCity.id)
            .where(TripCity.trip_id == trip_id)
        ).one()
        budget = self.budgets.get_for_trip(trip_id)
        total_budget = budget.total_budget if budget is not None else None
        remaining_budget = (
            total_budget - total_activity_cost if total_budget is not None else None
        )
        return {
            "trip": trip,
            "cities_count": cities_count,
            "activities_count": activities_count,
            "total_activity_cost": total_activity_cost,
            "budget": budget,
            "remaining_budget": remaining_budget,
        }
