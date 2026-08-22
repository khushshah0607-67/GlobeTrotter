from __future__ import annotations

from datetime import date as date_type, datetime, time
from decimal import Decimal
from typing import Self
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ActivityBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    category: str | None = Field(default=None, max_length=100)
    date: date_type
    start_time: time | None = None
    end_time: time | None = None
    duration_minutes: int | None = Field(default=None, ge=0)
    estimated_cost: Decimal | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, max_length=10)
    location_name: str | None = Field(default=None, max_length=255)
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    notes: str | None = None
    order_index: int

    @model_validator(mode="after")
    def validate_time_range(self) -> Self:
        if (
            self.start_time is not None
            and self.end_time is not None
            and self.start_time >= self.end_time
        ):
            raise ValueError("start_time must be before end_time")
        return self


class ActivityCreate(ActivityBase):
    pass


class ActivityUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    category: str | None = Field(default=None, max_length=100)
    date: date_type | None = None
    start_time: time | None = None
    end_time: time | None = None
    duration_minutes: int | None = Field(default=None, ge=0)
    estimated_cost: Decimal | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, max_length=10)
    location_name: str | None = Field(default=None, max_length=255)
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    notes: str | None = None
    order_index: int | None = None

    @model_validator(mode="after")
    def validate_time_range(self) -> Self:
        if (
            self.start_time is not None
            and self.end_time is not None
            and self.start_time >= self.end_time
        ):
            raise ValueError("start_time must be before end_time")
        return self


class ActivityResponse(ActivityBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    trip_city_id: UUID
    created_at: datetime
