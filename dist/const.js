import path from "path";
export const ASSETS = path.resolve(path.dirname(import.meta.url.replace("file://", "")), "..", "assets");
