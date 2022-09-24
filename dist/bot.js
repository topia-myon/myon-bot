var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Bot_server, _Bot_client, _Bot_commands;
import { REST, Routes, SlashCommandBuilder, } from "discord.js";
import FastifyFactory from "fastify";
export default class Bot {
    constructor(client, commands) {
        _Bot_server.set(this, void 0);
        _Bot_client.set(this, void 0);
        _Bot_commands.set(this, void 0);
        this.interactionHandler = async (interaction) => {
            if (interaction.guildId !== process.env.DISCORD_GUILD_ID)
                return;
            if (interaction.isChatInputCommand()) {
                const { commandName } = interaction;
                const command = __classPrivateFieldGet(this, _Bot_commands, "f").find((command) => command.name === commandName);
                if (!command)
                    return;
                await command.handler(interaction);
            }
            else if (interaction.isButton()) {
                const { customId } = interaction;
                const command = __classPrivateFieldGet(this, _Bot_commands, "f").find((command) => command.buttonIdPrefix && customId.startsWith(command.buttonIdPrefix));
                if (!command || !command.buttonHandler)
                    return;
                await command.buttonHandler(interaction);
            }
        };
        if (!process.env.DISCORD_TOKEN ||
            !process.env.DISCORD_CLIENT_ID ||
            !process.env.DISCORD_GUILD_ID) {
            throw new Error("Env vars are not defined in the environment.");
        }
        __classPrivateFieldSet(this, _Bot_server, FastifyFactory({
            logger: true, // process.env.NODE_ENV !== "production",
        }), "f");
        __classPrivateFieldSet(this, _Bot_client, client, "f");
        __classPrivateFieldSet(this, _Bot_commands, commands, "f");
        this.rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
        __classPrivateFieldGet(this, _Bot_server, "f").get("/", async (request, reply) => {
            return { hello: "world" };
        });
    }
    async init() {
        const clientId = process.env.DISCORD_CLIENT_ID;
        const guildId = process.env.DISCORD_GUILD_ID;
        const commands = __classPrivateFieldGet(this, _Bot_commands, "f").map((command) => new SlashCommandBuilder().setName(command.name).setDescription(command.description).toJSON());
        await Promise.all([
            __classPrivateFieldGet(this, _Bot_server, "f").listen({
                ...(process.env.NODE_ENV === "production" ? { host: "0.0.0.0" } : {}),
                port: 8080,
            }),
            new Promise((resolve, reject) => {
                __classPrivateFieldGet(this, _Bot_client, "f").once("ready", () => resolve());
                __classPrivateFieldGet(this, _Bot_client, "f").once("error", reject);
                __classPrivateFieldGet(this, _Bot_client, "f").login(process.env.DISCORD_TOKEN);
            }),
            this.rest.put(Routes.applicationGuildCommands(clientId, guildId), {
                body: commands,
            }),
        ]);
        __classPrivateFieldGet(this, _Bot_client, "f").on("interactionCreate", this.interactionHandler);
    }
}
_Bot_server = new WeakMap(), _Bot_client = new WeakMap(), _Bot_commands = new WeakMap();
