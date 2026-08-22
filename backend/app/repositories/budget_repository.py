from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.budget import Budget


class BudgetRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_for_trip(self, trip_id: UUID) -> Budget | None:
        return self.db.scalar(select(Budget).where(Budget.trip_id == trip_id))

    def create(self, *, trip_id: UUID, **fields: object) -> Budget:
        budget = Budget(trip_id=trip_id, **fields)
        self.db.add(budget)
        self.db.flush()
        return budget

    def update(self, budget: Budget, fields: dict[str, object]) -> Budget:
        for field, value in fields.items():
            setattr(budget, field, value)
        self.db.flush()
        self.db.refresh(budget)
        return budget

    def delete(self, budget: Budget) -> None:
        self.db.delete(budget)
        self.db.flush()
