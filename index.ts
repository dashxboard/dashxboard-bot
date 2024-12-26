import {
  ChannelType,
  Client,
  Colors,
  Events,
  GatewayIntentBits,
  GuildMember,
  Partials,
} from "discord.js";
import {
  configuration,
  isForumMessage,
  isForumThread,
  isMessageSupported,
  isReached,
  isThreadSupported,
} from "./utils.js";
import { ContextCommands } from "./commands/context/index.js";
import { SlashCommands } from "./commands/slash/index.js";
import { deleteMessage, syncMessage } from "./db/messages.js";
import { deletePost, syncPost } from "./db/posts.js";
import { addPoints, syncUser } from "./db/users.js";
import { Startup } from "./commands/types.js";
import { Features } from "./commands/features/index.js";
import { wordlist } from "./lib/wordlist.js";
import { baseLog } from "./log.js";
import { dedent } from "ts-dedent";
import "./env.js";

if (!process.env.DISCORD_BOT_TOKEN) {
  throw new Error("DISCORD_BOT_TOKEN not found!");
}

const features: Startup = {
  onStart: async (client) => {
    for (const feature of Features) {
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
  partials: [Partials.Message],
});

// ClientReady: Triggers when the bot successfully connects to Discord.
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

// MessageCreate: Triggers when a new message is created.
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

// MessageUpdate: Triggers when a message is edited.
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

// MessageDelete: Triggers when a message is deleted.
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

// ThreadCreate: Triggers when a new thread is created.
client.on(Events.ThreadCreate, async (thread) => {
  if (!isForumThread(thread) || !isThreadSupported(thread)) {
    return;
  }

  try {
    await syncPost(thread);
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
          url: `${process.env.WEB_URL}/post/${thread.id}`,
        },
      ],
    });
  } catch (err) {
    console.error("Failed to create proposal:", err);
  }
});

// ThreadUpdate: Triggers when a thread is updated.
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

// ThreadDelete: Triggers when a thread is deleted.
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

// GuildMemberUpdate: Triggers when a member's details are updated.
client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
  if (newMember.user.bot) {
    return;
  }
  await syncUser(newMember.user, newMember);
});

// MessageCreate: Triggers when at least 5 new messages are created.
client.on(Events.MessageCreate, async (message) => {
  if (
    message.author.bot ||
    message.channelId !== configuration.GENERAL_CHANNEL_ID ||
    !message.guild
  )
    return;

  const messageContent = message.content.toLowerCase().trim();

  // Skip if message matches blacklisted words.
  if (wordlist.includes(messageContent)) {
    return;
  }

  const user = message.author.id;
  const currentCount = isReached.get(user) || 0;

  isReached.set(user, currentCount + 1);

  if (isReached.get(user) === configuration.REQUIRED_MESSAGES) {
    try {
      const member = message.member as GuildMember;
      const role = message.guild?.roles.cache.get(configuration.MEMBER_ROLE_ID);

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

// InteractionCreate: Handles both context menu commands and slash commands.
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

// Dashxboard Forum Indexer is alive!
client.login(process.env.DISCORD_BOT_TOKEN);
