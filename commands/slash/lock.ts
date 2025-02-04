import {
  ChannelType,
  Colors,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import { unindexPost } from "../../db/posts.js";
import { SlashCommand } from "../types.js";
import { dedent } from "ts-dedent";
import "../../env.js";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("lock")
    .setDescription("Lock a proposal thread")
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageThreads),
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      if (!interaction.channel?.isThread()) {
        await interaction.followUp({
          content: "This command can only be used in a supported channel.",
          ephemeral: true,
        });
      } else {
        const main = interaction.channel.parent;

        if (main && main.type === ChannelType.GuildForum) {
          const locked = main.availableTags.find((tag) =>
            tag.name.includes("Locked")
          )?.id;

          const status = main.availableTags
            .filter(
              (tag) => tag.name.includes("Open") || tag.name.includes("Locked")
            )
            .map((tag) => tag.id);

          if (locked) {
            const newStatus = interaction.channel.appliedTags
              .filter((id) => !status.includes(id))
              .concat(locked);

            await interaction.channel.setAppliedTags(newStatus);
          }
        }

        interaction.editReply({
          content: "Proposal locked!",
        });

        await interaction.channel.setLocked(true);

        await interaction.channel.send({
          embeds: [
            {
              title: "Proposal locked!",
              description: dedent`
              This proposal has been **locked** as it does not meet the requirements for proposal creation outlined in: https://discord.com/channels/1320599752915681320/1321065997368688681
      
              If you need assistance in formulating a clear and well-structured proposal, please do not hesitate to ask for help in the <#${process.env.HELP_CHANNEL_ID}> channel.
            `,
              color: Colors.Blurple,
            },
          ],
        });

        await unindexPost(interaction.channel);

        if (process.env.MOD_LOG_CHANNEL_ID) {
          const channel = interaction.client.channels.cache.get(
            process.env.MOD_LOG_CHANNEL_ID
          ) as TextChannel | undefined;

          if (channel?.isTextBased()) {
            await channel.send({
              embeds: [
                {
                  title: "Proposal locked",
                  description: dedent`
                  Moderator <@${interaction.user.id}> has locked the proposal <#${interaction.channel.id}>.
                `,
                  color: Colors.Blurple,
                },
              ],
            });
          }
        }
      }
    } catch (error) {
      console.error("Error in 'lock' command:", error);
      await interaction.reply({
        content:
          "An error occurred while processing the command. Please try again later.",
        ephemeral: true,
      });
    }
  },
};
