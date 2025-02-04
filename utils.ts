import { AnyThreadChannel, Channel, Collection, Message } from "discord.js";
import "./env.js";

const INDEX_AFTER = 1735527600000; // Tuesday, December 24, 2024 3:00:00 PM (GMT)

export const isForumMessage = (
  channel: Channel
): channel is AnyThreadChannel => {
  return (
    channel.isThread() &&
    channel.parentId !== null &&
    channel.parentId === process.env.DISCUSSIONS_CHANNEL_ID
  );
};

export const isMessageSupported = (message: Message) => {
  const isIndexable = message.createdAt.getTime() > INDEX_AFTER;
  return !message.author.bot && !message.system && isIndexable;
};

export const isForumThread = (thread: AnyThreadChannel) => {
  return (
    thread.parentId !== null &&
    thread.parentId === process.env.DISCUSSIONS_CHANNEL_ID
  );
};

export const isThreadSupported = (thread: AnyThreadChannel) => {
  const isIndexable =
    thread.createdAt !== null && thread.createdAt.getTime() > INDEX_AFTER;
  return isIndexable;
};

export const isMessagePermitted = (message: Message) => {
  return !message.author.bot && !message.system;
};

export const isReached = new Collection<string, number>();

if (!process.env.GENERAL_CHANNEL_ID || !process.env.MEMBER_ROLE_ID) {
  throw new Error("Missing required environment variables!");
}

export const isMember = {
  REQUIRED_MESSAGES: 5,
  GENERAL_CHANNEL_ID: process.env.GENERAL_CHANNEL_ID,
  MEMBER_ROLE_ID: process.env.MEMBER_ROLE_ID,
};

export const getProposalURL = (title: string) => {
  const webURL = process.env.WEB_URL ?? "http://localhost:3000";
  if (title) {
    const parts = title.split("-");
    if (parts.length >= 2) {
      const proposalID = parts[0] + "-" + parts[1].split(" ")[0];
      return `${webURL}/proposal/${proposalID}`;
    }
  }
  console.error("Invalid proposal title:", title);
  return webURL;
};
