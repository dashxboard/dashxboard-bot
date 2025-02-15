import * as add from "./add.js";
import * as get from "./get.js";
import * as give from "./give.js";
import * as issue from "./issue.js";
import * as lock from "./lock.js";
import * as remind from "./remind.js";
import * as remove from "./remove.js";
import * as revoke from "./revoke.js";
import * as vouch from "./vouch.js";

export const SlashCommands = [
  add.command,
  get.command,
  give.command,
  issue.command,
  lock.command,
  remind.command,
  remove.command,
  revoke.command,
  vouch.command,
];
