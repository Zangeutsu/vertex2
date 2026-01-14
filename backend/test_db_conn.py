import asyncio
import uuid
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import get_settings

async def test_conn():
    settings = get_settings()
    # Use the URL directly from settings as it already has the pooler port and ssl=require
    db_url = settings.database_url
    
    print(f"Testing connection to: {db_url.split('@')[1]}")
    
    try:
        engine = create_async_engine(db_url)
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            print("Connection successful!")
            print(f"Result: {result.scalar()}")
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_conn())
