from pydantic import BaseModel


class ORMModel(BaseModel):
    model_config = {"from_attributes": True}
