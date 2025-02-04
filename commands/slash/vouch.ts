import {
  Colors,
  GuildMember,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import { SlashCommand } from "../types.js";
import { dedent } from "ts-dedent";
import { assignTemporaryRole, getUser, removePoints } from "../../db/users.js";
import { POINTS, REQUIRED } from "../../lib/reputation.js";
import "../../env.js";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("vouch")
    .setDescription("Vouch for a user")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("User to whom the action will be applied")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.CreatePublicThreads),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      if (interaction.channelId !== process.env.VOUCH_CHANNEL_ID) {
        await interaction.followUp({
          content: "This command can only be used in a supported channel.",
          ephemeral: true,
        });
        return;
      }

      const voucher = interaction.member as GuildMember;
      const target = interaction.options.getMember("member") as GuildMember;

      if (target.id === interaction.user.id) {
        await interaction.followUp({
          content: "You cannot vouch for yourself.",
          ephemeral: true,
        });
        return;
      }

      if (target.roles.cache.has(process.env.CONTRIBUTOR_ROLE_ID!)) {
        await interaction.followUp({
          content: "This user is already a contributor.",
          ephemeral: true,
        });
        return;
      }

      await removePoints(voucher.id, POINTS.vouch);

      const data = await getUser(voucher.id);
      if (data && data.reputation < REQUIRED) {
        await voucher.roles.remove(process.env.CONTRIBUTOR_ROLE_ID!);
      }

      await assignTemporaryRole(
        target,
        process.env.CONTRIBUTOR_ROLE_ID!,
        6 * 60 * 60 * 1000
      );

      await interaction.editReply({
        content: "Your vouch has been registered!",
      });

      if (interaction.channel instanceof TextChannel) {
        await interaction.channel.send({
          embeds: [
            {
              description: dedent`
              <@${voucher.id}> has vouched for <@${target.id}> to become a <@&${process.env.CONTRIBUTOR_ROLE_ID}>!
              
              The contributor role has been temporarily assigned for 6 hours. Read more about this process and its purpose in <#${process.env.FAQ_CHANNEL_ID}>.

              *${voucher.displayName} has spent ${POINTS.vouch} reputation points for this vouch.*
            `,
              color: Colors.Blurple,
            },
          ],
        });
      }

      if (process.env.MOD_LOG_CHANNEL_ID) {
        const channel = interaction.client.channels.cache.get(
          process.env.MOD_LOG_CHANNEL_ID
        ) as TextChannel | undefined;

        if (channel?.isTextBased()) {
          await channel.send({
            embeds: [
              {
                title: "User vouched",
                description: dedent`
                          Contributor <@${voucher.id}> has vouched for <@${target.id}> to hold the <@&${process.env.CONTRIBUTOR_ROLE_ID}> for 6 hours.
                        `,
                color: Colors.Blurple,
              },
            ],
          });
        }
      }
    } catch (error) {
      console.error("Error in 'vouch' command:", error);
      await interaction.followUp({
        content:
          "An error occurred while processing the command. Please try again later.",
        ephemeral: true,
      });
    }
  },
};
