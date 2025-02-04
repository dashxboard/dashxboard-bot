import {
  Colors,
  ContextMenuCommandBuilder,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";
import { upvoteMessage } from "../../db/messages.js";
import { isMessagePermitted } from "../../utils.js";
import { wordlist } from "../../lib/wordlist.js";
import { ContextCommand } from "../types.js";
import { dedent } from "ts-dedent";
import "../../env.js";

export const command: ContextCommand = {
  data: new ContextMenuCommandBuilder()
    .setName("Upvote")
    .setDMPermission(false)
    .setType(3)
    .setDefaultMemberPermissions(PermissionFlagsBits.CreatePublicThreads),

  async execute(interaction) {
    if (!isMessagePermitted(interaction.targetMessage)) {
      await interaction.reply({
        content: "You cannot upvote messages from the system or bots.",
        ephemeral: true,
      });
      return;
    }

    if (interaction.targetMessage.author.id === interaction.user.id) {
      await interaction.reply({
        content: "You cannot upvote your own messages.",
        ephemeral: true,
      });
      return;
    }

    const wordcount = interaction.targetMessage.content
      .trim()
      .split(/\s+/).length;
    if (wordcount <= 1) {
      await interaction.reply({
        content: "This message cannot be upvoted.",
        ephemeral: true,
      });
      return;
    }

    const words = interaction.targetMessage.content
      .toLowerCase()
      .trim()
      .split(/\s+/);
    const inWordlist = words.some((word) => wordlist.includes(word));
    if (inWordlist) {
      await interaction.reply({
        content: "This message cannot be upvoted.",
        ephemeral: true,
      });
      return;
    }

    try {
      await interaction.deferReply({ ephemeral: true });

      if (process.env.MOD_LOG_CHANNEL_ID) {
        const channel = interaction.client.channels.cache.get(
          process.env.MOD_LOG_CHANNEL_ID
        ) as TextChannel;

        const messages = await channel.messages.fetch({ limit: 100 });
        const hasUpvoted = messages.some(
          (m) =>
            m.embeds[0]?.description?.includes(`<@${interaction.user.id}>`) &&
            m.embeds[0]?.description?.includes(interaction.targetMessage.url)
        );

        if (hasUpvoted) {
          await interaction.editReply({
            content: "You have already upvoted this message.",
          });
          return;
        }
      }

      await upvoteMessage(interaction.targetMessage.author.id);

      await interaction.targetMessage.react("<:upvote:1321008925658845275>");

      await interaction.editReply({
        content: "Message upvoted!",
      });

      if (process.env.MOD_LOG_CHANNEL_ID) {
        const channel = interaction.client.channels.cache.get(
          process.env.MOD_LOG_CHANNEL_ID
        ) as TextChannel | undefined;

        if (channel?.isTextBased()) {
          await channel.send({
            embeds: [
              {
                title: "Message upvoted",
                description: dedent`
                  <@${interaction.user.id}> has upvoted the following message from <@${interaction.targetMessage.author.id}>:

                  > *${interaction.targetMessage.content}*

                  [Go to message](${interaction.targetMessage.url})
                `,
                color: Colors.Blurple,
              },
            ],
          });
        }
      }
    } catch (error) {
      console.error("Error in 'upvote' command:", error);
      console.error("Full error details:", {
        user: interaction.user.id,
        targetMessage: interaction.targetMessage.id,
        channel: interaction.channelId,
      });
      await interaction.reply({
        content:
          "An error occurred while processing the command. Please try again later.",
        ephemeral: true,
      });
    }
  },
};
