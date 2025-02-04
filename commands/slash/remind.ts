import {
  Colors,
  GuildMember,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { SlashCommand } from "../types.js";

const message = {
  content: `Hey there! Just a friendly reminder to stick to the community rules and guidelines: stay on topic, avoid spamming, price speculation, and posting job offers. Please, visit: <#${process.env.GUIDELINES_CHANNEL_ID}>`,
};

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("remind")
    .setDescription("Remind a user about the guidelines")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("User to whom the action will be applied")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessagesInThreads),

  async execute(interaction) {
    try {
      const { options } = interaction;
      const target = options.getMember("member");
      const id = target instanceof GuildMember ? target.id : null;

      if (id === interaction.user.id) {
        await interaction.reply({
          content: "You cannot use this command on yourself.",
          ephemeral: true,
        });
        return;
      }

      await interaction.reply({
        embeds: [
          {
            description: `<@${id}> ${message.content}`,
            color: Colors.Blurple,
          },
        ],
      });

      await interaction.followUp({
        content: "Reminder sent!",
        ephemeral: true,
      });
    } catch (error) {
      console.error("Error in 'remind' command:", error);
      await interaction.reply({
        content:
          "An error occurred while processing the command. Please try again later.",
        ephemeral: true,
      });
    }
  },
};
