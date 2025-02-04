import { db, TransactionDB, KyselyDB } from "@dashxboard/db";
import { revalidateProposals, revalidateProposal } from "../revalidate.js";
import { AnyThreadChannel, ChannelType } from "discord.js";
import { substractPoints } from "./users.js";

const extractID = (title: string): string | null => {
  const match = title.match(/^([A-Z]+-\d+)/);
  return match ? match[1] : null;
};

const checkDuplicate = async (id: string): Promise<boolean> => {
  const existing = await db
    .selectFrom("posts")
    .select("title")
    .where("title", "like", `${id}%`)
    .where("indexed", "=", true)
    .executeTakeFirst();

  return !!existing;
};

export const syncPost = async (
  thread: AnyThreadChannel,
  newThread: boolean = false
) => {
  const now = new Date();

  if (newThread) {
    const id = extractID(thread.name);

    if (!id) {
      throw new Error("Invalid proposal ID format");
    }

    const isDuplicate = await checkDuplicate(id);

    if (isDuplicate) {
      throw new Error(`Duplicate proposal ID: ${id}`);
    }
  }

  let category: string | null = null;

  if (
    thread.parent?.type === ChannelType.GuildForum &&
    thread.appliedTags &&
    thread.appliedTags.length > 0
  ) {
    const forum = thread.parent;
    const tags = forum.availableTags.find(
      (tag) => tag.id === thread.appliedTags[0]
    );

    if (tags) {
      category =
        tags.name.toLowerCase() === "official" ? "official" : "community";
    }
  }

  try {
    await db
      .insertInto("posts")
      .values({
        snowflake: thread.id,
        title: thread.name,
        created: thread.createdAt ?? now,
        edited: thread.createdAt ?? now,
        locked: Boolean(thread.locked),
        user: thread.ownerId,
        channel: thread.parentId,
        active: now,
        category: category,
        indexed: true,
      })
      .onConflict((onconflict) =>
        onconflict.column("snowflake").doUpdateSet({
          title: thread.name,
          edited: now,
          locked: Boolean(thread.locked),
          active: now,
          category: category,
        })
      )
      .executeTakeFirst();
    await revalidateProposals();
  } catch (error) {
    console.error("Database operation failed:", error);
    throw error;
  }
};

export const deletePost = async (thread: AnyThreadChannel) => {
  await db.transaction().execute(async (transaction) => {
    await transaction
      .deleteFrom("posts")
      .where("snowflake", "=", thread.id)
      .execute();

    await transaction
      .deleteFrom("messages")
      .where("post", "=", thread.id)
      .execute();

    if (thread.ownerId) {
      await substractPoints(thread.ownerId, "proposal", transaction);
    }
  });
};

export const unindexPost = async (channel: AnyThreadChannel) => {
  await db
    .updateTable("posts")
    .where("snowflake", "=", channel.id)
    .set({ indexed: false })
    .execute();

  if (channel.ownerId) {
    await substractPoints(channel.ownerId, "proposal");
  }

  await revalidateProposal(channel.id);
};

export const updatePost = async (
  post: string,
  transaction: TransactionDB | KyselyDB = db
) => {
  await transaction
    .updateTable("posts")
    .where("snowflake", "=", post)
    .set({ active: new Date() })
    .execute();
};
