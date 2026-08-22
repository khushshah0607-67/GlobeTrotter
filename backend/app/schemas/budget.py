from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class BudgetBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    total_budget: Decimal = Field(ge=0)
    currency: str = Field(min_length=1, max_length=10)
    accommodation_budget: Decimal | None = Field(default=None, ge=0)
    transportation_budget: Decimal | None = Field(default=None, ge=0)
    food_budget: Decimal | None = Field(default=None, ge=0)
    activities_budget: Decimal | None = Field(default=None, ge=0)
    miscellaneous_budget: Decimal | None = Field(default=None, ge=0)


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    total_budget: Decimal | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, min_length=1, max_length=10)
    accommodation_budget: Decimal | None = Field(default=None, ge=0)
    transportation_budget: Decimal | None = Field(default=None, ge=0)
    food_budget: Decimal | None = Field(default=None, ge=0)
    activities_budget: Decimal | None = Field(default=None, ge=0)
    miscellaneous_budget: Decimal | None = Field(default=None, ge=0)


class BudgetResponse(BudgetBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    trip_id: UUID
