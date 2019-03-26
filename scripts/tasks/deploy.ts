import { src, dest, series, watch } from "gulp";
import { prj } from "../project";
import * as AWS from "aws-sdk";
import * as log from "fancy-log"
import s3sync from "../plugins/gulp-s3-sync";


const _AWS_CONFIG = {
  region: "us-east-1",
  profile: "default"
};

const s3 = s3sync(_AWS_CONFIG);

export function deploy(callback) {
  const client = new AWS.CloudFormation({
    region: _AWS_CONFIG.region,
    credentials: new AWS.SharedIniFileCredentials({ profile: _AWS_CONFIG.profile })
  });
  client.describeStacks({
    StackName: "load-testing"
  }).promise().then((result) => {
    console.log(result);
    client.updateStack({
      StackName: "load-testing",
      Capabilities: [
        "CAPABILITY_NAMED_IAM",
        "CAPABILITY_AUTO_EXPAND"
      ],
      Parameters: [
        {
          ParameterKey: "CFnTemplateBucketName",
          ParameterValue: "showcase-template-store"
        },
        {
          ParameterKey: "CFnTemplateBucketRegion",
          ParameterValue: "us-east-1"
        }
      ],
      TemplateURL: "https://s3.amazonaws.com/showcase-template-store/load-testing-on-aws/pipeline/root.yml"
    }).promise().then(result => {
      return client.waitFor('stackUpdateComplete', { StackName: 'load-testing' }).promise().then(result => console.log(result) );
    });
  }).catch((error) => {
    if (error.statusCode === 400) {
      client.createStack({
        StackName: "load-testing",
        Capabilities: [
          "CAPABILITY_NAMED_IAM",
          "CAPABILITY_AUTO_EXPAND"
        ],
        OnFailure: "DELETE",
        Parameters: [
          {
            ParameterKey: "CFnTemplateBucketName",
            ParameterValue: "showcase-template-store"
          },
          {
            ParameterKey: "CFnTemplateBucketRegion",
            ParameterValue: "us-east-1"
          }
        ],
        TemplateURL: "https://s3.amazonaws.com/showcase-template-store/load-testing-on-aws/pipeline/root.yml"
      }).promise().then(result => {
        return client.waitFor('stackCreateComplete', { StackName: 'load-testing' }).promise().then(result => console.log(result) );
      });
    } else {
      console.error("[Error]: %s", JSON.stringify(error));
    }
  });
  callback();
};

export function sync() {
  return src(prj.src.files)
    .pipe(s3.sync("showcase-template-store", "load-testing-on-aws/pipeline"))
    .on("error", (error) => {
      log.error(error);
    });
}
