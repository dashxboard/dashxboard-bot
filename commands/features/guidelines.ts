import { Client, Colors, EmbedBuilder, TextChannel } from "discord.js";
import { OnStart } from "../types";
import { dedent } from "ts-dedent";
import "../../env.js";

const GUIDELINES = new EmbedBuilder()
  .setTitle("Guidelines and Rules")
  .setColor(Colors.Blurple)
  .setDescription(
    "Welcome to the **Dashxboard Community**! Before you dive into the conversation, please take a moment to familiarize yourself with the rules and guidelines that maintain a positive and productive environment for everyone."
  )
  .addFields({
    name: "🔹 SHx Community Guidelines",
    value:
      "The strict adherence to the **[SHx Community Guidelines](https://docs.shx.stronghold.co/community/shx-community-guidelines)** is imperative, given that this community has been established for a bounty within the **[SHx Ecosystem Development Program (EDP)](https://docs.shx.stronghold.co/)**.",
  })
  .addFields({
    name: "🔹 Discord Community Guidelines",
    value:
      "The strict adherence to the **[Discord Community Guidelines](https://discord.com/guidelines)** is essential to maintain order within our community, aligning with Discord's policies.",
  })
  .addFields({
    name: "🔹 Dashxboard Community Rules",
    value: dedent`
        → **Avoid spamming**: While greetings are acceptable, steer clear of getting caught in an endless loop of greetings.
        → **Channel Purpose**: Use each channel for its intended purpose.
        → **No Price Speculation**: Refrain from speculative price discussions.
        → **No Job Posts**: Avoid posting job offers, portfolios, etc.
        → **No AI on the forum channel**: Share your own thoughts, keep the forum free of AI-generated content and robotic (useless) chatter.
        → **Don't Ask To Ask**: Just ask. Feel free to ask your questions directly.
      `,
  })
  .setFooter({
    text: "⚠️ Adherence to the above guidelines is mandatory, violation of any of these rules will result in a permanent ban without any recourse for appeal.",
  });

async function onStartHandler(
  client: Client,
  channelID: string,
  embed: EmbedBuilder,
  feature: string
) {
  const channel = client.channels.cache.get(channelID) as TextChannel;

  if (!channel) {
    console.warn(`Channel not found, the ${feature} module will be skipped!`);
    return;
  }

  const messages = await channel.messages.fetch({ limit: 100 });
  const fromBot = messages.filter((m) => m.author.id === client.user?.id);

  if (fromBot.size === 0) {
    await channel.send({ embeds: [embed] });
  } else {
    const existingMessage = fromBot.first();
    if (existingMessage) {
      await existingMessage.edit({ embeds: [embed] });
    }
  }
}

export const Guidelines: OnStart = async (client) => {
  await onStartHandler(
    client,
    process.env.GUIDELINES_CHANNEL_ID!,
    GUIDELINES,
    "guidelines"
  );
};
