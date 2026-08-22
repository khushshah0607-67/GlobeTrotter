from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.trip_city import TripCityCreate, TripCityResponse, TripCityUpdate
from app.services.trip_city_service import (
    InvalidTripCityDatesError,
    TripCityAccessDeniedError,
    TripCityNotFoundError,
    TripCityService,
)

router = APIRouter(prefix="/trips/{trip_id}/cities", tags=["trip-cities"])


def city_not_found() -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="City not found")


def city_forbidden() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to modify this city",
    )


@router.post("", response_model=TripCityResponse, status_code=status.HTTP_201_CREATED)
def create_city(
    trip_id: UUID,
    city_data: TripCityCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return TripCityService(db).create_city(current_user.id, trip_id, city_data)
    except TripCityNotFoundError:
        raise HTTPException(status_code=404, detail="Trip not found") from None
    except TripCityAccessDeniedError:
        raise city_forbidden() from None


@router.get("", response_model=list[TripCityResponse])
def list_cities(
    trip_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return TripCityService(db).list_cities(current_user.id, trip_id)
    except TripCityNotFoundError:
        raise city_not_found() from None


@router.get("/{city_id}", response_model=TripCityResponse)
def get_city(
    trip_id: UUID,
    city_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return TripCityService(db).get_city(current_user.id, trip_id, city_id)
    except TripCityNotFoundError:
        raise city_not_found() from None


@router.patch("/{city_id}", response_model=TripCityResponse)
def update_city(
    trip_id: UUID,
    city_id: UUID,
    city_data: TripCityUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return TripCityService(db).update_city(current_user.id, trip_id, city_id, city_data)
    except TripCityNotFoundError:
        raise city_not_found() from None
    except TripCityAccessDeniedError:
        raise city_forbidden() from None
    except InvalidTripCityDatesError:
        raise HTTPException(
            status_code=422,
            detail="arrival_date must be on or before departure_date",
        ) from None


@router.delete("/{city_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_city(
    trip_id: UUID,
    city_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    try:
        TripCityService(db).delete_city(current_user.id, trip_id, city_id)
    except TripCityNotFoundError:
        raise city_not_found() from None
    except TripCityAccessDeniedError:
        raise city_forbidden() from None
    return Response(status_code=status.HTTP_204_NO_CONTENT)
