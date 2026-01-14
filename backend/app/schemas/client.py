from typing import Optional
import uuid

from pydantic import EmailStr, Field

from app.schemas.base import ORMModel


class ClientBase(ORMModel):
    name: str = Field(..., min_length=2, max_length=120)
    contact_email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None


class ClientCreate(ClientBase):
    pass


class ClientUpdate(ORMModel):
    name: Optional[str] = Field(None, min_length=2, max_length=120)
    contact_email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class ClientOut(ClientBase):
    id: uuid.UUID
