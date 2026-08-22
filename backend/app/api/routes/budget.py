from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.budget import BudgetCreate, BudgetResponse, BudgetUpdate
from app.schemas.trip import TripAggregateSummary
from app.services.budget_service import (
    BudgetAccessDeniedError,
    BudgetAlreadyExistsError,
    BudgetNotFoundError,
    BudgetService,
)

router = APIRouter(prefix="/trips/{trip_id}", tags=["budget"])


def not_found(detail: str = "Budget not found") -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


def forbidden() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to modify this budget",
    )


@router.get("/budget", response_model=BudgetResponse)
def get_budget(
    trip_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return BudgetService(db).get_budget(current_user.id, trip_id)
    except BudgetNotFoundError:
        raise not_found() from None


@router.post("/budget", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def create_budget(
    trip_id: UUID,
    budget_data: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return BudgetService(db).create_budget(current_user.id, trip_id, budget_data)
    except BudgetNotFoundError:
        raise not_found("Trip not found") from None
    except BudgetAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This trip already has a budget",
        ) from None
    except BudgetAccessDeniedError:
        raise forbidden() from None


@router.patch("/budget", response_model=BudgetResponse)
def update_budget(
    trip_id: UUID,
    budget_data: BudgetUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return BudgetService(db).update_budget(current_user.id, trip_id, budget_data)
    except BudgetNotFoundError:
        raise not_found() from None
    except BudgetAccessDeniedError:
        raise forbidden() from None


@router.get("/summary", response_model=TripAggregateSummary)
def get_trip_summary(
    trip_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return BudgetService(db).spending_summary(current_user.id, trip_id)
    except BudgetNotFoundError:
        raise not_found("Trip not found") from None
