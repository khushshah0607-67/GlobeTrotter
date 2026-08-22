import uuid
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Numeric, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.trip import Trip


class Budget(Base):
    __tablename__ = "budgets"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    trip_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("trips.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    total_budget: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), nullable=False)
    accommodation_budget: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    transportation_budget: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    food_budget: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    activities_budget: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    miscellaneous_budget: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)

    trip: Mapped["Trip"] = relationship("Trip", back_populates="budget")
