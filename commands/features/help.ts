import {
  Client,
  Events,
  ThreadAutoArchiveDuration,
  EmbedBuilder,
  Colors,
} from "discord.js";
import { baseLog } from "../../log.js";
import { Features } from "../types.js";
import { wordlist } from "../../lib/wordlist.js";
import "../../env.js";

const log = baseLog.extend("help");

export const Help: Features = async (client: Client): Promise<void> => {
  client.on(Events.MessageCreate, async (message) => {
    if (message.channelId !== process.env.HELP_CHANNEL_ID || message.author.bot)
      return;

    const content = message.content.toLowerCase().trim();
    if (wordlist.some((word) => content === word.toLowerCase())) {
      return;
    }

    try {
      const thread = await message.startThread({
        name: `Help request from ${message.author.username}`,
        autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
        reason: `Help request from ${message.author.tag}`,
      });

      const embed = new EmbedBuilder()
        .setTitle("Help request received!")
        .setDescription(
          `
            Hey **${message.author.username}**! Thank you for reaching out for help! A <@&${process.env.MODERATOR_ROLE_ID}> will review your request and provide assistance shortly.

            In the meantime, consider adding more details or clarifications to ensure your question is addressed effectively.
        `
        )
        .setFooter({
          text: "→ Other members may also offer insights, so keep an eye out for additional responses.",
        })
        .setColor(Colors.Blurple);

      await thread.send({
        embeds: [embed],
      });

      log("Created help thread for user %s", message.author.id);
    } catch (error) {
      console.error("Error handling 'help' feature:", error);
      const fail = await message.reply({
        content:
          "Sorry, there was an error processing your help request. Please try again later.",
      });

      setTimeout(async () => {
        try {
          await fail.delete();
        } catch (deleteError) {
          console.error("Error deleting message:", deleteError);
        }
      }, 5000);
    }
  });
};
