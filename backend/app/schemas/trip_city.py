from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Self
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.schemas.activity import ActivityResponse


class TripCityBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    city_name: str = Field(min_length=1, max_length=255)
    country: str = Field(min_length=1, max_length=255)
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    arrival_date: date
    departure_date: date
    order_index: int
    notes: str | None = None

    @model_validator(mode="after")
    def validate_date_range(self) -> Self:
        if self.arrival_date > self.departure_date:
            raise ValueError("arrival_date must be on or before departure_date")
        return self


class TripCityCreate(TripCityBase):
    pass


class TripCityUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    city_name: str | None = Field(default=None, min_length=1, max_length=255)
    country: str | None = Field(default=None, min_length=1, max_length=255)
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    arrival_date: date | None = None
    departure_date: date | None = None
    order_index: int | None = None
    notes: str | None = None

    @model_validator(mode="after")
    def validate_date_range(self) -> Self:
        if (
            self.arrival_date is not None
            and self.departure_date is not None
            and self.arrival_date > self.departure_date
        ):
            raise ValueError("arrival_date must be on or before departure_date")
        return self


class TripCitySummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    city_name: str
    country: str
    arrival_date: date
    departure_date: date
    order_index: int
    notes: str | None


class TripCityResponse(TripCitySummaryResponse):
    latitude: Decimal | None
    longitude: Decimal | None
    activities: list[ActivityResponse]
