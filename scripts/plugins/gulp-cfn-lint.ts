import * as log from "fancy-log"
import * as path from "path";
import * as through from "through2";
import * as PluginError from "plugin-error";
import * as lint from "cfn-lint";
import chalk from "chalk";

const PLUGIN_NAME = "gulp-cfn-lint";


function report(isValid: boolean, filePath: string, messages: any) {
  if (isValid) {
    log.info(chalk.green("  ✓"), chalk.grey.underline(path.relative(process.cwd(), filePath)));
  } else {
    log.info(chalk.red("  x"), chalk.red.underline(path.relative(process.cwd(), filePath)));
    for (const index in messages.crit) {
      log.error(chalk.red("      Resource: %s"), messages.crit[index].resource);
      log.error(chalk.red("      Message: %s"), messages.crit[index].message);
    }
    for (const index in messages.warn) {
      log.error(chalk.yellow("      Resource: %s"), messages.warn[index].resource);
      log.error(chalk.yellow("      Message: %s"), messages.warn[index].message);
    }
    for (const index in messages.info) {
      log.error(chalk.blue("      Resource: %s"), messages.info[index].resource);
      log.error(chalk.blue("      Message: %s"), messages.info[index].message);
    }
  }
}

export default (options?) => {

  log.info(chalk.grey("processing cfn-lint ..."));
  const _options = Object.assign(
    {},
    {
    },
    options);

  const transform = (file, encoding, callback) => {
    if (file.isNull()) {
      return callback(null, file);
    }

    if (file.isStream()) {
      callback(new PluginError(PLUGIN_NAME, "streams not supported!"));
    }

    if (file.isBuffer()) {
      const params = {
        TemplateBody: file.contents.toString(encoding)
      };

      try {
        const result = lint.validateFile(file.path);
        report(result.templateValid, file.path, result.errors);
      } catch (error) {
        report(false, file.path, { crit: [{ resource: "-", message: error }]} );
      }
    }
    callback(null, file);
  };

  return through.obj(transform);
};
