import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { getReputation } from "../../db/users.js";
import { SlashCommand } from "../types.js";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("get")
    .setDescription("Get your reputation points")
    .addUserOption((user) =>
      user
        .setName("user")
        .setDescription("Get other members reputation points")
        .setRequired(false)
    )
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessagesInThreads),

  async execute(interaction) {
    try {
      const option = interaction.options.getUser("user");
      const user = option?.id || interaction.user.id;
      const argument = !!option;
      const count = await getReputation(user);
      const guild = await interaction.guild?.members.fetch(user);

      await interaction.deferReply({ ephemeral: true });

      if (!count) {
        await interaction.editReply({
          content: `Uh-oh! Looks like ${
            argument
              ? "this user doesn't have any reputation points yet."
              : "you don't have any reputation points yet. Start by participating in active discussions."
          }`,
        });
        return;
      }

      if (!guild) {
        await interaction.editReply({
          content: "Could not find the user in the server.",
        });
        return;
      }

      await interaction.editReply({
        content: `${argument ? `${guild.user.username} has` : "You have"} ${
          count.reputation
        } ${count.reputation === 1 ? "point" : "points"}!`,
      });
    } catch (error) {
      console.error("Error in 'get' command:", error);

      if (!interaction.deferred && !interaction.replied) {
        await interaction.reply({
          content:
            "An error occurred while processing the command. Please try again later.",
          ephemeral: true,
        });
      } else {
        await interaction.editReply({
          content:
            "An error occurred while processing the command. Please try again later.",
        });
      }
    }
  },
};
