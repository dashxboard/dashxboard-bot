import {
  Colors,
  PermissionFlagsBits,
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";
import { SlashCommand } from "../types.js";

const REPOSITORY = {
  web: "https://github.com/dashxboard/dashxboard-web/issues",
  bot: "https://github.com/dashxboard/dashxboard-bot/issues",
  db: "https://github.com/dashxboard/dashxboard-db/issues",
};

const REPOSITORY_NAME = {
  web: "@dashxboard/web",
  bot: "@dashxboard/bot",
  db: "@dashxboard/db",
};

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("issue")
    .setDescription("Get link to create an issue for specific repository")
    .addStringOption((option) =>
      option
        .setName("repository")
        .setDescription("Select repository to create issue for")
        .setRequired(true)
        .addChoices(
          { name: "@dashxboard/web", value: "web" },
          { name: "@dashxboard/bot", value: "bot" },
          { name: "@dashxboard/db", value: "db" }
        )
    )
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessagesInThreads),

  async execute(interaction) {
    try {
      const key = interaction.options.getString(
        "repository"
      ) as keyof typeof REPOSITORY;
      const url = REPOSITORY[key];
      const name = REPOSITORY_NAME[key];

      const embed = new EmbedBuilder()
        .setColor(Colors.Blurple)
        .setTitle(`Issue Reporting - ${name}`)
        .setDescription(
          `Click below to create an issue for **${name}**:\n${url}`
        )
        .setFooter({
          text: "❗ Please check existing issues before creating a new one.",
        });

      await interaction.reply({
        embeds: [embed],
      });
    } catch (error) {
      console.error("Error in 'issue' command:", error);
      await interaction.reply({
        content:
          "An error occurred while processing your request. Please try again later.",
        ephemeral: true,
      });
    }
  },
};
