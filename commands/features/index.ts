import { Announcements } from "./announcement.js";
import { Faq } from "./faq.js";
import { Feedback } from "./feedback.js";
import { Guidelines } from "./guidelines.js";
import { Help } from "./help.js";
import { Resources } from "./resources.js";
import { OnStart } from "../types.js";

export const Features: OnStart[] = [
  Announcements,
  Faq,
  Feedback,
  Guidelines,
  Help,
  Resources,
];
