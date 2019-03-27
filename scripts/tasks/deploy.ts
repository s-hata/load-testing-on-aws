import { src, dest, series, watch } from "gulp";
import { prj } from "../project";
import * as AWS from "aws-sdk";
import * as log from "fancy-log"
import s3sync from "../plugins/gulp-s3-sync";

const _TEMPLATE_URL =
    genS3Url(prj.config.aws.bucketRegion,
             prj.config.aws.bucketName,
             "load-testing-on-aws/pipeline/root.yml");

const _OPTIONS = {
  region: prj.config.aws.region,
  credentials: new AWS.SharedIniFileCredentials({ profile: prj.config.aws.profile })
};

const _STACK_OPTION = {
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

function genS3Url(region: string, bucketName: string, path: string) {

  let prefix: string;

  switch(region) {
    case "us-east-1":
      prefix = "s3";
      break;
    case "us-east-2":
      prefix = "s3." + region;
      break;
    default:
      prefix = "s3-" + region;
      break;
  }

  return `https://${prefix}.amazonaws.com/${bucketName}/${path}`;
}

function deploy(callback) {
  const client = new AWS.CloudFormation(_OPTIONS);
  const stackName = prj.config.aws.stackName;

  client.describeStacks({ StackName: prj.config.aws.stackName })
  .promise()
  .then((result) => {
    return client.updateStack(_STACK_OPTION).promise()
  }).then((result) => {
    return client.waitFor("stackUpdateComplete", { StackName: stackName }).promise()
  }).then(result => console.log(result))
  .catch((error) => {
    if (error.statusCode === 400) {
      client.createStack(Object.assign(_STACK_OPTION, { OnFailure: "DELETE" }))
      .promise().then(result => {
        return client.waitFor("stackCreateComplete", { StackName: stackName }).promise()
      }).then(result => console.log(result))
      .catch(error => console.error(error));
    } else {
      console.error("[Error]: %s", JSON.stringify(error));
    }
  });

  callback();
};

function sync() {
  const s3 = s3sync(_OPTIONS);
  return src(prj.src.files)
    .pipe(s3.sync("showcase-template-store", "load-testing-on-aws/pipeline"))
    .pipe(s3.log())
    .on("error", (error) => {
      log.error(error);
    });
}

export {
  sync,
  deploy
}
