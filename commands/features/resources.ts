import { Client, Colors, EmbedBuilder, TextChannel } from "discord.js";
import { OnStart } from "../types";
import { dedent } from "ts-dedent";
import "../../env.js";

const RESOURCES_DASHXBOARD = new EmbedBuilder()
  .setTitle("Dashxboard")
  .setColor(Colors.Blurple)
  .setDescription("Official Dashxboard Links")
  .addFields({
    name: "Links, resources, and more:",
    value: dedent`
        → **Website**: https://dashxboard.com/
        → **Discord Community**: https://discord.gg/eJhzDbKbdj
        → **GitHub Code Repository**: https://github.com/dashxboard/
    `,
  });

const RESOURCES_STRONGHOLD = new EmbedBuilder()
  .setTitle("Stronghold")
  .setColor(Colors.Blurple)
  .setDescription("Official Stronghold links")
  .addFields({
    name: "Links, resources, and more:",
    value: dedent`
        → **Website**: https://stronghold.co
        → **SHx Whitepaper**: https://docsend.com/view/dftxunt
        → **SHx Governance Documentation**: https://docs.shx.stronghold.co/
        → **SHx Governance Voting Page (Stellar)**: https://vote.stronghold.co/
        → **SHx Governance Voting Page (Ethereum)**: https://snapshot.box/#/s:strongholdco.eth
        → **Discord Community**: https://discord.gg/strongholdpay
        → **X (Twitter)**: https://twitter.com/strongholdpay
        → **YouTube Channel**: https://www.youtube.com/Strongholdpay
        → **SHx Asset Trustline (Stellar)**: GDSTRSHXHGJ7ZIVRBXEYE5Q74XUVCUSEKEBR7UCHEUUEK72N7I7KJ6JH
        → **SHx Token Contract (Ethereum)**: 0xee7527841a932d2912224e20a405e1a1ff747084
    `,
  })
  .setFooter({
    text: "❓ Is there a resource missing that could benefit the community? Feel free to request its addition!",
  });

async function onStartHandler(
  client: Client,
  channelID: string,
  embeds: EmbedBuilder[],
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
    await channel.send({ embeds: embeds });
  } else {
    const existingMessage = fromBot.first();
    if (existingMessage) {
      await existingMessage.edit({ embeds: embeds });
    }
  }
}

export const Resources: OnStart = async (client) => {
  await onStartHandler(
    client,
    process.env.RESOURCES_CHANNEL_ID!,
    [RESOURCES_STRONGHOLD, RESOURCES_DASHXBOARD],
    "resources"
  );
};
