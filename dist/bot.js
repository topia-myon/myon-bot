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
import { PermissionFlagsBits, REST, Routes, SlashCommandBuilder, } from "discord.js";
import FastifyFactory from "fastify";
export default class Bot {
    constructor(client, commands) {
        _Bot_server.set(this, void 0);
        _Bot_client.set(this, void 0);
        _Bot_commands.set(this, void 0);
        this.interactionHandler = async (interaction) => {
            const register = async (commands) => {
                if (interaction.isChatInputCommand()) {
                    const { commandName } = interaction;
                    const command = commands.find((command) => command.name === commandName);
                    if (!command)
                        return;
                    await command.handler(interaction);
                }
                else if (interaction.isButton()) {
                    const { customId } = interaction;
                    const command = commands.find((command) => customId.startsWith(`${command.prefix}-button-`));
                    if (!command || !command.buttonHandler)
                        return;
                    await command.buttonHandler(interaction);
                }
                else if (interaction.isSelectMenu()) {
                    const { customId } = interaction;
                    const command = commands.find((command) => customId.startsWith(`${command.prefix}-selectMenu-`));
                    if (!command || !command.selectMenuHandler)
                        return;
                    await command.selectMenuHandler(interaction);
                }
                else if (interaction.isAutocomplete()) {
                    const { commandName } = interaction;
                    const command = commands.find((command) => commandName === command.name);
                    const focused = interaction.options.getFocused(true);
                    const opt = command?.options?.find((opt) => opt.name === focused.name);
                    if (!opt || opt.type !== "string" ||
                        !opt.autocompleteHandler) {
                        return;
                    }
                    await interaction.respond((await opt.autocompleteHandler(focused.value, interaction)).map((s) => ({
                        name: s,
                        value: s,
                    })));
                }
                else if (interaction.isModalSubmit()) {
                    const { customId } = interaction;
                    const command = commands.find((command) => customId.startsWith(`${command.prefix}-modal-`));
                    if (!command || !command.modalHandler)
                        return;
                    await command.modalHandler(interaction);
                }
                else if (interaction.isUserContextMenuCommand()) {
                    const { commandName } = interaction;
                    const command = commands.find((command) => commandName === command.name);
                    if (!command || !command.contextMenuHandler)
                        return;
                    await command.contextMenuHandler(interaction);
                }
            };
            if (interaction.guildId !== process.env.DISCORD_GUILD_ID &&
                interaction.guildId) {
                return;
            }
            if (interaction.guildId === null &&
                interaction.user.id !== process.env.DISCORD_ADMIN_ID) {
                if (interaction.isRepliable()) {
                    await interaction.reply({
                        content: "このコマンドは管理者のみが使用できます。",
                        ephemeral: true,
                    });
                }
                return;
            }
            register(__classPrivateFieldGet(this, _Bot_commands, "f"));
        };
        if (!process.env.DISCORD_TOKEN ||
            !process.env.DISCORD_CLIENT_ID ||
            !process.env.DISCORD_GUILD_ID) {
            throw new Error("Env vars are not defined in the environment.");
        }
        __classPrivateFieldSet(this, _Bot_server, FastifyFactory({
            logger: process.env.NODE_ENV !== "production",
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
        function commandToJSON(command) {
            const builder = new SlashCommandBuilder().setName(command.name)
                .setDescription(command.description);
            if (command.admin) {
                builder.setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
            }
            if (command.options) {
                for (const opt of command.options) {
                    switch (opt.type) {
                        case "string": {
                            builder.addStringOption((option) => {
                                option
                                    .setName(opt.name)
                                    .setDescription(opt.description ?? opt.name)
                                    .setRequired(opt.required ?? false);
                                if (opt.autocompleteHandler) {
                                    option.setAutocomplete(true);
                                }
                                else if (opt.choices) {
                                    option.addChoices(...opt.choices.map((choice) => ({
                                        name: choice,
                                        value: choice,
                                    })));
                                }
                                return option;
                            });
                            break;
                        }
                        case "attachment": {
                            builder.addAttachmentOption((option) => option.setName(opt.name).setDescription(opt.description ?? opt.name).setRequired(opt.required ?? false));
                            break;
                        }
                        case "boolean": {
                            builder.addBooleanOption((option) => option.setName(opt.name).setDescription(opt.description ?? opt.name).setRequired(opt.required ?? false));
                            break;
                        }
                        case "channel": {
                            builder.addChannelOption((option) => option.setName(opt.name).setDescription(opt.description ?? opt.name).setRequired(opt.required ?? false));
                            break;
                        }
                        case "integer": {
                            builder.addIntegerOption((option) => option.setName(opt.name).setDescription(opt.description ?? opt.name).setRequired(opt.required ?? false));
                            break;
                        }
                        case "mentionable": {
                            builder.addMentionableOption((option) => option.setName(opt.name).setDescription(opt.description ?? opt.name).setRequired(opt.required ?? false));
                            break;
                        }
                        case "number": {
                            builder.addNumberOption((option) => option.setName(opt.name).setDescription(opt.description ?? opt.name).setRequired(opt.required ?? false));
                            break;
                        }
                        case "role": {
                            builder.addRoleOption((option) => option.setName(opt.name).setDescription(opt.description ?? opt.name).setRequired(opt.required ?? false));
                            break;
                        }
                        case "user": {
                            builder.addUserOption((option) => option.setName(opt.name).setDescription(opt.description ?? opt.name).setRequired(opt.required ?? false));
                            break;
                        }
                    }
                }
            }
            return builder.toJSON();
        }
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
        ]);
        if (process.env.NODE_ENV !== "production") {
            this.rest.put(Routes.applicationCommands(clientId), {
                body: [
                    ...__classPrivateFieldGet(this, _Bot_commands, "f").map((command) => commandToJSON(command)),
                ],
            });
        }
        __classPrivateFieldGet(this, _Bot_client, "f").on("interactionCreate", this.interactionHandler);
    }
}
_Bot_server = new WeakMap(), _Bot_client = new WeakMap(), _Bot_commands = new WeakMap();
