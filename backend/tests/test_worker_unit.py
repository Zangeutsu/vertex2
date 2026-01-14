import pytest
from unittest.mock import AsyncMock, MagicMock
from app.services.worker_service import WorkerService
from app.schemas.worker import WorkerCreate
from app.models.activity import ActivityType

@pytest.mark.asyncio
async def test_create_worker_logs_activity():
    # Mock session and repository
    mock_session = AsyncMock()
    mock_repo = MagicMock()
    
    # Mock repo.create to return a worker object
    mock_worker = MagicMock()
    mock_worker.id = 1
    mock_worker.first_name = "Test"
    mock_worker.last_name = "User"
    mock_repo.create = AsyncMock(return_value=mock_worker)
    
    # Instantiate service with mocked repo
    service = WorkerService(mock_session)
    service.repo = mock_repo
    
    # Execute creation
    payload = WorkerCreate(
        first_name="Test",
        last_name="User",
        email="test@example.com",
        document_id="DOC123"
    )
    result = await service.create_worker(payload)
    
    # Assertions
    assert result == mock_worker
    assert mock_repo.create.called
    
    # Verify activity was logged (check session additions)
    # The ActivityService will be instantiated and add an Activity to the session
    # We find the added activity in mock_session.add.call_args_list
    added_objects = [call.args[0] for call in mock_session.add.call_args_list]
    activity = next((obj for obj in added_objects if hasattr(obj, 'type') and obj.type == ActivityType.worker_created), None)
    
    assert activity is not None
    assert activity.entity_id == 1
    assert "Test User" in activity.description
