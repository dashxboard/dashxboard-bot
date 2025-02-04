import { addPoints, substractPoints, syncUser } from "./users.js";
import { syncChannel, syncStream } from "./channels.js";
import { ChannelType, Message, PartialMessage } from "discord.js";
import { grantRole } from "../lib/reputation.js";
import { db } from "@dashxboard/db";
import { wordlist } from "../lib/wordlist.js";
import { updatePost } from "./posts.js";

const recentMessages = new Map<
  string,
  Array<{ userId: string; timestamp: Date }>
>();
const CONSECUTIVE_MESSAGES_LIMIT = 3;
const MESSAGES_TIME_WINDOW = 5 * 60 * 1000; // 5 minutes in milliseconds

export const syncMessage = async (message: Message) => {
  const messageContent = message.content.toLowerCase().trim();
  if (
    message.channel.type === ChannelType.PublicThread &&
    message.channel.parent?.type === ChannelType.GuildForum &&
    wordlist.includes(messageContent)
  ) {
    try {
      await message.delete();
      return;
    } catch (error) {
      console.error(
        "Failed to delete message containing a word included in the wordlist:",
        error
      );
      return;
    }
  }

  const messageAuthor = await message.guild?.members.fetch(message.author.id);

  await Promise.all([
    syncUser(message.author, messageAuthor),
    syncStream(message.channel),
    ...message.mentions.channels.mapValues((c) => syncChannel(c)),
    ...(message.mentions.members
      ? message.mentions.members.mapValues((m) => syncUser(m.user, m))
      : []),
  ]);

  await db.transaction().execute(async (transaction) => {
    await transaction
      .insertInto("messages")
      .values({
        snowflake: message.id,
        content: message.content,
        created: message.createdAt,
        edited: message.editedAt,
        user: message.author.id,
        post: message.channelId,
        reply: message.reference?.messageId,
      })
      .onConflict((onconflict) =>
        onconflict.column("snowflake").doUpdateSet({
          content: message.content,
          edited: message.editedAt,
        })
      )
      .executeTakeFirst();

    const channelMessages = recentMessages.get(message.channelId) || [];
    const now = new Date();
    const validMessages = channelMessages.filter(
      (msg) => now.getTime() - msg.timestamp.getTime() < MESSAGES_TIME_WINDOW
    );

    validMessages.push({
      userId: message.author.id,
      timestamp: now,
    });

    recentMessages.set(message.channelId, validMessages);

    const consecutiveMessages = validMessages
      .slice(-CONSECUTIVE_MESSAGES_LIMIT)
      .filter((msg) => msg.userId === message.author.id);

    if (consecutiveMessages.length <= 1) {
      await addPoints(message.author.id, "message", transaction);
    }

    await updatePost(message.channelId, transaction);

    if (message.attachments.size > 0) {
      await transaction
        .deleteFrom("attachments")
        .where("message", "=", message.id)
        .execute();

      await transaction
        .insertInto("attachments")
        .values(
          Array.from(message.attachments.values()).map((attachment) => ({
            snowflake: attachment.id,
            url: attachment.url,
            name: attachment.name,
            content: attachment.contentType,
            message: message.id,
          }))
        )
        .execute();
    }
  });

  if (messageAuthor) {
    await grantRole(messageAuthor);
  }
};

export const deleteMessage = async (
  message: Message<boolean> | PartialMessage
) => {
  await db.transaction().execute(async (transaction) => {
    await transaction
      .deleteFrom("messages")
      .where("snowflake", "=", message.id)
      .executeTakeFirst();

    await transaction
      .deleteFrom("attachments")
      .where("message", "=", message.id)
      .execute();

    await updatePost(message.channelId, transaction);

    if (message.author?.id) {
      await substractPoints(message.author.id, "message", transaction);
    }
  });
};

export const upvoteMessage = async (user: string) => {
  await db.transaction().execute(async (transaction) => {
    await addPoints(user, "upvote", transaction);
  });
};

export const setStatus = async (message: string | null, post: string) => {
  await db.transaction().execute(async (transaction) => {
    if (message === null) {
      await transaction
        .updateTable("posts")
        .set({ status: null })
        .where("snowflake", "=", post)
        .executeTakeFirst();

      await updatePost(post, transaction);
      return;
    }

    await transaction
      .updateTable("posts")
      .set({ status: message })
      .where("snowflake", "=", post)
      .executeTakeFirst();

    await updatePost(post, transaction);
  });
};
