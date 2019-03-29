import { src, dest, series, watch } from "gulp";
import { prj } from "../project";
import * as AWS from "aws-sdk";
import * as log from "fancy-log"
import s3sync from "../plugins/gulp-s3-sync";
import Utils from "../utils";

const _TEMPLATE_URL =
  Utils.genS3Url(prj.config.aws.bucketRegion,
  prj.config.aws.bucketName,
  "load-testing-on-aws/pipeline/root.yml");

const _OPTIONS = {
  region: prj.config.aws.region,
  credentials: new AWS.SharedIniFileCredentials({ profile: prj.config.aws.profile })
};

const _PARAMETERS = {
  StackName: prj.config.aws.stackName,
  Capabilities: [
    "CAPABILITY_NAMED_IAM",
    "CAPABILITY_AUTO_EXPAND"
  ],
  Parameters: [
    {
      ParameterKey: "CFnTemplateBucketName",
      ParameterValue: prj.config.aws.bucketName
    },
    {
      ParameterKey: "CFnTemplateBucketRegion",
      ParameterValue: prj.config.aws.bucketRegion
    }
  ],
  TemplateURL: _TEMPLATE_URL 
}

const client = new AWS.CloudFormation(_OPTIONS);

function updateStack(stackName: string, callback) {
  client.updateStack(_PARAMETERS).promise()
  .then(response => {
    return client.waitFor("stackUpdateComplete", { StackName: stackName }).promise()
  }).then(response => {
    log.info(response)
    callback();
  }).catch(error => {
    log.error(error)
    callback();
  });
}

function createStack(stackName: string, callback) {
  client.createStack(Object.assign(_PARAMETERS, { OnFailure: "DELETE" })).promise()
  .then(response => {
    return client.waitFor("stackCreateComplete", { StackName: stackName }).promise()
  }).then(response => {
    log.info(response)
    callback();
  }).catch(error => {
    log.error(error)
    callback();
  });
}

function deploy(callback) {

  const stackName = prj.config.aws.stackName;

  client.describeStacks({ StackName: prj.config.aws.stackName }).promise()
  .then(response => {
    updateStack(stackName, callback);
  }).catch(error => {
    if (error && [400].indexOf(error.statusCode)) {
      createStack(stackName, callback);
    } else {
      log.error("[Error]: %s", JSON.stringify(error));
      callback();
    }
  });
};

function sync() {
  const s3 = s3sync(_OPTIONS);
  return src(prj.src.files)
    .pipe(s3.sync(prj.config.aws.bucketName, "load-testing-on-aws/pipeline"))
    .pipe(s3.log())
    .on("error", (error) => {
      log.error(error);
    });
}

export {
  sync,
  deploy
}
