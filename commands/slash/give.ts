import {
  Colors,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import { givePoints, syncUser } from "../../db/users.js";
import { grantRole } from "../../lib/reputation.js";
import { SlashCommand } from "../types.js";
import { dedent } from "ts-dedent";
import "../../env.js";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("give")
    .setDescription("Give reputation points to a user")
    .setDMPermission(false)
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("User to whom the action will be applied")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("points")
        .setDescription("Amount of reputation points to give")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    try {
      const user = interaction.options.getUser("user", true);
      const points = interaction.options.getInteger("points", true);
      const guild = await interaction.guild?.members.fetch(user.id);

      if (!guild) {
        await interaction.reply({
          content: "Could not find the user in the server.",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "Points granted!",
          ephemeral: true,
        });

        await syncUser(user, guild);
        await givePoints(user.id, points);
        await grantRole(guild, true);

        if (process.env.MOD_LOG_CHANNEL_ID) {
          const channel = interaction.client.channels.cache.get(
            process.env.MOD_LOG_CHANNEL_ID
          ) as TextChannel | undefined;

          if (channel?.isTextBased()) {
            await channel.send({
              embeds: [
                {
                  title: "Points granted",
                  description: dedent`
                    Moderator <@${interaction.user.id}> has given ${points} reputation points to <@${user.id}>.
                  `,
                  color: Colors.Blurple,
                },
              ],
            });
          }
        }
      }
    } catch (error) {
      console.error("Error in 'give' command:", error);
      await interaction.reply({
        content:
          "An error occurred while processing the command. Please try again later.",
        ephemeral: true,
      });
    }
  },
};
