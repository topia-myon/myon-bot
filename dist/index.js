import { Client, GatewayIntentBits, Partials } from "discord.js";
import Bot from "./bot.js";
import commands from "./commands/index.js";
if (process.env.NODE_ENV !== "production") {
    (await import("dotenv")).default.config();
}
const bot = new Bot(new Client({
    partials: [Partials.Channel, Partials.Message],
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
    ],
}), commands);
await bot.init();
console.log("Running");
