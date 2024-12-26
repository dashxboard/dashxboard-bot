import {
  ChatInputCommandInteraction,
  Client,
  ContextMenuCommandBuilder,
  MessageContextMenuCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
} from "discord.js";

// Handle command types.
export type SlashCommand = {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction) => void | Promise<void>;
};

export type ContextCommand = {
  data: ContextMenuCommandBuilder;
  execute: (
    interaction: MessageContextMenuCommandInteraction
  ) => void | Promise<void>;
};

// Handle features.
export type OnStart = (client: Client) => Promise<void>;

export type Startup = {
  onStart?: OnStart;
};
