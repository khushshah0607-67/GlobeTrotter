from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.trip import MemberCreate, MemberResponse, MemberRoleUpdate
from app.services.trip_member_service import (
    MemberAccessDeniedError,
    MemberAlreadyExistsError,
    InvalidMemberRoleError,
    MemberNotFoundError,
    MemberService,
)

router = APIRouter(prefix="/trips/{trip_id}/members", tags=["trip-members"])


def not_found() -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip member not found")


def forbidden() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Only the trip owner can manage members",
    )


@router.post("", response_model=MemberResponse, status_code=status.HTTP_201_CREATED)
def add_member(
    trip_id: UUID,
    member_data: MemberCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return MemberService(db).add_member(trip_id, current_user.id, member_data)
    except MemberNotFoundError:
        raise not_found() from None
    except MemberAccessDeniedError:
        raise forbidden() from None
    except MemberAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User is already a member of this trip",
        ) from None
    except InvalidMemberRoleError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The owner role cannot be assigned through member management",
        ) from None


@router.get("", response_model=list[MemberResponse])
def list_members(
    trip_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return MemberService(db).list_members(trip_id, current_user.id)
    except MemberNotFoundError:
        raise not_found() from None


@router.patch("/{user_id}", response_model=MemberResponse)
def update_member_role(
    trip_id: UUID,
    user_id: UUID,
    role_data: MemberRoleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return MemberService(db).update_role(
            trip_id, current_user.id, user_id, role_data
        )
    except MemberNotFoundError:
        raise not_found() from None
    except MemberAccessDeniedError:
        raise forbidden() from None
    except InvalidMemberRoleError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The trip owner cannot be changed through member management",
        ) from None


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    trip_id: UUID,
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    try:
        MemberService(db).remove_member(trip_id, current_user.id, user_id)
    except MemberNotFoundError:
        raise not_found() from None
    except MemberAccessDeniedError:
        raise forbidden() from None
    except InvalidMemberRoleError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The trip owner cannot be removed through member management",
        ) from None
    return Response(status_code=status.HTTP_204_NO_CONTENT)
