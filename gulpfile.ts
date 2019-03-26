import { src, dest, series, watch } from "gulp";
import { prj } from "./scripts/project";
import { deploy, sync } from "./scripts/tasks/deploy";
import lint from "./scripts/tasks/lint";


function live() {
  return watch(prj.src.files, series(lint, sync));
}

export default series(lint, live);
export {
  deploy,
  lint,
  sync
}
