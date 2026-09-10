from typing import Annotated, Any
from pydantic import BeforeValidator
from bson import ObjectId

# A simple Pydantic v2 validator for MongoDB ObjectIds.
# We represent ObjectIds as strings in Pydantic models.
# When validating input, we convert it to string.
PyObjectId = Annotated[str, BeforeValidator(str)]

def generate_object_id() -> str:
    return str(ObjectId())
