import { Feedback } from "./feedback.js";
import { Help } from "./help.js";
import { Startup } from "./startup.js";
import { Pause } from "./pause.js";
import { Features } from "../types.js";

export const onStartup: Features[] = [Feedback, Help, Pause, Startup];
