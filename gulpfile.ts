process.env["NODE_PATH"] = __dirname;
require("module")._initPaths();

import { src, dest, series, watch } from "gulp";
import { prj } from "./scripts/project";
import * as env from "dotenv"
import * as log from "fancy-log"
import * as del from "del";
import * as plumber from "gulp-plumber";
import * as ts from "gulp-typescript";
import cfnLint from "./scripts/plugins/gulp-cfn-lint";
import s3sync from "./scripts/plugins/gulp-s3-sync";


// console.log(JSON.stringify(s3sync()));

env.config();

const _OPTION = {
  parameters: {
    CFnTemplateBucketName: "template-store",
    CFnTemplateBucketRegion: "us-east-1",
    KeyPairName: "test-key"
  },
  guessParameters: []
};

const _AWS_CONFIG = {
  region: "us-east-1",
  profile: "default"
};

const s3 = s3sync(_AWS_CONFIG);

export function sync() {
  return src(prj.src.files)
    .pipe(s3.sync("showcase-template-store", "load-testing-on-aws/pipeline"))
    .on("error", (error) => {
      log.error(error);
    });
}

export function lint() {
  return src(prj.src.files)
    .pipe(plumber())
    .pipe(cfnLint(_OPTION))
    .on("error", (error) => {
      log.error(error);
    });
}

function live() {
  return watch(prj.src.files, series(lint));
}

export default series(lint, live);
