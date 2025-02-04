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

const log = baseLog.extend("feedback");

export const Feedback: Features = async (client: Client): Promise<void> => {
  client.on(Events.MessageCreate, async (message) => {
    if (
      message.channelId !== process.env.FEEDBACK_CHANNEL_ID ||
      message.author.bot
    )
      return;

    const content = message.content.toLowerCase().trim();
    if (wordlist.some((word) => content === word.toLowerCase())) {
      return;
    }

    try {
      const thread = await message.startThread({
        name: `Feedback from ${message.author.username}`,
        autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
        reason: `Feedback from ${message.author.tag}`,
      });

      const embed = new EmbedBuilder()
        .setTitle("Feedback received!")
        .setDescription(
          `
          Hey **${message.author.username}**! Thank you for the feedback! It will be reviewed by a <@&${process.env.MODERATOR_ROLE_ID}>, and a response will follow shortly.

          In the meantime, consider adding more details or clarifications to ensure the input is well understood.
        `
        )
        .setFooter({
          text: "→ Community members can also share their thoughts, so stay tuned for additional responses.",
        })
        .setColor(Colors.Blurple);

      await thread.send({
        embeds: [embed],
      });

      log("Created feedback thread for user %s", message.author.id);
    } catch (error) {
      console.error("Error handling 'feedback' feature:", error);
      const fail = await message.reply({
        content:
          "Sorry, there was an error processing your feedback. Please try again later.",
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
