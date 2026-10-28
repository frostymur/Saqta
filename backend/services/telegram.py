import httpx
import logging
from typing import Optional, Dict, Any
from backend.config import settings

logger = logging.getLogger("saqta.telegram")


async def send_emergency_alert(
    station_name: str,
    risk_level: str,
    water_level: float,
    crit_level: float,
    rate_of_rise: float,
    forecast_3h: float,
    explanation: str
) -> Dict[str, Any]:
    """
    Отправляет экстренное оповещение в Telegram-канал/чат оперативного штаба ДЧС СКО.
    Если токен не задан, возвращает успешную симуляцию с подготовленным сообщением.
    """
    emoji_status = "🔴 ЧРЕЗВЫЧАЙНАЯ СИТУАЦИЯ" if risk_level == "high" else ("🟡 ПОВЫШЕННАЯ ГОТОВНОСТЬ" if risk_level == "medium" else "🟢 ШТАТНЫЙ РЕЖИМ")
    
    message_text = (
        f"{emoji_status} | Saqta.kz — МЧС РК\n\n"
        f"📍 <b>Гидропост:</b> {station_name}\n"
        f"🌊 <b>Текущий уровень:</b> {water_level:.1f} см (Крит: {crit_level:.1f} см)\n"
        f"📈 <b>Динамика:</b> {'+' if rate_of_rise >= 0 else ''}{rate_of_rise:.1f} см/ч\n"
        f"🔮 <b>ML-прогноз на +3 часа:</b> {forecast_3h:.1f} см\n\n"
        f"📝 <b>Обоснование:</b>\n{explanation}\n\n"
        f"⚠️ <i>Инструкция оперативному дежурному:</i> Проверить состояние водозащитных валов, "
        f"оповестить службы спасения СКО и население пойменных районов."
    )

    if not settings.TELEGRAM_BOT_TOKEN or not settings.TELEGRAM_CHAT_ID:
        logger.info(f"[SIMULATION] Telegram alert generated for {station_name}:\n{message_text}")
        return {
            "success": True,
            "mode": "simulation",
            "message": "Уведомление сформировано и сохранено в журнале диспетчера (Telegram API token не сконфигурирован в .env).",
            "preview": message_text
        }

    url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": settings.TELEGRAM_CHAT_ID,
        "text": message_text,
        "parse_mode": "HTML"
    }

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                return {
                    "success": True,
                    "mode": "live",
                    "telegram_response": resp.json(),
                    "preview": message_text
                }
            else:
                return {
                    "success": False,
                    "error": f"Telegram API error: {resp.status_code} - {resp.text}",
                    "preview": message_text
                }
    except Exception as e:
        logger.error(f"Failed to send telegram message: {e}")
        return {
            "success": False,
            "error": str(e),
            "preview": message_text
        }
