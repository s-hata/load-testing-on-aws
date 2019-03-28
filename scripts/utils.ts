import * as crypto from "crypto";

function genETag(contents) {

  return crypto
    .createHash("md5")
    .update(contents)
    .digest("hex");
}

export default {
  genETag: genETag
};
