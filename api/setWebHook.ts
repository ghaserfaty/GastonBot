import axios from 'axios';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import dotenv from 'dotenv';  // Importa dotenv
import TelegramBot from 'node-telegram-bot-api';
dotenv.config();

const token = process.env.BOT_TOKEN ?? '';
const bot = new TelegramBot(token);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    setTelegramWebhook();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error al configurar el webhook:", error);
    res.status(500).json({ success: false, error });
  }
}


const webhookUrl = 'https://gaston-bot.vercel.app/api/bot';

async function setTelegramWebhook() {
  const url = `https://api.telegram.org/bot${token}/setWebhook?url=${webhookUrl}`;

  try {
    const result = await bot.setWebHook(webhookUrl);
    //const response = await axios.post(url);
    console.log('Webhook set: ', result);
  } catch (err) {
    console.error('Error setting webhook: ', err);
  }
}