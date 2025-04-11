import TelegramBot from "node-telegram-bot-api";

// Reemplazá con tu token de BotFather
const token: string = process.env.BOT_TOKEN ?? "";

const bot = new TelegramBot(token, { polling: true });

type Expense = {
  category: string;
  amount: number;
  timestamp: Date;
};
const expenses: Expense[] = [];
const pendingAmounts = new Map<number, number>(); // chatId -> amount

const categories = [
  { label: "🍔 Comida", value: "Comida" },
  { label: "🛍️ Compras", value: "Compras" },
  { label: "🚗 Transporte", value: "Transporte" },
  { label: "🏠 Hogar", value: "Hogar" },
  { label: "🎉 Ocio", value: "Ocio" },
  { label: "💼 Trabajo", value: "Trabajo" },
];

bot.on("message", (msg: any) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();

  if (!text) return;

  // Si es un número, lo tratamos como monto
  const amount = parseFloat(text.replace(",", "."));

  if (!isNaN(amount)) {
    pendingAmounts.set(chatId, amount);

    bot.sendMessage(chatId, "📂 ¿A qué rubro pertenece este gasto?", {
      reply_markup: {
        inline_keyboard: categories.map((cat) => [
          {
            text: cat.label,
            callback_data: cat.value,
          },
        ]),
      },
    });
    return;
  }

  // Si no entendemos el mensaje
  bot.sendMessage(chatId, `❌ Mandá solo el monto del gasto, como por ejemplo: 3500`);
});

// Cuando elige un rubro
bot.on("callback_query", (query) => {
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
      expenses.push(expense);

      bot.sendMessage(
        chatId,
        `✅ Gasto registrado:\n💰 $${amount.toFixed(2)}\n📂 Rubro: ${category}`
      );
    } else {
      bot.sendMessage(chatId, "⚠️ No encontré un monto pendiente. Mandá un número primero.");
    }
  }

  // Confirmar el botón
  if (query.id) {
    bot.answerCallbackQuery(query.id);
  }
});
