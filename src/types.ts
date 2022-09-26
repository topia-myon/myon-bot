import {
  AutocompleteInteraction,
  ButtonInteraction,
  ChatInputCommandInteraction,
  ModalSubmitInteraction,
  SelectMenuInteraction,
  UserContextMenuCommandInteraction,
} from "discord.js";

export type CommandOption =
  & { name: string; description?: string; required?: boolean }
  & ({
    type:
      | "attachment"
      | "boolean"
      | "channel"
      | "integer"
      | "mentionable"
      | "number"
      | "role"
      | "user";
  } | {
    type: "string";
    choices?: string[];
    autocompleteHandler?: (
      search: string,
      interaction: AutocompleteInteraction,
    ) => Promise<string[]>;
  });

export type Command = {
  admin?: boolean;
  name: string;
  description: string;
  handler: (interaction: ChatInputCommandInteraction) => Promise<void>;
  prefix: string;
  options?: CommandOption[];
  buttonHandler?: (interaction: ButtonInteraction) => Promise<void>;
  selectMenuHandler?: (interaction: SelectMenuInteraction) => Promise<void>;
  modalHandler?: (interaction: ModalSubmitInteraction) => Promise<void>;
  contextMenuHandler?: (
    interaction: UserContextMenuCommandInteraction,
  ) => Promise<void>;
};
