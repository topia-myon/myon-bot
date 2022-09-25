import {
  AutocompleteInteraction,
  ButtonInteraction,
  ChatInputCommandInteraction,
  ModalSubmitInteraction,
  SelectMenuInteraction,
  UserContextMenuCommandInteraction,
} from "discord.js";

export type Command = {
  name: string;
  description: string;
  handler: (interaction: ChatInputCommandInteraction) => Promise<void>;
  prefix: string;
  buttonHandler?: (interaction: ButtonInteraction) => Promise<void>;
  selectMenuHandler?: (interaction: SelectMenuInteraction) => Promise<void>;
  autocompleteHandler?: (interaction: AutocompleteInteraction) => Promise<void>;
  modalHandler?: (interaction: ModalSubmitInteraction) => Promise<void>;
  contextMenuHandler?: (
    interaction: UserContextMenuCommandInteraction,
  ) => Promise<void>;
};
