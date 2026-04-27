const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const path = require("path");

const TOKEN = process.env.TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true });

const basePath = __dirname;

// 🔹 START
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "📚 LP Vault\nSelect Class:", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Class 11", callback_data: "c11" }],
        [{ text: "Class 12", callback_data: "c12" }]
      ]
    }
  });
});

// 🔹 HANDLE BUTTONS
bot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  try {

    // CLASS → SUBJECT
    if (data === "c11" || data === "c12") {

      const allFiles = fs.readdirSync(basePath);

      let filtered;

      if (data === "c11") {
        filtered = allFiles.filter(f => f.includes("C 11"));
      } else {
        filtered = allFiles.filter(f => f.includes("C 12"));
      }

      const buttons = filtered.map(file => [
        { text: file, callback_data: file }
      ]);

      return bot.sendMessage(chatId, "Select File:", {
        reply_markup: { inline_keyboard: buttons }
      });
    }

    // SEND PDF
    if (data.endsWith(".pdf")) {
      const filePath = path.join(basePath, data);

      if (fs.existsSync(filePath)) {
        return bot.sendDocument(chatId, filePath);
      } else {
        return bot.sendMessage(chatId, "❌ File not found.");
      }
    }

  } catch (err) {
    console.log(err);
    bot.sendMessage(chatId, "⚠️ Error loading content.");
  }
});