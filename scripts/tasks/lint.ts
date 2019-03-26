import { src, dest, series, watch } from "gulp";
import { prj } from "../project";
import * as log from "fancy-log"
import * as plumber from "gulp-plumber";
import cfnLint from "../plugins/gulp-cfn-lint";


const _CFN_LINT_OPTION = {
  parameters: {
    CFnTemplateBucketName: "template-store",
    CFnTemplateBucketRegion: "us-east-1",
    KeyPairName: "test-key"
  },
  guessParameters: []
};

function _cfnLint() {
  return src(prj.src.files)
    .pipe(plumber())
    .pipe(cfnLint(_CFN_LINT_OPTION))
    .on("error", (error) => {
      log.error(error);
    });
};

const lint = series(_cfnLint);

export default lint;
