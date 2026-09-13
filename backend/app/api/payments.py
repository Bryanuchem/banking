from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.api.dependencies import get_current_user
from app.database.dependencies import get_db
from app.enums.payment_provider import PaymentProvider
from app.models.payment import Payment
from app.models.user import User
from app.schemas.payment import PaymentHistoryResponse
router=APIRouter(tags=["payments"])
def _purpose(p:Payment)->str:
    if p.deposit_id is not None:return "deposit"
    if p.withdrawal_id is not None:return "withdrawal_fee"
    return "payment"
def _response(p:Payment)->PaymentHistoryResponse:return PaymentHistoryResponse(id=p.id,reference=p.provider_reference or p.internal_reference,amount=p.amount,currency=p.currency,status=p.status,provider=p.provider,channel=p.channel,provider_channel=p.provider_channel,purpose=_purpose(p),deposit_id=p.deposit_id,withdrawal_id=p.withdrawal_id,paid_at=p.paid_at,created_at=p.created_at)
@router.get("/payments",response_model=list[PaymentHistoryResponse])
def list_payments(purpose:str|None=Query(default=None),provider:PaymentProvider|None=Query(default=None),status:str|None=Query(default=None,max_length=30),limit:int=Query(default=50,ge=1,le=100),offset:int=Query(default=0,ge=0),user:User=Depends(get_current_user),db:Session=Depends(get_db))->list[PaymentHistoryResponse]:
    q=select(Payment).where(Payment.user_id==user.id)
    if purpose=="deposit": q=q.where(Payment.deposit_id.is_not(None))
    elif purpose=="withdrawal_fee": q=q.where(Payment.withdrawal_id.is_not(None))
    elif purpose not in {None,"","all"}: raise HTTPException(status_code=422,detail="Unsupported payment purpose.")
    if provider is not None:q=q.where(Payment.provider==provider)
    if status:q=q.where(Payment.status==status)
    return [_response(i) for i in db.scalars(q.order_by(Payment.created_at.desc()).offset(offset).limit(limit)).all()]
@router.get("/payments/{payment_id}",response_model=PaymentHistoryResponse)
def get_payment(payment_id:UUID,user:User=Depends(get_current_user),db:Session=Depends(get_db))->PaymentHistoryResponse:
    p=db.scalar(select(Payment).where(Payment.id==payment_id,Payment.user_id==user.id))
    if p is None: raise HTTPException(status_code=404,detail="Payment not found.")
    return _response(p)
