const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const path = require("path");

const TOKEN = process.env.TOKEN;

if (!TOKEN) {
  console.error("❌ BOT TOKEN NOT FOUND");
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });

const basePath = path.resolve();

// 🎯 Subject Names (Premium UI)
const nameMap = {
  acc: "📊 Accountancy",
  eco: "📈 Economics",
  bst: "🏢 Business Studies",
  maths: "📐 Mathematics",
  science: "🔬 Science"
};

// 🎯 Clean File Name Formatter
function formatFileName(file) {
  return file
    .replace(/[-_]/g, " ")
    .replace(".pdf", "")
    .replace(".PDF", "")
    .replace(/\b\w/g, l => l.toUpperCase());
}

// 🔹 START
bot.onText(/\/start/, (msg) => {
  sendClassMenu(msg.chat.id);
});

// 🔹 CLASS MENU
function sendClassMenu(chatId) {
  const classes = fs
    .readdirSync(basePath)
    .filter(f => f.startsWith("c-"))
    .sort();

  const buttons = classes.map(cls => [
    {
      text: `📚 ${cls.replace("c-", "Class ")}`,
      callback_data: cls
    }
  ]);

  bot.sendMessage(
    chatId,
    "🎓 *LP Vault*\nby Learners' Point\n\nSelect your class:",
    {
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: buttons }
    }
  );
}

// 🔹 HANDLE BUTTONS
bot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  try {

    // 🔙 Back to Classes
    if (data === "back_classes") {
      return sendClassMenu(chatId);
    }

    // 📚 Class → Subjects
    if (data.startsWith("c-")) {
      const subjects = fs
        .readdirSync(path.join(basePath, data))
        .filter(f =>
          fs.statSync(path.join(basePath, data, f)).isDirectory()
        )
        .sort();

      if (subjects.length === 0) {
        return bot.sendMessage(chatId, "📭 No subjects available yet.");
      }

      const buttons = subjects.map(sub => [
        {
          text: nameMap[sub] || `📘 ${sub.toUpperCase()}`,
          callback_data: `${data}/${sub}`
        }
      ]);

      buttons.push([{ text: "⬅ Back", callback_data: "back_classes" }]);

      return bot.sendMessage(chatId, "📘 *Select Subject:*", {
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: buttons }
      });
    }

    // 📘 Subject → Files
    if (data.split("/").length === 2) {
      const files = fs
        .readdirSync(path.join(basePath, data))
        .filter(file => file.toLowerCase().endsWith(".pdf"))
        .sort();

      const classFolder = data.split("/")[0];

      if (files.length === 0) {
        return bot.sendMessage(
          chatId,
          "📭 *No files available yet.*\n\nWe’ll upload content soon.",
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [{ text: "⬅ Back", callback_data: classFolder }]
              ]
            }
          }
        );
      }

      const buttons = files.map(file => [
        {
          text: `📄 ${formatFileName(file)}`,
          callback_data: `${data}/${file}`
        }
      ]);

      buttons.push([{ text: "⬅ Back", callback_data: classFolder }]);

      return bot.sendMessage(chatId, "📄 *Select File:*", {
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: buttons }
      });
    }

    // 📄 Send PDF
    if (data.toLowerCase().endsWith(".pdf")) {
      const filePath = path.join(basePath, data.replace(/\\/g, "/"));

      if (fs.existsSync(filePath)) {
        return bot.sendDocument(chatId, filePath, {
          caption: "📥 *Your file is ready!*",
          parse_mode: "Markdown"
        });
      } else {
        return bot.sendMessage(chatId, "❌ File not found.");
      }
    }

  } catch (err) {
    console.log("ERROR:", err);
    bot.sendMessage(chatId, "⚠️ Something went wrong. Please try again.");
  }
});
