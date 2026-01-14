import os
import shutil
import uuid
from typing import Optional
from fastapi import UploadFile

class StorageService:
    def __init__(self, base_path: str = "uploads"):
        self.base_path = base_path
        if not os.path.exists(self.base_path):
            os.makedirs(self.base_path)

    def save_file(self, file: UploadFile, subfolder: str) -> str:
        folder_path = os.path.join(self.base_path, subfolder)
        if not os.path.exists(folder_path):
            os.makedirs(folder_path)
        
        # Create a unique filename to avoid collisions
        file_extension = os.path.splitext(file.filename)[1] if file.filename else ""
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(folder_path, unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Return relative path for storage in DB
        return os.path.join(subfolder, unique_filename).replace("\\", "/")

    def delete_file(self, relative_path: str) -> bool:
        file_path = os.path.join(self.base_path, relative_path)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                return True
            except OSError:
                return False
        return False

    def get_absolute_path(self, relative_path: str) -> str:
        return os.path.abspath(os.path.join(self.base_path, relative_path))
