import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.deps import get_current_user
from app.models.auth import User
from app.models.workspace import Product
from app.schemas.workspace import ProductCreate, ProductRead

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[ProductRead])
def list_products(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> list[Product]:
    return list(session.exec(select(Product).order_by(Product.name.asc())).all())


@router.post("", response_model=ProductRead, status_code=201)
def create_product(
    payload: ProductCreate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> Product:
    existing = session.exec(select(Product).where(Product.slug == payload.slug)).first()
    if existing:
        raise HTTPException(409, "Slug đã tồn tại")
    product = Product(
        name=payload.name,
        slug=payload.slug,
        description=payload.description,
        status=payload.status,
        owner_id=user.id,
    )
    session.add(product)
    session.commit()
    session.refresh(product)
    return product


@router.get("/{product_id}", response_model=ProductRead)
def get_product(
    product_id: uuid.UUID,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> Product:
    p = session.get(Product, product_id)
    if not p:
        raise HTTPException(404, "Không tìm thấy sản phẩm")
    return p
