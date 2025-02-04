import { Channel, ChannelType } from "discord.js";
import { channelsCache } from "../lib/cache.js";
import { isForumMessage } from "../utils.js";
import { db } from "@dashxboard/db";
import { baseLog } from "../log.js";

const log = baseLog.extend("channels");

export const syncStream = async (stream: Channel) => {
  if (!isForumMessage(stream) || !stream.parent) return;
  const main = stream.parent;

  if (
    main.type !== ChannelType.GuildForum &&
    main.type !== ChannelType.GuildText
  ) {
    return;
  }

  await syncChannel(main);
};

export const syncChannel = async (channel: Channel) => {
  const isCached = channelsCache.get(channel.id);
  if (isCached) return;

  const isGuild = "guild" in channel;
  if (!isGuild) return;

  const topic = "topic" in channel ? channel.topic : null;

  await db
    .insertInto("channels")
    .values({
      snowflake: channel.id,
      name: channel.name,
      type: channel.type,
      topic: topic ?? "",
    })
    .onConflict((onconflict) =>
      onconflict.column("snowflake").doUpdateSet({
        name: channel.name,
        topic: topic ?? "",
      })
    )
    .executeTakeFirst();

  log("Synced channel (#%s)", channel.name);
  channelsCache.set(channel.id, true);
};
