from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import require_internal_service
from app.database.dependencies import get_db
from app.schemas.reconciliation import ReconciliationSummary
from app.services.reconciliation_service import ReconciliationService

router = APIRouter(
    prefix="/internal/operations",
    tags=["internal"],
    dependencies=[Depends(require_internal_service)],
)


@router.post("/reconcile", response_model=ReconciliationSummary, include_in_schema=False)
def reconcile_all(db: Session = Depends(get_db)) -> ReconciliationSummary:
    return ReconciliationSummary(**ReconciliationService.all_accounts(db))
