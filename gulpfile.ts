process.env["NODE_PATH"] = __dirname;
require("module")._initPaths();

import { src, dest, series, watch } from "gulp";
import { prj } from "./scripts/project";
import * as del from "del";
import lint from "./scripts/tasks/lint";
import { deploy, sync } from "./scripts/tasks/deploy";


function live() {
  return watch(prj.src.files, series(lint, sync));
}

export default series(lint, live);
export const publish = deploy;
