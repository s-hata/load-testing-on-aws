import * as fs from "fs";
import * as log from "fancy-log"
import * as through from "through2";
import * as path from "path";
import * as PluginError from "plugin-error";
import * as yaml from "js-yaml";
import chalk from "chalk";


const CFN_FUNCTIONS = {
  "Fn::Base64": {},
  "Fn::And": {
    "supportedFunctions": [
      "Fn::FindInMap",
      "Ref",
      "Fn::And",
      "Fn::Equals",
      "Fn::If",
      "Fn::Not",
      "Fn::Or",
      "Condition"
    ]
  },
  "Fn::Equals": {
    "supportedFunctions": [
      "Fn::FindInMap",
      "Ref",
      "Fn::And",
      "Fn::Equals",
      "Fn::If",
      "Fn::Not",
      "Fn::Or",
      "Condition"
    ]
  },
  "Fn::If": {
    "supportedFunctions": [
      "Fn::Base64",
      "Fn::FindInMap",
      "Fn::GetAtt",
      "Fn::GetAZs",
      "Fn::If",
      "Fn::Join",
      "Fn::Select",
      "Ref",
      "Condition"
    ]
  },
  "Fn::Not": {
    "supportedFunctions": [
      "Fn::FindInMap",
      "Ref",
      "Fn::And",
      "Fn::Equals",
      "Fn::If",
      "Fn::Not",
      "Fn::Or",
      "Condition"
    ]
  },
  "Fn::Or": {
    "supportedFunctions": [
      "Fn::FindInMap",
      "Ref",
      "Fn::And",
      "Fn::Equals",
      "Fn::If",
      "Fn::Not",
      "Fn::Or",
      "Condition"
    ]
  },
  "Fn::FindInMap": {},
  "Fn::GetAtt": {},
  "Fn::GetAZs": {},
  "Fn::ImportValue": {
    "supportedFunctions": [
      "Fn::Base64",
      "Fn::FindInMap",
      "Fn::If",
      "Fn::Join",
      "Fn::Select",
      "Fn::Split",
      "Fn::Sub",
      "Fn::Ref"
    ]
  },
  "Fn::Join": {},
  "Fn::Select": {},
  "Fn::Select::Index": {
    "supportedFunctions": [
      "Ref", "Fn::FindInMap"
    ]
  },
  "Fn::Select::List": {
    "supportedFunctions" : [
      "Fn::FindInMap",
      "Fn::GetAtt",
      "Fn::GetAZs",
      "Fn::If",
      "Fn::Split",
      "Ref"
    ]
  },
  "Fn::Split": {
    "supportedFunctions": [
      "Fn::Base64",
      "Fn::FindInMap",
      "Fn::GetAtt",
      "Fn::If",
      "Fn::Join",
      "Fn::Select",
      "Fn::ImportValue",
      "Ref",
      "Fn::Sub"
    ]
  },
  "Fn::Sub": {
    "supportedFunctions": [
      "Fn::Base64",
      "Fn::FindInMap",
      "Fn::GetAtt",
      "Fn::GetAZs",
      "Fn::If",
      "Fn::Join",
      "Fn::Select",
      "Ref"
    ]
  },
  "Ref": {}
};

export function build() {
  const yamlTypes = [];
  for (const fn in CFN_FUNCTIONS) {
    yamlTypes.push(...buildYamlTypes(fn));
  }
  return yaml.Schema.create(yaml.CORE_SCHEMA, yamlTypes);
}

export type YamlKind = 'scalar' | 'mapping' | 'sequence';
const kinds: YamlKind[] = ['scalar', 'mapping', 'sequence'];

export function buildYamlTypes(fnName: string) {
  return kinds.map((kind) => buildYamlType(fnName, kind));
}

export function buildYamlType(fnName: string, kind: YamlKind) {
    const tagName = functionTag(fnName);
    const tag = `!${tagName}`;

    const constructFn = (fnName === 'Fn::GetAtt')
        ? (data: any) => ({'Fn::GetAtt': Array.isArray(data) ? data : data.split('.')})
        : (data: any) => ({[fnName]: data});

    return new yaml.Type(tag, {
        kind,
        construct: constructFn
    });
}

export function functionTag(functionName: string) {
    const splitFunctionName = functionName.split('::');
    return splitFunctionName[splitFunctionName.length-1];
}

const _OPTION = {
  filename: "",
  schema: build(),
  onWarning: (warning) => {
    console.error(warning);
  }
};


export default (options?) => {

  const transform = (file, encoding, callback) => {
    if (file.isNull()) {
      return callback(null, file);
    }

    if (file.isStream()) {
      callback(new PluginError("gulp-cfn-formmater", "streams not supported!"));
    }

    if (file.isBuffer()) {

      try {
        const OPTION = Object.assign(_OPTION, { filename: file.path });
        console.log(yaml.safeLoad(file.contents, _OPTION));
      } catch (error) {
        log.error("[Fail] : %s", file.path);
      }
    }
    callback(null, file);
  };

  return through.obj(transform);
};
