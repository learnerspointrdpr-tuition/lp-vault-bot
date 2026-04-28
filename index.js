const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const path = require("path");
const express = require("express");

// 🌐 Dummy server (for Render)
const app = express();
app.get("/", (req, res) => res.send("Bot running 🚀"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));

// 🔐 Token
const TOKEN = process.env.TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true });

// 📂 Base path
const basePath = __dirname;

// Subject names
const nameMap = {
  acc: "Accountancy",
  eco: "Economics",
  bst: "Business Studies"
};

// 🔹 START
bot.onText(/\/start/, (msg) => {
  sendClassMenu(msg.chat.id);
});

// 🔹 CLASS MENU
function sendClassMenu(chatId) {
  bot.sendMessage(chatId, "📚 LP Vault\nby Learners' Point\n\nSelect Class:", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Class 11", callback_data: "c-11" }],
        [{ text: "Class 12", callback_data: "c-12" }]
      ]
    }
  });
}

// 🔹 BUTTON HANDLER
bot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  try {

    // 🔙 Back to classes
    if (data === "back_classes") {
      return sendClassMenu(chatId);
    }

    // 📘 Class → Subjects
    if (data === "c-11" || data === "c-12") {
      const folderPath = path.join(basePath, data);

      if (!fs.existsSync(folderPath)) {
        return bot.sendMessage(chatId, "❌ Class folder missing on server");
      }

      const subjects = fs.readdirSync(folderPath);

      const buttons = subjects.map(sub => [
        {
          text: nameMap[sub] || sub.toUpperCase(),
          callback_data: `${data}/${sub}`
        }
      ]);

      buttons.push([{ text: "⬅ Back", callback_data: "back_classes" }]);

      return bot.sendMessage(chatId, "Select Subject:", {
        reply_markup: { inline_keyboard: buttons }
      });
    }

    // 📂 Subject → Files
    if (data.split("/").length === 2) {
      const folderPath = path.join(basePath, data);

      if (!fs.existsSync(folderPath)) {
        return bot.sendMessage(chatId, "❌ Subject folder missing");
      }

      const files = fs.readdirSync(folderPath);

      const buttons = files.map(file => [
        {
          text: file,
          callback_data: `${data}/${file}`
        }
      ]);

      const classFolder = data.split("/")[0];
      buttons.push([{ text: "⬅ Back", callback_data: classFolder }]);

      return bot.sendMessage(chatId, "Select File:", {
        reply_markup: { inline_keyboard: buttons }
      });
    }

    // 📄 Send PDF
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
