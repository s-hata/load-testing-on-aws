import * as crypto from "crypto";

function genS3Url(region: string, bucketName: string, path: string) {

  return `https://${region === "us-east-1" ? "s3" : (region === "us-east-2" ? "s3." : "s3-" + region)}.amazonaws.com/${bucketName}/${path}`;
}

function genETag(contents) {

  return crypto
    .createHash("md5")
    .update(contents)
    .digest("hex");
}

export default {
  genETag: genETag,
  genS3Url: genS3Url
};
