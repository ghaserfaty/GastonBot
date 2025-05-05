import { Telegraf, Context, NarrowedContext } from "telegraf";
import { VercelRequest, VercelResponse } from "@vercel/node";
import { Expense } from "../src/types/Expense";
import { appendExpenseToSheet, getReport } from "../src/sheets";
import dotenv from "dotenv";
import { categories, isAllowedUser } from "../src/constants";
import { Message, Update } from "telegraf/typings/core/types/typegram";
dotenv.config();

const token: string = process.env.BOT_TOKEN ?? "";
const bot = new Telegraf(token);

const pendingAmounts = new Map<number, number>(); // chatId -> amount

const displayCategories = async (
  ctx: NarrowedContext<Context<Update>, Update.MessageUpdate<Message>>
) => {
  await ctx
    .reply("📂 ¿A qué rubro pertenece este gasto?", {
      reply_markup: {
        inline_keyboard: categories.map((cat) => [
          {
            text: cat.label,
            callback_data: cat.value,
          },
        ]),
      },
    })
    .catch((error) => {
      console.error("Error al enviar el mensaje de categorías:", error);
    });
};

bot.telegram.setMyCommands([
  {
    command: "report",
    description: "report command",
  },
]);

// Manejador de mensajes
bot.on("message", async (ctx) => {
  if (
    !ctx.message ||
    !("text" in ctx.message) ||
    ctx.message.text.startsWith("/")
  ) {
    return; // Si no es un mensaje de texto, ignora
  }
  const chatId = ctx.chat.id;
  const text = ctx.message.text.trim();

  await ctx.reply(`Mensaje recibido: ${text}`);

  const amount = parseFloat(text.replace(",", "."));

  if (!isNaN(amount)) {
    pendingAmounts.set(chatId, amount);
    displayCategories(ctx);
    return;
  }

  await ctx.reply(`❌ Mandá solo el monto del gasto, como por ejemplo: 3500`);
});

bot.command("report", async (ctx) => {
  try {
    const chatId = ctx.chat.id;

    const result = await getReport(chatId.toString());
    ctx.reply(result.toString());
  } catch (error) {
    console.log(error);
    ctx.reply("error");
  }
});

// Manejadores de selección de rubro
categories.forEach((cat) => {
  bot.action(cat.value, async (ctx) => {
    const chatId = ctx.callbackQuery?.message?.chat.id;
    const category = cat.value;
    if (!chatId || !category || !isAllowedUser(chatId)) {
      return;
    }

    const amount = pendingAmounts.get(chatId);

    if (!amount) {
      await ctx.reply(
        "⚠️ No encontré un monto pendiente. Mandá un número primero."
      );
      return;
    }
    pendingAmounts.delete(chatId);

    const expense: Expense = {
      category,
      amount,
      timestamp: new Date(),
    };

    try {

      await appendExpenseToSheet(chatId.toString(), expense);

      await ctx.reply(
        `✅ Gasto registrado:\n💰 $${
          amount % 1 === 0 ? amount.toString() : amount.toFixed(2)
        }\n📂 Rubro: ${category}`
      );
      
    } catch (error) {
      console.error("Error al escribir en la hoja de cálculo:", error);
      await ctx.reply("⚠️ Hubo un error al registrar el gasto.");
    }

    if (ctx.callbackQuery?.id) {
      await ctx.answerCbQuery();
    }
  });
});

// Handler de Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "POST") {
      await bot.handleUpdate(req.body);
      res.status(200).end();
    } else {
      res.status(200).send("Bot funcionando via webhook con Telegraf.");
    }
  } catch (error) {
    console.error("Error handling update:", error);
    res.status(500).send("Error handling update");
  }
}

if (process.env.NODE_ENV === "development") {
  bot.launch().then(() => console.log("Bot lanzado en modo polling"));
}
