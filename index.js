const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const path = require("path");

// 🔐 Token from Render Environment
const TOKEN = process.env.TOKEN;

if (!TOKEN) {
  console.error("❌ BOT TOKEN NOT FOUND");
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });

// 📂 Base Path
const basePath = __dirname;

// Subject name mapping
const nameMap = {
  acc: "📊 Accountancy",
  eco: "📈 Economics",
  bst: "📘 Business Studies"
};

// 🔹 START COMMAND
bot.onText(/\/start/, (msg) => {
  sendClassMenu(msg.chat.id);
});

// 🔹 CLASS MENU
function sendClassMenu(chatId) {
  bot.sendMessage(chatId, "📚 *LP Vault*\nby Learners' Point\n\nSelect Class:", {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "🎓 Class 11", callback_data: "c-11" }],
        [{ text: "🎓 Class 12", callback_data: "c-12" }]
      ]
    }
  });
}

// 🔹 BUTTON HANDLER
bot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  try {
    // 🔸 Back to classes
    if (data === "back_classes") {
      return sendClassMenu(chatId);
    }

    // 🔸 Class → Subjects
    if (data === "c-11" || data === "c-12") {
      const subjectPath = path.join(basePath, data);

      if (!fs.existsSync(subjectPath)) {
        return bot.sendMessage(chatId, "❌ Class folder not found.");
      }

      const subjects = fs.readdirSync(subjectPath);

      const buttons = subjects.map(sub => [
        {
          text: nameMap[sub] || sub.toUpperCase(),
          callback_data: `${data}/${sub}`
        }
      ]);

      buttons.push([{ text: "⬅ Back", callback_data: "back_classes" }]);

      return bot.sendMessage(chatId, "📂 Select Subject:", {
        reply_markup: { inline_keyboard: buttons }
      });
    }

    // 🔸 Subject → Files
    if (data.split("/").length === 2) {
      const filesPath = path.join(basePath, data);

      if (!fs.existsSync(filesPath)) {
        return bot.sendMessage(chatId, "❌ Subject folder not found.");
      }

      const files = fs.readdirSync(filesPath).filter(f => f.endsWith(".pdf"));

      if (files.length === 0) {
        return bot.sendMessage(chatId, "⚠️ No files found.");
      }

      const buttons = files.map(file => [
        {
          text: file,
          callback_data: `${data}/${file}`
        }
      ]);

      const classFolder = data.split("/")[0];

      buttons.push([{ text: "⬅ Back", callback_data: classFolder }]);

      return bot.sendMessage(chatId, "📄 Select File:", {
        reply_markup: { inline_keyboard: buttons }
      });
    }

    // 🔸 Send PDF
    if (data.endsWith(".pdf")) {
      const filePath = path.join(basePath, data);

      if (fs.existsSync(filePath)) {
        return bot.sendDocument(chatId, filePath);
      } else {
        return bot.sendMessage(chatId, "❌ File not found.");
      }
    }

  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "⚠️ Error loading content.");
  }
});