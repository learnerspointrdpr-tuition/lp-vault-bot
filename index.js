const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const path = require("path");

// 🔐 Token from Render environment
const TOKEN = process.env.TOKEN;

const bot = new TelegramBot(TOKEN, { polling: true });

// 📂 Base path (VERY IMPORTANT for server)
const basePath = __dirname;

// Subject name mapping
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

// 🔹 HANDLE BUTTONS
bot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  try {

    // 🔸 Back to class menu
    if (data === "back_classes") {
      return sendClassMenu(chatId);
    }

    // 🔸 CLASS → SUBJECT
    if (data === "c-11" || data === "c-12") {
      const subjects = fs.readdirSync(path.join(basePath, data));

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

    // 🔸 SUBJECT → FILES
    if (data.split("/").length === 2) {
      const files = fs.readdirSync(path.join(basePath, data));

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

    // 🔸 SEND PDF
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