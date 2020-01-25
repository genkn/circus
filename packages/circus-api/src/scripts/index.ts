import dashdash from 'dashdash';
import fs from 'fs';
import path from 'path';
import glob from 'glob-promise';
import chalk from 'chalk';
import Command, { CommandFunc } from './Command';
import createServiceLoader from '../createServiceLoader';

const packageFile = path.join(__dirname, '../../package.json');
const version = JSON.parse(fs.readFileSync(packageFile, 'utf8')).version;

const [, , commandName, ...argv] = process.argv;

interface CommandModule {
  options?: () => object[];
  help: () => string;
  command: Command<any>;
}

const prepareLoader = () => {
  const resolve = (p: string) => path.resolve(path.dirname(__dirname), p);
  const dicomPath = resolve(process.env.CIRCUS_DICOM_DIR || './store/dicom');
  const pluginResultsPath = resolve(
    process.env.CIRCUS_PLUGIN_RESULTS_DIR || './store/plugin-results'
  );
  const blobPath = resolve(process.env.CIRCUS_API_BLOB_DIR || './store/blobs');
  const createLoaderOptions = { pluginResultsPath, dicomPath, blobPath };
  return createServiceLoader(createLoaderOptions);
};

const importCommand = async (moduleName: string) => {
  const modulePath = path.join(__dirname, `${moduleName}.ts`);
  return require(modulePath) as CommandModule;
};

const main = async () => {
  const commandFiles = (await glob(path.join(__dirname, '*.ts'))).filter(
    name => !/(index|Command)\.ts$/.test(name)
  );
  const commands = commandFiles.map(p => path.basename(p, '.ts'));

  const printUsage = () => {
    console.log('Usage: circus [command]\n');
    console.log('Available commands:');
    commands.forEach(command => console.log('  ' + command));
    console.log('  help [command]');
  };

  console.log(chalk.yellow(`CIRCUS-API CLI version ${version}\n`));
  if (commands.indexOf(commandName) >= 0) {
    const module = await importCommand(commandName);
    try {
      const options = module.options ? module.options() : [];
      const parser = dashdash.createParser({ options });
      const opts = parser.parse(process.argv.slice(1)) as object;

      const loader = await prepareLoader();
      const commandService = await module.command;
      loader.register('theCommand', commandService);
      const commandFunc = (await loader.get('theCommand')) as CommandFunc;
      try {
        await commandFunc(opts);
      } finally {
        await loader.dispose();
      }
    } catch (err) {
      console.error(chalk.red('ERROR:'));
      console.error(err.message);
      err.errors && console.error(err.errors);
      err.stack && console.error(err.stack);
    }
  } else if (commandName === 'help') {
    const targetCommand = argv[0];
    if (commands.indexOf(targetCommand) >= 0) {
      const module = await importCommand(targetCommand);
      const options = module.options ? module.options() : [];
      const parser = dashdash.createParser({ options });
      const helpText = module.help();
      console.log(helpText);
      const optionText =
        options.length > 0 ? '\nOptions:\n' + parser.help({ indent: 2 }) : '';
      console.log(optionText);
    } else {
      if (targetCommand) {
        console.error('No help for ' + targetCommand);
      } else {
        printUsage();
      }
    }
  } else {
    if (commandName) {
      console.error('No command named ' + commandName);
      process.exit(1);
    } else {
      printUsage();
    }
  }
};

main();
