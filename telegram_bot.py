"""
Минимальный Telegram-бот, который открывает сайт Centrum Air Visa Check
как Mini App (WebApp) прямо внутри Telegram.

Установка:
    pip install pyTelegramBotAPI

Перед запуском задайте два значения ниже (или переменные окружения
BOT_TOKEN и WEBAPP_URL):
    BOT_TOKEN   — токен, который выдаёт @BotFather после /newbot
    WEBAPP_URL  — публичный HTTPS-адрес твоего сайта (Vercel/Netlify),
                  например https://centrum-visa-check.vercel.app

Запуск:
    python telegram_bot.py
"""

import os
import telebot
from telebot import types

BOT_TOKEN = os.environ.get("BOT_TOKEN", "ВСТАВЬ_СЮДА_ТОКЕН_ОТ_BOTFATHER")
WEBAPP_URL = os.environ.get("WEBAPP_URL", "https://ВСТАВЬ_СЮДА_СВОЙ_ДОМЕН")

bot = telebot.TeleBot(BOT_TOKEN)


@bot.message_handler(commands=["start", "app", "visa"])
def open_app(message):
    markup = types.InlineKeyboardMarkup()
    markup.add(
        types.InlineKeyboardButton(
            text="✈️ Открыть Centrum Air Visa Check",
            web_app=types.WebAppInfo(url=WEBAPP_URL),
        )
    )
    bot.send_message(
        message.chat.id,
        "Проверка визового статуса и сканирование визы по фото.\n"
        "Нажми кнопку ниже, чтобы открыть приложение:",
        reply_markup=markup,
    )


if __name__ == "__main__":
    print("Бот запущен. Ctrl+C для остановки.")
    bot.infinity_polling()
