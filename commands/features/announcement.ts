import { Client, Events, TextChannel, EmbedBuilder, Colors } from "discord.js";
import { OnStart } from "../types.js";
import { baseLog } from "../../log.js";
import "../../env.js";

const log = baseLog.extend("announcements");

export const Announcements: OnStart = async (client: Client): Promise<void> => {
  client.on(Events.MessageCreate, async (message) => {
    if (
      message.channelId !== process.env.ANNOUNCEMENTS_CHANNEL_ID ||
      message.author.bot
    )
      return;

    const member = await message.guild?.members.fetch(message.author.id);
    if (!member?.roles.cache.has(process.env.MODERATOR_ROLE_ID!)) return;

    try {
      await message.delete();

      const embed = new EmbedBuilder()
        .setTitle("<:announcements:1320959837676376134> New announcement!")
        .setDescription(message.content)
        .setColor(Colors.Blurple);

      await (message.channel as TextChannel).send({
        embeds: [embed],
      });

      log("Posted announcement from moderator %s", message.author.id);
    } catch (error) {
      console.error("Error handling 'announcement' feature:", error);
    }
  });
};
