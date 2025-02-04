declare namespace NodeJS {
  interface ProcessEnv {
    DISCORD_BOT_TOKEN: string;
    DISCORD_CLIENT_ID: string;
    DEV_GUILD_ID: string;
    GENERAL_CHANNEL_ID: string;
    DISCUSSIONS_CHANNEL_ID: string;
    HELP_CHANNEL_ID: string;
    FEEDBACK_CHANNEL_ID: string;
    VOUCH_CHANNEL_ID: string;
    GUIDELINES_CHANNEL_ID: string;
    FAQ_CHANNEL_ID: string;
    RESOURCES_CHANNEL_ID: string;
    ANNOUNCEMENTS_CHANNEL_ID: string;
    MOD_LOG_CHANNEL_ID: string;
    REPORTS_LOG_CHANNEL_ID: string;
    ADMINISTRATOR_ROLE_ID: string;
    MODERATOR_ROLE_ID: string;
    CONTRIBUTOR_ROLE_ID: string;
    MEMBER_ROLE_ID: string;
    PUBLIC_ROLE_ID: string;
    DATABASE_URL: string;
    WEB_URL: string;
    REVALIDATE_SECRET: string;
  }
}

export {};
