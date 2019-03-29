import { src, dest, series, watch } from "gulp";
import { prj } from "../project";
import * as log from "fancy-log"
import * as plumber from "gulp-plumber";
import _cfnLint from "../plugins/gulp-cfn-lint";
import _cfnFormatter from "../plugins/gulp-cfn-formatter";


const _CFN_LINT_OPTION = {
  parameters: {
    CFnTemplateBucketName: "template-store",
    CFnTemplateBucketRegion: "us-east-1",
    KeyPairName: "test-key"
  },
  guessParameters: []
};

function cfnLint() {
  return src(prj.src.files)
    .pipe(plumber())
    .pipe(_cfnFormatter())
    .pipe(_cfnLint(_CFN_LINT_OPTION))
    .on("error", (error) => {
      log.error(error);
    });
};

const lint = series(cfnLint);

export default lint;
