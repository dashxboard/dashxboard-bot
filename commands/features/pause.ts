import {
  Client,
  ChannelType,
  Colors,
  EmbedBuilder,
  ForumChannel,
} from "discord.js";
import { db } from "@dashxboard/db";

const INACTIVITY_THRESHOLD = 5 * 24 * 60 * 60 * 1000; // 5 days in milliseconds
const CHECK_INTERVAL = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds

const embed = (lastActive: Date) => {
  return new EmbedBuilder()
    .setTitle("Proposal paused!")
    .setColor(Colors.Blurple)
    .setDescription(
      "This proposal has been automatically paused due to inactivity."
    )
    .addFields(
      {
        name: "Last Activity",
        value: `<t:${Math.floor(lastActive.getTime() / 1000)}:R>`,
      },
      {
        name: "What's next'?",
        value:
          "Proposals are placed on hold if they remain inactive without any engagement for a specified period, currently set at 5 days. To reactivate the discussion or resolve any concerns, please reach out to a moderator with the required adjustments or clarifications.",
      }
    );
};

export const Pause = async (client: Client) => {
  setInterval(async () => {
    try {
      const posts = await db
        .selectFrom("posts")
        .select(["snowflake", "active", "locked"])
        .where("locked", "=", false)
        .execute();

      const now = new Date();

      for (const post of posts) {
        const lastActive = new Date(post.active).getTime();
        const timeDifference = now.getTime() - lastActive;

        if (timeDifference >= INACTIVITY_THRESHOLD) {
          try {
            const thread = await client.channels.fetch(post.snowflake);
            if (!thread || !thread.isThread()) continue;

            const forum = thread.parent as ForumChannel;
            if (!forum || forum.type !== ChannelType.GuildForum) continue;

            const pausedTag = forum.availableTags.find(
              (tag) => tag.name.toLowerCase() === "paused"
            );

            if (pausedTag && !thread.appliedTags.includes(pausedTag.id)) {
              const currentTags = [...thread.appliedTags, pausedTag.id];

              const inactivityEmbed = embed(new Date(post.active));
              await thread.send({ embeds: [inactivityEmbed] });

              await thread.edit({
                locked: true,
                appliedTags: currentTags,
              });
            }
          } catch (error) {
            console.error(`Error processing thread ${post.snowflake}:`, error);
          }
        }
      }
    } catch (error) {
      console.error("Error handling pause feature", error);
    }
  }, CHECK_INTERVAL);
};
