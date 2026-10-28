from fastapi import APIRouter
from backend.services.weather import get_petropavlovsk_weather

router = APIRouter(prefix="/api/weather", tags=["Метеоданные"])


@router.get("/petropavlovsk")
async def get_weather():
    return await get_petropavlovsk_weather()
