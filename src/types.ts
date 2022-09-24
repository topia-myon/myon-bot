import { ButtonInteraction, ChatInputCommandInteraction } from "discord.js";

export type Command =
  & {
    name: string;
    description: string;
    handler: (interaction: ChatInputCommandInteraction) => Promise<void>;
  }
  & {
    buttonIdPrefix?: string;
    buttonHandler?: (interaction: ButtonInteraction) => Promise<void>;
  };
