import { KyselyDB, TransactionDB, db, sql } from "@dashxboard/db";
import { type CacheUser, usersCache } from "../lib/cache.js";
import { AnimalModule, Faker, en } from "@faker-js/faker";
import { POINTS, REQUIRED } from "../lib/reputation.js";
import { GuildMember, User } from "discord.js";
import { baseLog } from "../log.js";
import "../env.js";

const log = baseLog.extend("users");

const getAvatar = (n: number) =>
  `https://cdn.discordapp.com/embed/avatars/${n}.png`;

const animals: Array<keyof AnimalModule> = [
  "bear",
  "bird",
  "cat",
  "cetacean",
  "cow",
  "crocodilia",
  "dog",
  "fish",
  "horse",
  "insect",
  "lion",
  "rabbit",
  "rodent",
  "snake",
];

const getPublic = (userID: string, user: CacheUser) => {
  const cachedUser = usersCache.get(userID);
  if (!cachedUser) return true;
  if (cachedUser.public !== user.public) return true;
  if (cachedUser.isModerator !== user.isModerator) return true;
  if (user.public) {
    if (cachedUser.username !== user.username) return true;
    if (cachedUser.discriminator !== user.discriminator) return true;
    if (cachedUser.avatar !== user.avatar) return true;
  }
  return false;
};

export const syncUser = async (user: User, asGuildMember?: GuildMember) => {
  let isPublic = false;
  let isModerator = false;

  if (asGuildMember) {
    if (process.env.PUBLIC_ROLE_ID) {
      isPublic = asGuildMember.roles.cache.has(process.env.PUBLIC_ROLE_ID);
    }
    if (process.env.MODERATOR_ROLE_ID) {
      isModerator = asGuildMember.roles.cache.has(
        process.env.MODERATOR_ROLE_ID
      );
    }
  }

  let username = asGuildMember?.displayName || user.displayName;
  let discriminator = user.discriminator;
  let avatar =
    asGuildMember?.displayAvatarURL({ size: 256 }) ||
    user.displayAvatarURL({ size: 256 });

  const checkUser: CacheUser = {
    username,
    discriminator,
    avatar,
    public: isPublic,
    isModerator,
  };

  if (!getPublic(user.id, checkUser)) return;

  if (!isPublic) {
    const faker = new Faker({ locale: en });
    faker.seed(user.id.split("").map(Number));
    const setType = faker.helpers.arrayElement(animals);
    const setName = faker.animal[setType]();

    username = setName;
    discriminator = faker.string.numeric(4);
    avatar = getAvatar(faker.number.int({ min: 0, max: 5 }));
  }

  await db
    .insertInto("users")
    .values({
      snowflake: user.id,
      public: isPublic,
      moderator: isModerator,
      username,
      discriminator,
      avatar,
    })
    .onConflict((onconflict) =>
      onconflict.column("snowflake").doUpdateSet({
        public: isPublic,
        moderator: isModerator,
        username,
        discriminator,
        avatar,
      })
    )
    .executeTakeFirst();

  log("Synced user (%)", user.id);
  usersCache.set(user.id, checkUser);
};

export const getUser = (id: string) => {
  return db
    .selectFrom("users")
    .select(["username", "reputation"])
    .where("snowflake", "=", id)
    .executeTakeFirst();
};

const updateReputation = async (
  user: string,
  value: number,
  transaction: TransactionDB | KyselyDB = db
) => {
  await transaction
    .updateTable("users")
    .where("snowflake", "=", user)
    .set((builder) => ({
      reputation: sql`LEAST(999999, ${builder.ref("reputation")} + ${value})`,
    }))
    .execute();
};

const updateReputationSet = async (
  user: string,
  value: number,
  transaction: TransactionDB | KyselyDB = db
) => {
  await transaction
    .updateTable("users")
    .where("snowflake", "=", user)
    .set({
      reputation: sql`LEAST(999999, ${value})`,
    })
    .execute();
};

export const addPoints = async (
  user: string,
  type: keyof typeof POINTS,
  transaction: TransactionDB | KyselyDB = db
) => updateReputation(user, POINTS[type], transaction);

export const substractPoints = async (
  user: string,
  type: keyof typeof POINTS,
  transaction: TransactionDB | KyselyDB = db
) => updateReputation(user, -POINTS[type], transaction);

export const addFullPoints = async (
  user: string,
  transaction: TransactionDB | KyselyDB = db
) => updateReputationSet(user, REQUIRED, transaction);

export const removeFullPoints = async (
  user: string,
  transaction: TransactionDB | KyselyDB = db
) => updateReputationSet(user, 0, transaction);

export const givePoints = async (
  user: string,
  value: number,
  transaction: TransactionDB | KyselyDB = db
) => updateReputation(user, value, transaction);

export const removePoints = async (
  user: string,
  value: number,
  transaction: TransactionDB | KyselyDB = db
) => updateReputation(user, -value, transaction);

export const upvote = async (
  user: string,
  type: keyof typeof POINTS,
  transaction: TransactionDB | KyselyDB = db
) => updateReputation(user, POINTS[type], transaction);

export const getReputation = (user: string) => {
  return db
    .selectFrom("users")
    .where("snowflake", "=", user)
    .select(["reputation"])
    .executeTakeFirst();
};

export const assignTemporaryRole = async (
  member: GuildMember,
  role: string,
  duration: number
) => {
  await member.roles.add(role);

  setTimeout(async () => {
    try {
      if (member.roles.cache.has(role)) {
        await member.roles.remove(role);
      }
    } catch (error) {
      console.error("Error removing temporary role:", error);
    }
  }, duration);
};
