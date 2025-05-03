import { Telegraf, Context } from 'telegraf';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { Expense } from '../src/types/Expense';
import { appendExpenseToSheet } from '../src/sheets';
import dotenv from 'dotenv';
dotenv.config();

const token: string = process.env.BOT_TOKEN ?? '';
console.log("INICIANDO TELEGRAF");
const bot = new Telegraf(token);

const pendingAmounts = new Map<number, number>(); // chatId -> amount
const categories = [
    { label: "🛒 Supermercado", value: "Supermercado" },
    { label: "🌿 Weed", value: "Weed" },
    { label: "🍕 Delivery", value: "Delivery" },
    { label: "🍽️ Comidas afuera", value: "Comidas afuera" },
    { label: "📺 Ocio", value: "Ocio" },
    { label: "🍺 Salidas", value: "Salidas" },
    { label: "🚗 Transporte", value: "Transporte" },
    { label: "✈️ Viajes", value: "Viajes" },
    { label: "📆 Gastos fijos", value: "Gastos fijos" },
    { label: "🏡 Alquiler / Hipoteca", value: "Alquiler / Hipoteca" },
    { label: "💊 Farmacia", value: "Farmacia" },
    { label: "🏋️‍♂️ Salud & Gimnasio", value: "Salud & Gimnasio" },
    { label: "👕 Ropa", value: "Ropa" },
    { label: "🎁 Regalos & Donaciones", value: "Regalos & Donaciones" },
    { label: "📚 Educación", value: "Educación" },
    { label: "💻 Tecnología", value: "Tecnología" },
    { label: "🧼 Hogar", value: "Hogar" },
    { label: "🐾 Mascotas", value: "Mascotas" }
  ];

// Manejador de mensajes
bot.on('message', async (ctx) => {
  console.log('Mensaje recibido:', ctx.message);
  if (!ctx.message || !('text' in ctx.message)) {
    return; // Si no es un mensaje de texto, ignora
  }
  const chatId = ctx.chat.id;
  const text = ctx.message.text.trim();
  console.log(`Texto recibido: ${text}`);
  await ctx.reply(`Mensaje recibido: ${text}`);

  const amount = parseFloat(text.replace(",", "."));

  if (!isNaN(amount)) {
    pendingAmounts.set(chatId, amount);
    console.log(`Por mandar opciones de categoría`);
    await ctx.reply("📂 ¿A qué rubro pertenece este gasto?", {
      reply_markup: {
        inline_keyboard: categories.map((cat) => [
          {
            text: cat.label,
            callback_data: cat.value,
          },
        ]),
      },
    }).catch((error) => {
      console.error("Error al enviar el mensaje de categorías:", error);
    });
    return;
  }

  await ctx.reply(`❌ Mandá solo el monto del gasto, como por ejemplo: 3500`);
});

// Manejadores de selección de rubro
categories.forEach((cat) => {
  bot.action(cat.value, async (ctx) => {
    const chatId = ctx.callbackQuery?.message?.chat.id;
    const category = cat.value;

    if (chatId && category && (chatId.toString().includes("1338920278") || chatId.toString().includes("1817312721"))) {
      const amount = pendingAmounts.get(chatId);

      if (amount !== undefined) {
        pendingAmounts.delete(chatId);

        const expense: Expense = {
          category,
          amount,
          timestamp: new Date(),
        };
        try {
          await appendExpenseToSheet(chatId.toString(), expense);
          await ctx.reply(
            `✅ Gasto registrado:\n💰 $${amount % 1 === 0 ? amount.toString() : amount.toFixed(2)}\n📂 Rubro: ${category}`
          );
        } catch (error) {
          console.error("Error al escribir en la hoja de cálculo:", error);
          await ctx.reply("⚠️ Hubo un error al registrar el gasto.");
        }
      } else {
        await ctx.reply("⚠️ No encontré un monto pendiente. Mandá un número primero.");
      }
    }

    if (ctx.callbackQuery?.id) {
      await ctx.answerCbQuery();
    }
  });
});

const webhookPath = `/api/bot`;

// Handler de Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'POST') {
      await bot.handleUpdate(req.body);
      res.status(200).end();
    } else {
      res.status(200).send("Bot funcionando via webhook con Telegraf.");
    }
  } catch (error) {
    console.error('Error handling update:', error);
    res.status(500).send('Error handling update');
  }
}

// Desarrollo local (polling)
if (process.env.NODE_ENV === 'development') {
  bot.launch().then(() => console.log('Bot lanzado en modo polling'));
}

// Configurar webhook una vez luego del deploy
// bot.telegram.setWebhook(`https://TU_PROYECTO.vercel.app${webhookPath}`)
//   .then(() => console.log('Webhook configurado:', `https://TU_PROYECTO.vercel.app${webhookPath}`))
//   .catch(console.error);
