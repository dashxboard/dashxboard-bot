import assert from "assert";
import dotenv from "dotenv";

dotenv.config();

const required = (name: string, val: string | undefined) => {
  assert(val, `${name} is not defined`);
};

const optional = (name: string, val: string | undefined) => {
  if (!val) {
    console.warn(`Warning: ${name} is not defined, some features may not work`);
  }
};

required("DISCORD_BOT_TOKEN", process.env.DISCORD_BOT_TOKEN);
required("DISCORD_CLIENT_ID", process.env.DISCORD_CLIENT_ID);
optional("DEV_GUILD_ID", process.env.DEV_GUILD_ID);
required("GENERAL_CHANNEL_ID", process.env.GENERAL_CHANNEL_ID);
required("DISCUSSIONS_CHANNEL_ID", process.env.DISCUSSIONS_CHANNEL_ID);
optional("HELP_CHANNEL_ID", process.env.HELP_CHANNEL_ID);
optional("FEEDBACK_CHANNEL_ID", process.env.FEEDBACK_CHANNEL_ID);
required("VOUCH_CHANNEL_ID", process.env.VOUCH_CHANNEL_ID);
optional("GUIDELINES_CHANNEL_ID", process.env.GUIDELINES_CHANNEL_ID);
optional("FAQ_CHANNEL_ID", process.env.FAQ_CHANNEL_ID);
optional("RESOURCES_CHANNEL_ID", process.env.RESOURCES_CHANNEL_ID);
optional("ANNOUNCEMENTS_CHANNEL_ID", process.env.ANNOUNCEMENTS_CHANNEL_ID);
required("MOD_LOG_CHANNEL_ID", process.env.MOD_LOG_CHANNEL_ID);
required("REPORTS_LOG_CHANNEL_ID", process.env.REPORTS_LOG_CHANNEL_ID);
optional("ADMINISTRATOR_ROLE_ID", process.env.ADMINISTRATOR_ROLE_ID);
optional("MODERATOR_ROLE_ID", process.env.MODERATOR_ROLE_ID);
optional("CONTRIBUTOR_ROLE_ID", process.env.CONTRIBUTOR_ROLE_ID);
required("MEMBER_ROLE_ID", process.env.MEMBER_ROLE_ID);
optional("PUBLIC_ROLE_ID", process.env.PUBLIC_ROLE_ID);
required("DATABASE_URL", process.env.DATABASE_URL);
required("WEB_URL", process.env.WEB_URL);
required("REVALIDATE_SECRET", process.env.REVALIDATE_SECRET);
