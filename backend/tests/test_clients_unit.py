import pytest
from unittest.mock import AsyncMock, MagicMock
from app.services.client_service import ClientService
from app.schemas.client import ClientCreate, ClientUpdate

@pytest.mark.asyncio
async def test_create_client_unit():
    # Mock session and repository
    mock_session = AsyncMock()
    mock_repo = MagicMock()
    
    # Mock repo.create to return a client object
    mock_client = MagicMock()
    mock_client.id = 1
    mock_client.name = "Test Client"
    mock_repo.create = AsyncMock(return_value=mock_client)
    
    # Instantiate service with mocked repo
    service = ClientService(mock_session)
    service.repo = mock_repo
    
    # Execute creation
    payload = ClientCreate(
        name="Test Client",
        contact_email="client@example.com",
        phone="123456789",
        address="123 Street"
    )
    result = await service.create_client(payload)
    
    # Assertions
    assert result == mock_client
    assert result.name == "Test Client"
    assert mock_repo.create.called

@pytest.mark.asyncio
async def test_update_client_unit():
    mock_session = AsyncMock()
    mock_repo = MagicMock()
    
    mock_client = MagicMock()
    mock_client.id = 1
    mock_client.name = "Old Name"
    
    mock_repo.get = AsyncMock(return_value=mock_client)
    mock_repo.update = AsyncMock(return_value=mock_client)
    
    service = ClientService(mock_session)
    service.repo = mock_repo
    
    payload = ClientUpdate(name="New Name")
    result = await service.update_client(1, payload)
    
    assert result == mock_client
    mock_repo.update.assert_called_once_with(mock_client, payload)

@pytest.mark.asyncio
async def test_update_client_not_found():
    mock_session = AsyncMock()
    mock_repo = MagicMock()
    mock_repo.get = AsyncMock(return_value=None)
    
    service = ClientService(mock_session)
    service.repo = mock_repo
    
    with pytest.raises(ValueError, match="Client not found"):
        await service.update_client(999, ClientUpdate(name="New Name"))
