import { ContextCommands } from "./commands/context/index.js";
import { SlashCommands } from "./commands/slash/index.js";
import { REST, Routes } from "discord.js";
import "./env.js";

const isDev = process.env.DEV === "true";
const guildID = process.env.DEV_GUILD_ID;

if (isDev && !guildID) {
  throw new Error(
    "DEV_GUILD_ID environment variable needs to be set to register commands in developement environment."
  );
}

const commands = [
  ...SlashCommands.map((file) => file.data.toJSON()),
  ...ContextCommands.map((file) => file.data.toJSON()),
];

const rest = new REST({ version: "10" }).setToken(
  process.env.DISCORD_BOT_TOKEN!
);

console.log(`Started refreshing ${commands.length} application commands.`);

const data = (await rest.put(
  isDev
    ? Routes.applicationGuildCommands(
        process.env.DISCORD_CLIENT_ID!,
        guildID ?? ""
      )
    : Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!),
  { body: commands }
)) as unknown[];

console.log(`Successfully reloaded ${data.length} application commands.`);
