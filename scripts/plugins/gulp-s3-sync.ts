import * as Stream from "stream";
import * as Vinyl from "vinyl";
import * as path from "path";
import * as xmlNodes from "xml-nodes";
import * as xmlObjects from "xml-objects";
import * as pumpify from "pumpify";
import * as through from "through2";

import * as AWS from "aws-sdk";

function buildDeleteMultiple(bucket, keys) {
  if (!keys || !keys.length) return;

  var deleteObjects = keys.map(function(k) {
    return { Key: k };
  });

  return {
    Bucket: bucket,
    Delete: {
      Objects: deleteObjects
    }
  };
}

function converter(nodeFilter) {
  const nodes = xmlNodes(nodeFilter);
  const objects = xmlObjects({
    explicitRoot: false,
    explicitArray: false,
    mergeAttrs: true
  });
  return pumpify.obj(nodes, objects);
}

class S3sync {

  private client: AWS.S3;

  constructor(options?) {
    this.client = new AWS.S3({
      region: options.region,
      credentials: new AWS.SharedIniFileCredentials({ profile: options.profile })
    });
  }

  sync(bucket, prefix = "") {
    const s = new Stream.Transform({ objectMode: true })
    let currentFiles = {};
    currentFiles[ prefix + "/" ] = true;

    s._transform = (file, encoding, cb) => {
      currentFiles[ path.join(prefix, path.basename(file.path)) ] = true;
      Object.assign(file, { s3: { path: path.join(prefix, path.basename(file.path)) ,state: "uploaded", etag: "dummy" } });
      s.push(file);
      this.client.putObject({
        Bucket: bucket,
        Key: path.join(prefix, path.basename(file.path)),
        Body: file.contents
      }).promise().then(result => {
        // console.log(result);
      });
      cb();
    };

    s._flush = (cb) => {
      const c = this.client;
      let toPut= [];
      let toDelete = [];
      const lister = c
        .listObjects({ Bucket: bucket, Prefix: prefix })
        .createReadStream()
        .pipe(converter("Key"));

      lister.on('data', (key) => {
        let deleteFile;
        if (currentFiles[key]) return;
        deleteFile = new Vinyl({});
        deleteFile.s3 = {
          path: key,
          state: 'delete',
          headers: {}
        };
        s.push(deleteFile);
        toDelete.push(key);
      });

      lister.on('end', function() {
        if (!toDelete.length) return cb();
        c.deleteObjects(buildDeleteMultiple(bucket, toDelete), cb);
      });
    };

    return s;
  }

  log() {
    const transform = (file, encoding, callback) => {
      if (file instanceof Vinyl) {
        console.log("Path: %s [%s]", file.s3.path, file.s3.state);
      }
      callback();
    };

    return through.obj(transform);
  }
}

export default (options?) => {
  return new S3sync(options);
};
