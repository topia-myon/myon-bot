import send from "./send.js";
import uranai from "./uranai.js";

const commands = [uranai, send] as const;
export default commands;
