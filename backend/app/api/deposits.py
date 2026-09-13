from uuid import UUID
from fastapi import APIRouter, Depends, Header, Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.api.dependencies import get_current_user
from app.utils.step_up import require_step_up_if_enabled
from app.constants.setting_key import SettingKeys
from app.database.dependencies import get_db
from app.enums.payment_provider import PaymentProvider
from app.models.deposit import Deposit
from app.models.user import User
from app.schemas.deposit import DepositRequest, DepositResponse
from app.schemas.payment import PaymentCheckoutResponse
from app.services.deposit_service import DepositService
from app.services.idempotency_service import IdempotencyService
from app.services.payment_service import PaymentService
from app.services.rate_limit_service import RateLimitService
router=APIRouter(tags=["deposits"])
def _response(i:Deposit)->DepositResponse: return DepositResponse(id=i.id,amount=i.amount,currency=i.currency,status=i.status,transaction_id=i.transaction_id,completed_at=i.completed_at,created_at=i.created_at)
@router.post("/deposits",response_model=DepositResponse,status_code=201)
def create_deposit(payload:DepositRequest,idempotency_key:str|None=Header(default=None,alias="Idempotency-Key"),user:User=Depends(get_current_user),db:Session=Depends(get_db))->DepositResponse:
    key=IdempotencyService.require_key(idempotency_key); item=DepositService.create_request(db,user=user,amount=payload.amount,idempotency_key=key); db.commit(); db.refresh(item); return _response(item)
@router.get("/deposits",response_model=list[DepositResponse])
def list_deposits(limit:int=Query(default=50,ge=1,le=100),offset:int=Query(default=0,ge=0),user:User=Depends(get_current_user),db:Session=Depends(get_db))->list[DepositResponse]:
    items=db.scalars(select(Deposit).where(Deposit.user_id==user.id).order_by(Deposit.created_at.desc()).offset(offset).limit(limit)).all(); return [_response(i) for i in items]
@router.get("/deposits/{deposit_id}",response_model=DepositResponse)
def get_deposit(deposit_id:UUID,user:User=Depends(get_current_user),db:Session=Depends(get_db))->DepositResponse: return _response(DepositService.get_for_user(db,user=user,deposit_id=deposit_id))
@router.post("/deposits/{deposit_id}/payment",response_model=PaymentCheckoutResponse,status_code=201)
def initialize_deposit_payment(deposit_id:UUID,provider:PaymentProvider|None=Query(default=None),x_step_up_authorization:str|None=Header(default=None,alias="X-Step-Up-Authorization"),user:User=Depends(get_current_user),db:Session=Depends(get_db))->PaymentCheckoutResponse:
    RateLimitService.check(db,bucket="payment-init",subject=str(user.id),setting_key=SettingKeys.RATE_LIMIT_PAYMENT_PER_HOUR,default_limit=10,window_seconds=3600)
    require_step_up_if_enabled(db,user=user,authorization_token=x_step_up_authorization,required_scope="payment:create")
    payment,checkout=PaymentService.initialize_deposit(db,user=user,deposit_id=deposit_id,provider_name=provider); db.commit(); db.refresh(payment)
    return PaymentCheckoutResponse(id=payment.id,reference=payment.provider_reference or payment.internal_reference,amount=payment.amount,currency=payment.currency,status=payment.status,provider=payment.provider,channel=payment.channel,provider_channel=payment.provider_channel,authorization_url=checkout.authorization_url or "",access_code=checkout.access_code,checkout_data=checkout.metadata,created_at=payment.created_at)
