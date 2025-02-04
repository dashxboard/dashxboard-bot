import {
  Colors,
  ContextMenuCommandBuilder,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";
import { isMessagePermitted } from "../../utils.js";
import { ContextCommand } from "../types.js";
import { dedent } from "ts-dedent";
import "../../env.js";

const warnedMessage: string[] = [];

export const command: ContextCommand = {
  data: new ContextMenuCommandBuilder()
    .setName("Report")
    .setDMPermission(false)
    .setType(3)
    .setDefaultMemberPermissions(PermissionFlagsBits.AddReactions),

  async execute(interaction) {
    if (!isMessagePermitted(interaction.targetMessage)) {
      await interaction.reply({
        content: "You cannot report messages from the system or bots.",
        ephemeral: true,
      });
      return;
    }

    if (interaction.targetMessage.author.id === interaction.user.id) {
      await interaction.reply({
        content: "You cannot report your own messages.",
        ephemeral: true,
      });
      return;
    }

    if (warnedMessage.includes(interaction.targetMessage.id)) {
      await interaction.reply({
        content: "Message reported!",
        ephemeral: true,
      });
      return;
    }

    try {
      await interaction.reply({
        content: "Message reported!",
        ephemeral: true,
      });

      if (process.env.REPORTS_LOG_CHANNEL_ID) {
        const channel = interaction.client.channels.cache.get(
          process.env.REPORTS_LOG_CHANNEL_ID
        ) as TextChannel | undefined;

        if (channel?.isTextBased()) {
          await channel.send({
            content: `<@&${process.env.MODERATOR_ROLE_ID}>`,
            embeds: [
              {
                title: "Message reported",
                description: dedent`
                  <@${interaction.user.id}> (${interaction.user.id}) has reported the following message from <@${interaction.targetMessage.author.id}> (${interaction.targetMessage.author.id}):
                
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
      console.error("Error in 'report' command:", error);
      await interaction.reply({
        content:
          "An error occurred while processing the command. Please try again later.",
        ephemeral: true,
      });
    }

    warnedMessage.push(interaction.targetMessage.id);
  },
};
