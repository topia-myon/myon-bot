import {
  Client,
  GatewayIntentBits,
  Interaction,
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

  constructor(client: Client, commands: Commands) {
    if (
      !process.env.DISCORD_TOKEN ||
      !process.env.DISCORD_CLIENT_ID ||
      !process.env.DISCORD_GUILD_ID
    ) {
      throw new Error("Env vars are not defined in the environment.");
    }

    this.#server = FastifyFactory({
      logger: true, // process.env.NODE_ENV !== "production",
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
    const commands = this.#commands.map((command) =>
      new SlashCommandBuilder().setName(command.name).setDescription(
        command.description,
      ).toJSON()
    );

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
      this.rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commands,
      }),
    ]);

    this.#client.on("interactionCreate", this.interactionHandler);
  }

  interactionHandler = async (interaction: Interaction) => {
    if (interaction.guildId !== process.env.DISCORD_GUILD_ID) return;

    if (interaction.isChatInputCommand()) {
      const { commandName } = interaction;
      const command = this.#commands.find(
        (command) => command.name === commandName,
      );
      if (!command) return;
      await command.handler(interaction);
    } else if (interaction.isButton()) {
      const { customId } = interaction;
      const command = this.#commands.find(
        (command) =>
          command.buttonIdPrefix && customId.startsWith(command.buttonIdPrefix),
      );
      if (!command || !command.buttonHandler) return;
      await command.buttonHandler(interaction);
    }
  };
}
