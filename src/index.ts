import TelegramBot, { Message } from 'node-telegram-bot-api';
import { Expense } from './types/Expense';
import { appendExpenseToSheet } from './sheets';
import dotenv from 'dotenv';  // Importa dotenv
dotenv.config();  // Carga las variables de entorno desde el archivo .env


const token: string = process.env.BOT_TOKEN ?? '';

console.log(`token: ${token}`)
const bot = new TelegramBot(token, {  polling: true });

const pendingAmounts = new Map<number, number>(); // chatId -> amount

const categories = [
  { label: "🛒 Supermercado", value: "Supermercado" },
  { label: "🌿 Weed", value: "Weed" },
  { label: "🍕 Delivery", value: "Delivery" },
  { label: "📺 Ocio", value: "Ocio" },
  { label: "🚗 Transporte", value: "Transporte" },
  { label: "📆 Gastos fijos", value: "Gastos fijos" },
  { label: "👕 Ropa", value: "Ropa" },
];

// Manejador de mensajes
bot.on("message", (msg: Message) => {
    console.log("BOT MESSAGE")
    console.log(msg)

  const chatId = msg.chat.id;
  const text = msg.text?.trim();
  console.log(`Mensaje recibido: ${text}`);  // Asegúrate de que lleguen los mensajes


  if (!text) return;

  const amount = parseFloat(text.replace(",", "."));

  if (!isNaN(amount)) {
    pendingAmounts.set(chatId, amount);
    console.log(`por mandar?`);  // Asegúrate de que lleguen los mensajes
    console.log(bot);
    bot.sendMessage(chatId, "📂 ¿A qué rubro pertenece este gasto?", {
      reply_markup: {
        inline_keyboard: categories.map((cat) => [
          {
            text: cat.label,
            callback_data: cat.value,
          },
        ]),
      },
    })
    .then(() => {
        console.log(`Mensaje enviado a ${chatId}`);  // Para depurar si el mensaje se envió
      })
    .catch((error) => {
        console.error("Error al enviar el mensaje:", error);
      });
    return;
  }

  bot.sendMessage(chatId, `❌ Mandá solo el monto del gasto, como por ejemplo: 3500`);
});

// Manejador de selección de rubro
bot.on("callback_query", async (query) => {
  const chatId = query.message?.chat.id;
  const category = query.data;

  if (chatId && category) {
    const amount = pendingAmounts.get(chatId);

    if (amount !== undefined) {
      pendingAmounts.delete(chatId);

      const expense: Expense = {
        category,
        amount,
        timestamp: new Date(),
      };
      await appendExpenseToSheet(chatId.toString(), expense);

      bot.sendMessage(
        chatId,
        `✅ Gasto registrado:\n💰 $${amount.toFixed(2)}\n📂 Rubro: ${category}`
      );
    } else {
      bot.sendMessage(chatId, "⚠️ No encontré un monto pendiente. Mandá un número primero.");
    }
  }

  if (query.id) {
    bot.answerCallbackQuery(query.id);
  }
});
