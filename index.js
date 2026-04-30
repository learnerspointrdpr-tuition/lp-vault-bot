const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const path = require("path");

const TOKEN = process.env.TOKEN;

if (!TOKEN) {
  console.error("❌ BOT TOKEN NOT FOUND");
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });

const basePath = __dirname;

const nameMap = {
  acc: "Accountancy",
  eco: "Economics",
  bst: "Business Studies",
  maths: "Mathematics",
  science: "Science"
};

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
      text: cls.replace("c-", "Class "),
      callback_data: cls
    }
  ]);

  bot.sendMessage(chatId, "📚 LP Vault\nby Learners' Point\n\nSelect Class:", {
    reply_markup: { inline_keyboard: buttons }
  });
}

// 🔹 HANDLE BUTTONS
bot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  try {

    // 🔸 BACK TO CLASS MENU
    if (data === "back_classes") {
      return sendClassMenu(chatId);
    }

    // 🔸 CLASS → SUBJECTS
    if (data.startsWith("c-")) {
      const subjects = fs
        .readdirSync(path.join(basePath, data))
        .filter(f => fs.statSync(path.join(basePath, data, f)).isDirectory());

      const buttons = subjects.map(sub => [
        {
          text: nameMap[sub] || sub.toUpperCase(),
          callback_data: `${data}/${sub}`
        }
      ]);

      buttons.push([{ text: "⬅ Back", callback_data: "back_classes" }]);

      return bot.sendMessage(chatId, "📘 Select Subject:", {
        reply_markup: { inline_keyboard: buttons }
      });
    }

    // 🔸 SUBJECT → FILES
    if (data.split("/").length === 2) {
      const files = fs
        .readdirSync(path.join(basePath, data))
        .filter(file => file.toLowerCase().endsWith(".pdf"))
        .sort();

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

    // 🔸 SEND PDF
    if (data.toLowerCase().endsWith(".pdf")) {
      const filePath = path.join(basePath, data);

      if (fs.existsSync(filePath)) {
        return bot.sendDocument(chatId, filePath);
      } else {
        return bot.sendMessage(chatId, "❌ File not found.");
      }
    }

  } catch (err) {
    console.log("ERROR:", err);
    bot.sendMessage(chatId, "⚠️ Error loading content.");
  }
});
