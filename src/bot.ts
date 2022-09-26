import {
  Client,
  Interaction,
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder,
} from "discord.js";
import FastifyFactory, { FastifyInstance } from "fastify";
import { Command } from "./types";

export default class Bot<
  Commands extends readonly Command[],
> {
  #server: FastifyInstance;
  #client: Client<boolean>;
  #commands: Commands;
  rest: REST;

  constructor(
    client: Client,
    commands: Commands,
  ) {
    if (
      !process.env.DISCORD_TOKEN ||
      !process.env.DISCORD_CLIENT_ID ||
      !process.env.DISCORD_GUILD_ID
    ) {
      throw new Error("Env vars are not defined in the environment.");
    }

    this.#server = FastifyFactory({
      logger: process.env.NODE_ENV !== "production",
    });
    this.#client = client;
    this.#commands = commands;
    this.rest = new REST({ version: "10" }).setToken(
      process.env.DISCORD_TOKEN!,
    );

    this.#server.get("/", async (request, reply) => {
      return { hello: "world" };
    });
  }

  async init() {
    const clientId = process.env.DISCORD_CLIENT_ID!;
    const guildId = process.env.DISCORD_GUILD_ID!;

    function commandToJSON(command: Command) {
      const builder = new SlashCommandBuilder().setName(command.name)
        .setDescription(
          command.description,
        );

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
                  .setDescription(
                    opt.description ?? opt.name,
                  )
                  .setRequired(opt.required ?? false);
                if (opt.autocompleteHandler) {
                  option.setAutocomplete(true);
                } else if (opt.choices) {
                  option.addChoices(
                    ...opt.choices.map((choice) => ({
                      name: choice,
                      value: choice,
                    })),
                  );
                }

                return option;
              });
              break;
            }
            case "attachment": {
              builder.addAttachmentOption((option) =>
                option.setName(opt.name).setDescription(
                  opt.description ?? opt.name,
                ).setRequired(opt.required ?? false)
              );
              break;
            }
            case "boolean": {
              builder.addBooleanOption((option) =>
                option.setName(opt.name).setDescription(
                  opt.description ?? opt.name,
                ).setRequired(opt.required ?? false)
              );
              break;
            }
            case "channel": {
              builder.addChannelOption((option) =>
                option.setName(opt.name).setDescription(
                  opt.description ?? opt.name,
                ).setRequired(opt.required ?? false)
              );
              break;
            }
            case "integer": {
              builder.addIntegerOption((option) =>
                option.setName(opt.name).setDescription(
                  opt.description ?? opt.name,
                ).setRequired(opt.required ?? false)
              );
              break;
            }
            case "mentionable": {
              builder.addMentionableOption((option) =>
                option.setName(opt.name).setDescription(
                  opt.description ?? opt.name,
                ).setRequired(opt.required ?? false)
              );
              break;
            }
            case "number": {
              builder.addNumberOption((option) =>
                option.setName(opt.name).setDescription(
                  opt.description ?? opt.name,
                ).setRequired(opt.required ?? false)
              );
              break;
            }
            case "role": {
              builder.addRoleOption((option) =>
                option.setName(opt.name).setDescription(
                  opt.description ?? opt.name,
                ).setRequired(opt.required ?? false)
              );
              break;
            }
            case "user": {
              builder.addUserOption((option) =>
                option.setName(opt.name).setDescription(
                  opt.description ?? opt.name,
                ).setRequired(opt.required ?? false)
              );
              break;
            }
          }
        }
      }

      return builder.toJSON();
    }

    await Promise.all([
      this.#server.listen({
        ...(process.env.NODE_ENV === "production" ? { host: "0.0.0.0" } : {}),
        port: 8080,
      }),
      new Promise<void>(
        (resolve, reject) => {
          this.#client.once("ready", () => resolve());
          this.#client.once("error", reject);
          this.#client.login(process.env.DISCORD_TOKEN);
        },
      ),
    ]);
    if (process.env.NODE_ENV !== "production") {
      this.rest.put(Routes.applicationCommands(clientId), {
        body: [
          ...this.#commands.map((command) => commandToJSON(command)),
        ],
      });
    }

    this.#client.on("interactionCreate", this.interactionHandler);
  }

  interactionHandler = async (interaction: Interaction) => {
    const register = async (commands: readonly Command[]) => {
      if (interaction.isChatInputCommand()) {
        const { commandName } = interaction;
        const command = commands.find(
          (command) => command.name === commandName,
        );
        if (!command) return;
        await command.handler(interaction);
      } else if (interaction.isButton()) {
        const { customId } = interaction;
        const command = commands.find(
          (command) => customId.startsWith(`${command.prefix}-button-`),
        );
        if (!command || !command.buttonHandler) return;
        await command.buttonHandler(interaction);
      } else if (interaction.isSelectMenu()) {
        const { customId } = interaction;
        const command = commands.find(
          (command) => customId.startsWith(`${command.prefix}-selectMenu-`),
        );
        if (!command || !command.selectMenuHandler) return;
        await command.selectMenuHandler(interaction);
      } else if (interaction.isAutocomplete()) {
        const { commandName } = interaction;
        const command = commands.find(
          (command) => commandName === command.name,
        );
        const focused = interaction.options.getFocused(true);
        const opt = command?.options?.find(
          (opt) => opt.name === focused.name,
        );
        if (
          !opt || opt.type !== "string" ||
          !opt.autocompleteHandler
        ) {
          return;
        }

        await interaction.respond(
          (await opt.autocompleteHandler(focused.value, interaction)).map((
            s,
          ) => ({
            name: s,
            value: s,
          })),
        );
      } else if (interaction.isModalSubmit()) {
        const { customId } = interaction;
        const command = commands.find(
          (command) => customId.startsWith(`${command.prefix}-modal-`),
        );
        if (!command || !command.modalHandler) return;
        await command.modalHandler(interaction);
      } else if (interaction.isUserContextMenuCommand()) {
        const { commandName } = interaction;
        const command = commands.find(
          (command) => commandName === command.name,
        );
        if (!command || !command.contextMenuHandler) return;
        await command.contextMenuHandler(interaction);
      }
    };

    if (
      interaction.guildId !== process.env.DISCORD_GUILD_ID &&
      interaction.guildId
    ) {
      return;
    }
    if (
      interaction.guildId === null &&
      interaction.user.id !== process.env.DISCORD_ADMIN_ID
    ) {
      if (interaction.isRepliable()) {
        await interaction.reply({
          content: "このコマンドは管理者のみが使用できます。",
          ephemeral: true,
        });
      }
      return;
    }

    register(this.#commands);
  };
}
