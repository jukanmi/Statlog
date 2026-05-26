from pydantic import BaseModel
from typing import Optional

class AvatarCollectionItem(BaseModel):
    id: str
    name: str
    collected: bool
    image_url: Optional[str] = None
    silhouette_image_url: str