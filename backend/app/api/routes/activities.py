from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.activity import ActivityCreate, ActivityResponse, ActivityUpdate
from app.services.activity_service import (
    ActivityAccessDeniedError,
    ActivityNotFoundError,
    ActivityService,
)

router = APIRouter(
    prefix="/trips/{trip_id}/cities/{city_id}/activities",
    tags=["activities"],
)


def activity_not_found() -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")


def activity_forbidden() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to modify this activity",
    )


@router.post("", response_model=ActivityResponse, status_code=status.HTTP_201_CREATED)
def create_activity(
    trip_id: UUID,
    city_id: UUID,
    activity_data: ActivityCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return ActivityService(db).create_activity(
            current_user.id, trip_id, city_id, activity_data
        )
    except ActivityNotFoundError:
        raise activity_not_found() from None
    except ActivityAccessDeniedError:
        raise activity_forbidden() from None


@router.get("", response_model=list[ActivityResponse])
def list_activities(
    trip_id: UUID,
    city_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return ActivityService(db).list_activities(current_user.id, trip_id, city_id)
    except ActivityNotFoundError:
        raise activity_not_found() from None


@router.get("/{activity_id}", response_model=ActivityResponse)
def get_activity(
    trip_id: UUID,
    city_id: UUID,
    activity_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return ActivityService(db).get_activity(
            current_user.id, trip_id, city_id, activity_id
        )
    except ActivityNotFoundError:
        raise activity_not_found() from None


@router.patch("/{activity_id}", response_model=ActivityResponse)
def update_activity(
    trip_id: UUID,
    city_id: UUID,
    activity_id: UUID,
    activity_data: ActivityUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return ActivityService(db).update_activity(
            current_user.id,
            trip_id,
            city_id,
            activity_id,
            activity_data,
        )
    except ActivityNotFoundError:
        raise activity_not_found() from None
    except ActivityAccessDeniedError:
        raise activity_forbidden() from None
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from None


@router.delete("/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_activity(
    trip_id: UUID,
    city_id: UUID,
    activity_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    try:
        ActivityService(db).delete_activity(
            current_user.id, trip_id, city_id, activity_id
        )
    except ActivityNotFoundError:
        raise activity_not_found() from None
    except ActivityAccessDeniedError:
        raise activity_forbidden() from None
    return Response(status_code=status.HTTP_204_NO_CONTENT)
