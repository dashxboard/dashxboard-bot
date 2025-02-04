import { GuildMember } from "discord.js";
import { getUser } from "../db/users.js";
import { LRUCache } from "lru-cache";
import "../env.js";

export const POINTS = {
  message: 1,
  proposal: 1,
  remind: 1,
  upvote: 1,
  vouch: 1,
} as const;

export const REQUIRED = 1;

const SYNC_INTERVAL = 1000 * 60 * 60;
const lastUserSync = new LRUCache<string, number>({ max: 100 });

export const grantRole = async (
  member: GuildMember,
  skipCache: boolean = false
) => {
  if (!process.env.CONTRIBUTOR_ROLE_ID) return;

  const lastSync = lastUserSync.get(member.id);
  if (!skipCache && lastSync && Date.now() - lastSync < SYNC_INTERVAL) {
    return;
  }

  lastUserSync.set(member.id, Date.now());

  const user = await getUser(member.id);
  if (!user) return;

  const enoughReputation = user.reputation >= REQUIRED;
  const hasRole = member.roles.cache.has(process.env.CONTRIBUTOR_ROLE_ID);

  if (hasRole && enoughReputation) return;
  if (!hasRole && !enoughReputation) return;

  if (hasRole && !enoughReputation) {
    await member.roles.remove(process.env.CONTRIBUTOR_ROLE_ID);
    return;
  }

  await member.roles.add(process.env.CONTRIBUTOR_ROLE_ID);
};
