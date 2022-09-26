import {
  ActionRowBuilder,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  ModalBuilder,
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { Command } from "../types";

const send: Command = {
  admin: true,
  name: "伝達",
  description: "ボットとして言葉を伝える",
  prefix: "send",
  options: [{
    name: "メッセージ",
    type: "string",
    required: true,
  }, {
    name: "サーバー",
    type: "string",
    choices: ["爆発物処理版", "みょんボットテスト"],
  }],
  async handler(interaction: ChatInputCommandInteraction) {
    const server = interaction.options.getString("サーバー") ?? "爆発物処理版";
    const message = interaction.options.getString("メッセージ")!;
    const channelId = JSON.parse(process.env.DISCORD_CHANNEL_IDS!)[server];
    const channel = await interaction.client.channels.fetch(channelId);
    if (channel && channel.isTextBased()) {
      channel.send(message);
    }
    await interaction.reply({
      content: "伝達しました",
      ephemeral: true,
    });
  },
};
export default send;
