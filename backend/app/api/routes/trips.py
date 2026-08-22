from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.trip import TripCreate, TripResponse, TripSummaryResponse, TripUpdate
from app.services.trip_service import (
    InvalidTripDatesError,
    TripAccessDeniedError,
    TripNotFoundError,
    TripService,
)

router = APIRouter(prefix="/trips", tags=["trips"])


def not_found() -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")


@router.post("", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
def create_trip(
    trip_data: TripCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return TripService(db).create_trip(current_user.id, trip_data)


@router.get("", response_model=list[TripSummaryResponse])
def list_trips(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return TripService(db).list_trips(current_user.id)


@router.get("/{trip_id}", response_model=TripResponse)
def get_trip(
    trip_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return TripService(db).get_trip(current_user.id, trip_id)
    except TripNotFoundError:
        raise not_found() from None


@router.patch("/{trip_id}", response_model=TripResponse)
def update_trip(
    trip_id: UUID,
    trip_data: TripUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return TripService(db).update_trip(current_user.id, trip_id, trip_data)
    except TripNotFoundError:
        raise not_found() from None
    except TripAccessDeniedError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to update this trip",
        ) from None
    except InvalidTripDatesError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="start_date must be on or before end_date",
        ) from None


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(
    trip_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    try:
        TripService(db).delete_trip(current_user.id, trip_id)
    except TripNotFoundError:
        raise not_found() from None
    except TripAccessDeniedError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the trip owner can delete this trip",
        ) from None
    return Response(status_code=status.HTTP_204_NO_CONTENT)
