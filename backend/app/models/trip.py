import enum
import uuid
from datetime import date, datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, Enum, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.budget import Budget
    from app.models.trip_city import TripCity
    from app.models.trip_member import TripMember
    from app.models.user import User


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class TripStatus(str, enum.Enum):
    PLANNING = "planning"
    ACTIVE = "active"
    COMPLETED = "completed"


class Trip(Base):
    __tablename__ = "trips"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    cover_image: Mapped[str | None] = mapped_column(String(512), nullable=True)
    status: Mapped[TripStatus] = mapped_column(
        Enum(TripStatus, name="trip_status"),
        nullable=False,
        default=TripStatus.PLANNING,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        nullable=False,
    )

    owner: Mapped["User"] = relationship(
        "User",
        back_populates="owned_trips",
        foreign_keys=[owner_id],
    )
    members: Mapped[list["TripMember"]] = relationship(
        "TripMember",
        back_populates="trip",
        cascade="all, delete-orphan",
    )
    cities: Mapped[list["TripCity"]] = relationship(
        "TripCity",
        back_populates="trip",
        cascade="all, delete-orphan",
    )
    budget: Mapped["Budget | None"] = relationship(
        "Budget",
        back_populates="trip",
        cascade="all, delete-orphan",
        uselist=False,
    )
