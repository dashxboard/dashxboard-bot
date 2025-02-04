import {
  Colors,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import { removeFullPoints, syncUser } from "../../db/users.js";
import { grantRole } from "../../lib/reputation.js";
import { SlashCommand } from "../types.js";
import { dedent } from "ts-dedent";
import "../../env.js";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("revoke")
    .setDescription("Revoke the Contributor role from a user")
    .setDMPermission(false)
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("User to whom the action will be applied")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    try {
      const user = interaction.options.getUser("user", true);
      const guild = await interaction.guild?.members.fetch(user.id);

      if (!guild) {
        await interaction.reply({
          content: "Could not find the user in the server.",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "Role revoked!",
          ephemeral: true,
        });

        await syncUser(user, guild);
        await removeFullPoints(user.id);
        await grantRole(guild, true);

        if (process.env.MOD_LOG_CHANNEL_ID) {
          const channel = interaction.client.channels.cache.get(
            process.env.MOD_LOG_CHANNEL_ID
          ) as TextChannel | undefined;

          if (channel?.isTextBased()) {
            await channel.send({
              embeds: [
                {
                  title: "Role revoked",
                  description: dedent`
                    Moderator <@${interaction.user.id}> has revoked the **contributor** role from <@${user.id}>.
                  `,
                  color: Colors.Blurple,
                },
              ],
            });
          }
        }
      }
    } catch (error) {
      console.error("Error in 'revoke' command:", error);
      await interaction.reply({
        content:
          "An error occurred while processing the command. Please try again later.",
        ephemeral: true,
      });
    }
  },
};
