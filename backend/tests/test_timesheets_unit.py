import pytest
from unittest.mock import AsyncMock, MagicMock
from app.services.timesheet_service import TimesheetService
from app.schemas.timesheet import TimesheetCreate

@pytest.mark.asyncio
async def test_create_timesheet_unit():
    mock_session = AsyncMock()
    mock_repo = MagicMock()
    
    mock_ts = MagicMock()
    mock_ts.id = 1
    mock_repo.create = AsyncMock(return_value=mock_ts)
    
    service = TimesheetService(mock_session)
    service.repo = mock_repo
    
    payload = TimesheetCreate(
        worker_id=1,
        client_id=1,
        date="2026-01-01",
        hours=8.0,
        status="pending"
    )
    result = await service.create_timesheet(payload)
    
    assert result == mock_ts
    assert mock_repo.create.called

@pytest.mark.asyncio
async def test_delete_timesheet_not_found():
    mock_session = AsyncMock()
    mock_repo = MagicMock()
    mock_repo.get = AsyncMock(return_value=None)
    
    service = TimesheetService(mock_session)
    service.repo = mock_repo
    
    with pytest.raises(ValueError, match="Timesheet not found"):
        await service.delete_timesheet(999)
