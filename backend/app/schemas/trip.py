from __future__ import annotations

from datetime import date, datetime
from typing import Self
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.trip import TripStatus
from app.models.trip_member import TripMemberRole
from app.schemas.trip_city import TripCityResponse


class TripBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    start_date: date
    end_date: date
    cover_image: str | None = Field(default=None, max_length=512)
    status: TripStatus = TripStatus.PLANNING

    @model_validator(mode="after")
    def validate_date_range(self) -> Self:
        if self.start_date > self.end_date:
            raise ValueError("start_date must be on or before end_date")
        return self


class TripCreate(TripBase):
    pass


class TripUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    cover_image: str | None = Field(default=None, max_length=512)
    status: TripStatus | None = None

    @model_validator(mode="after")
    def validate_date_range(self) -> Self:
        if (
            self.start_date is not None
            and self.end_date is not None
            and self.start_date > self.end_date
        ):
            raise ValueError("start_date must be on or before end_date")
        return self


class TripSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    description: str | None
    start_date: date
    end_date: date
    cover_image: str | None
    status: TripStatus
    created_at: datetime
    updated_at: datetime


class TripResponse(TripSummaryResponse):
    cities: list[TripCityResponse]


class TripMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    trip_id: UUID
    user_id: UUID
    role: TripMemberRole
    joined_at: datetime
