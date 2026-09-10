import pytest
from datetime import datetime, timedelta, timezone
from pydantic import ValidationError
from bson import ObjectId
from app.schemas.events import EventBase
from app.schemas.expenses import ExpenseBase

def test_event_schema_dates_validation():
    # Valid dates
    now = datetime.now(timezone.utc)
    valid_event = EventBase(
        title="Test",
        description="Test desc",
        category="Academic",
        start_datetime=now,
        end_datetime=now + timedelta(hours=1),
        expected_participants=10,
        created_by=str(ObjectId())
    )
    assert valid_event.title == "Test"

    # Invalid dates
    with pytest.raises(ValidationError) as exc:
        EventBase(
            title="Test",
            description="Test desc",
            category="Academic",
            start_datetime=now + timedelta(hours=1),
            end_datetime=now,
            expected_participants=10,
            created_by=str(ObjectId())
        )
    assert "end_datetime must not be earlier than start_datetime" in str(exc.value)

def test_expense_schema_validation():
    # Valid expense
    ExpenseBase(
        category="Food",
        amount=10.0,
        description="Pizza",
        recorded_by=str(ObjectId()),
        date=datetime.now(timezone.utc)
    )

    # Invalid expense (negative amount)
    with pytest.raises(ValidationError) as exc:
        ExpenseBase(
            category="Food",
            amount=-10.0,
            description="Pizza",
            recorded_by=str(ObjectId()),
            date=datetime.now(timezone.utc)
        )
    assert "Input should be greater than or equal to 0" in str(exc.value)
