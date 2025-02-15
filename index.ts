import {
  ChannelType,
  Client,
  Colors,
  Events,
  GatewayIntentBits,
  GuildMember,
  NewsChannel,
} from "discord.js";
import {
  isForumMessage,
  isForumThread,
  isMember,
  isMessageSupported,
  isReached,
  isThreadSupported,
} from "./utils.js";
import { ContextCommands } from "./commands/context/index.js";
import { SlashCommands } from "./commands/slash/index.js";
import { deleteMessage, syncMessage } from "./db/messages.js";
import { deletePost, syncPost, unindexPost } from "./db/posts.js";
import { addPoints, syncUser } from "./db/users.js";
import { Startup } from "./commands/types.js";
import { onStartup } from "./commands/features/index.js";
import { wordlist } from "./lib/wordlist.js";
import { getProposalURL } from "./utils.js";
import { baseLog } from "./log.js";
import { dedent } from "ts-dedent";
import "./env.js";

if (!process.env.DISCORD_BOT_TOKEN) {
  throw new Error("DISCORD_BOT_TOKEN not found!");
}

const features: Startup = {
  onStart: async (client) => {
    for (const feature of onStartup) {
      try {
        await feature(client);
        baseLog(`${feature.name} feature initialized successfully`);
      } catch (error) {
        console.error(`Failed to initialize ${feature.name}:`, error);
      }
    }
  },
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, async (client) => {
  baseLog(`Logged in as ${client.user.tag}!`);

  if (features.onStart) {
    try {
      await features.onStart(client);
      baseLog("All startup features initialized successfully");
    } catch (error) {
      console.error("Failed to initialize startup features:", error);
    }
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (!isForumMessage(message.channel) || !isMessageSupported(message)) {
    return;
  }

  try {
    await syncMessage(message);
    baseLog("Message created in post %s", message.channelId);
  } catch (err) {
    console.error("Failed to create message:", err);
  }
});

client.on(Events.MessageUpdate, async (_, newMessage) => {
  if (!isForumMessage(newMessage.channel)) {
    return;
  }

  try {
    const message = await newMessage.fetch();
    if (isMessageSupported(message)) {
      return;
    }

    await syncMessage(message);
    baseLog("Message updated in post %s", message.channelId);
  } catch (err) {
    console.error("Failed to update message:", err);
  }
});

client.on(Events.MessageDelete, async (message) => {
  if (!isForumMessage(message.channel)) {
    return;
  }

  try {
    await deleteMessage(message);
    baseLog("Message deleted in post %s", message.channelId);
  } catch (err) {
    console.error("Failed to delete message:", err);
  }
});

client.on(Events.ThreadCreate, async (thread) => {
  if (!isForumThread(thread) || !isThreadSupported(thread)) {
    return;
  }

  try {
    await syncPost(thread, true);
    baseLog("Proposal created (%s)", thread.id);

    const parent = thread.parent;
    if (parent?.type === ChannelType.GuildForum) {
      const open = parent.availableTags.find((tag) =>
        tag.name.includes("Open")
      )?.id;

      if (open) {
        await thread.setAppliedTags([...thread.appliedTags, open]);
      }
    }

    if (thread.ownerId) {
      await addPoints(thread.ownerId, "proposal");
    }

    await thread.send({
      embeds: [
        {
          title: "Proposal created!",
          description: dedent`
            A new proposal has been posted and indexed in the Dashxboard website, making it visible by search engines and helping who just want to follow the discussion.
                          
            Read more about the mechanics of proposals in https://discord.com/channels/1320599752915681320/1321065997368688681

            **Privacy Notice**: By default, both your Discord username and avatar in this discussion remain private and won’t be visible outside Discord. If you wish to make your profile public, you can enable it in <id:customize>

            Now that everything is set, let the discussion begin!
          `,
          color: Colors.Blurple,
          url: getProposalURL(thread.name),
        },
      ],
    });

    if (process.env.ANNOUNCEMENTS_CHANNEL_ID) {
      const announcementsChannel = client.channels.cache.get(
        process.env.ANNOUNCEMENTS_CHANNEL_ID
      );
      if (
        announcementsChannel?.isTextBased() &&
        announcementsChannel instanceof NewsChannel
      ) {
        const threadURL = `https://discord.com/channels/${thread.guildId}/${thread.id}`;

        await announcementsChannel.send({
          embeds: [
            {
              title: `<:announcement:1320959837676376134> **${thread.name}**`,
              description: dedent`
                A new proposal by <@${thread.ownerId}> has been posted.
                
                Share your thoughts and be part of the action: [**Jump into the discussion!**](${threadURL})
              `,
              color: Colors.Blurple,
            },
          ],
        });
      } else {
        console.error(
          "Announcements channel not found or is not a text or news channel."
        );
      }
    }
  } catch (err) {
    console.error("Failed to create proposal:", err);

    if (
      err instanceof Error &&
      err.message.startsWith("Duplicate proposal ID:")
    ) {
      const parent = thread.parent;

      if (parent?.type === ChannelType.GuildForum) {
        const locked = parent.availableTags.find((tag) =>
          tag.name.includes("Locked")
        )?.id;

        const status = parent.availableTags
          .filter(
            (tag) => tag.name.includes("Open") || tag.name.includes("Locked")
          )
          .map((tag) => tag.id);

        if (locked) {
          const newStatus = thread.appliedTags
            .filter((id) => !status.includes(id))
            .concat(locked);

          await thread.setAppliedTags(newStatus);
        }
      }

      await thread.setLocked(true);

      await thread.send({
        embeds: [
          {
            title: "Error: Duplicate Proposal ID",
            description: dedent`
            This proposal ID is already in use. Please create a new proposal with the next available ID number.
              
            If you need assistance formatting the proposal, please do not hesitate to ask for help in the https://discord.com/channels/1320599752915681320/1320777898160029806 channel.
          `,
            color: Colors.Blurple,
          },
        ],
      });

      await unindexPost(thread);
    }
  }
});

client.on(Events.ThreadUpdate, async (_, newThread) => {
  if (!isForumThread(newThread) || !isThreadSupported(newThread)) {
    return;
  }

  try {
    await syncPost(newThread);
    baseLog("Proposal updated (%s)", newThread.id);
  } catch (err) {
    console.error("Failed to update proposal:", err);
  }
});

client.on(Events.ThreadDelete, async (thread) => {
  if (!isForumThread(thread) || !isThreadSupported(thread)) {
    return;
  }

  try {
    await deletePost(thread);
    baseLog("Proposal deleted (%s)", thread.id);
  } catch (err) {
    console.error("Failed to delete proposal:", err);
  }
});

client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
  if (newMember.user.bot) {
    return;
  }
  await syncUser(newMember.user, newMember);
});

client.on(Events.MessageCreate, async (message) => {
  if (
    message.author.bot ||
    message.channelId !== isMember.GENERAL_CHANNEL_ID ||
    !message.guild
  ) {
    return;
  }

  const content = message.content.trim().toLowerCase();
  const isExactMatch = wordlist.some(
    (forbiddenPhrase) => content === forbiddenPhrase.toLowerCase().trim()
  );

  if (isExactMatch) {
    try {
      await message.delete();
      baseLog(`Deleted exact match message from ${message.author.tag}`);
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (
    message.author.bot ||
    message.channelId !== isMember.GENERAL_CHANNEL_ID ||
    !message.guild
  )
    return;

  const messageContent = message.content.toLowerCase().trim();

  if (wordlist.includes(messageContent)) {
    return;
  }

  const user = message.author.id;
  const currentCount = isReached.get(user) || 0;

  isReached.set(user, currentCount + 1);

  if (isReached.get(user) === isMember.REQUIRED_MESSAGES) {
    try {
      const member = message.member as GuildMember;
      const role = message.guild?.roles.cache.get(isMember.MEMBER_ROLE_ID);

      if (!role) {
        console.error("Member role not found!");
        return;
      }

      if (!member.roles.cache.has(role.id)) {
        await member.roles.add(role);
      }
    } catch (error) {
      console.error("Error adding role:", error);
    }
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isMessageContextMenuCommand()) {
    ContextCommands.find(
      (command) => command.data.name === interaction.commandName
    )?.execute(interaction);
  }

  if (interaction.isChatInputCommand()) {
    SlashCommands?.find(
      (command) => command.data.name === interaction.commandName
    )?.execute(interaction);
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
