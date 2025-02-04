import {
  ChannelType,
  Colors,
  ContextMenuCommandBuilder,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";
import { isForumMessage, isMessageSupported } from "../../utils.js";
import { setStatus } from "../../db/messages.js";
import { ContextCommand } from "../types.js";
import { dedent } from "ts-dedent";
import "../../env.js";

export const command: ContextCommand = {
  data: new ContextMenuCommandBuilder()
    .setName("Conclude")
    .setDMPermission(false)
    .setType(3)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!interaction.channel || !isForumMessage(interaction.channel)) {
      await interaction.reply({
        content: "This command can only be used in a supported channel.",
        ephemeral: true,
      });
      return;
    }

    if (!isMessageSupported(interaction.targetMessage)) {
      await interaction.reply({
        content: "Message not supported.",
        ephemeral: true,
      });
      return;
    }

    const main = interaction.channel.parent;
    if (!main || main.type !== ChannelType.GuildForum) {
      await interaction.reply({
        content: "Channel not supported.",
        ephemeral: true,
      });
      return;
    }

    try {
      const main = interaction.channel.parent;

      if (main && main.type === ChannelType.GuildForum) {
        const discussed = main.availableTags.find((tag) =>
          tag.name.includes("Concluded")
        )?.id;

        const status = main.availableTags
          .filter(
            (tag) => tag.name.includes("Open") || tag.name.includes("Concluded")
          )
          .map((tag) => tag.id);

        if (discussed) {
          const newStatus = interaction.channel.appliedTags
            .filter((id) => !status.includes(id))
            .concat(discussed);

          await interaction.channel.setAppliedTags(newStatus);
        }
      }

      await interaction.targetMessage.react("<:concluded:1321008918284992603>");

      interaction.reply({
        content: "Proposal concluded!",
        ephemeral: true,
      });

      await setStatus(interaction.targetMessage.id, interaction.channelId);

      await interaction.channel.send({
        embeds: [
          {
            title: "Proposal concluded!",
            description: dedent`
              The community has reached a consensus to conclude the discussion.
              This proposal cannot be reopened. You're welcome to review, refine, and submit an extension.

              For more details, visit: https://discord.com/channels/1320599752915681320/1321065997368688681
            `,
            color: Colors.Blurple,
          },
        ],
      });

      if (process.env.MOD_LOG_CHANNEL_ID) {
        const channel = interaction.client.channels.cache.get(
          process.env.MOD_LOG_CHANNEL_ID
        ) as TextChannel | undefined;

        if (channel?.isTextBased()) {
          await channel.send({
            embeds: [
              {
                title: "Proposal concluded",
                description: dedent`
                  Moderator <@${interaction.user.id}> has concluded the proposal <#${interaction.channel.id}>.
                `,
                color: Colors.Blurple,
              },
            ],
          });
        }
      }
    } catch (error) {
      console.error("Error in 'conclude' command:", error);
      await interaction.reply({
        content:
          "An error occurred while processing the command. Please try again later.",
        ephemeral: true,
      });
    }
  },
};
