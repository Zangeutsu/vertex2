import pytest
from unittest.mock import AsyncMock, MagicMock
from app.services.scheduling_service import SchedulingService
from app.schemas.scheduling import ShiftCreate, BookingBase
from datetime import date

@pytest.mark.asyncio
async def test_create_shift_unit():
    mock_session = AsyncMock()
    mock_shift_repo = MagicMock()
    
    mock_shift = MagicMock()
    mock_shift.id = 1
    mock_shift_repo.create = AsyncMock(return_value=mock_shift)
    
    service = SchedulingService(mock_session)
    service.shift_repo = mock_shift_repo
    
    payload = ShiftCreate(
        client_id=1,
        worker_id=1,
        date=date(2026, 1, 1),
        start_time="09:00",
        end_time="17:00",
        role="Worker"
    )
    result = await service.create_shift(payload)
    
    assert result == mock_shift
    assert mock_shift_repo.create.called

@pytest.mark.asyncio
async def test_delete_shift_success():
    mock_session = AsyncMock()
    mock_shift_repo = MagicMock()
    
    mock_shift = MagicMock()
    mock_shift_repo.get = AsyncMock(return_value=mock_shift)
    mock_shift_repo.delete = AsyncMock()
    
    service = SchedulingService(mock_session)
    service.shift_repo = mock_shift_repo
    
    result = await service.delete_shift(1)
    
    assert result is True
    assert mock_shift_repo.delete.called

@pytest.mark.asyncio
async def test_delete_shift_not_found():
    mock_session = AsyncMock()
    mock_shift_repo = MagicMock()
    mock_shift_repo.get = AsyncMock(return_value=None)
    
    service = SchedulingService(mock_session)
    service.shift_repo = mock_shift_repo
    
    result = await service.delete_shift(999)
    
    assert result is False
