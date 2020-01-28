import DockerRunner from '@utrad-ical/circus-cs-core/src/util/DockerRunner';
import { ValidationError } from 'ajv';
import inquirer from 'inquirer';
import { DisposableDb } from '../db/connectDb';
import { Models } from '../db/createModels';
import Command from './Command';
import { Validator } from '../createValidator';

export const help = () => {
  return (
    'Registers a new CAD plug-in.\n' +
    'The plug-in must be already loaded as a Docker image,\n' +
    'and the image must contain a plugin manifest file.\n\n' +
    'Usage: node circus.js register-cad-plugin DOCKER_IMAGE_ID'
  );
};

export const command: Command<{
  db: DisposableDb;
  validator: Validator;
  models: Models;
}> = async (opts, { db, validator, models }) => {
  return async (options: any) => {
    await db
      .collection('pluginDefinitions')
      .createIndex({ pluginId: 1 }, { unique: true });

    const { _args: imageIds } = options;
    if (!imageIds.length) {
      throw new Error('Specify a plugin ID (Docker image hash).');
    }
    if (imageIds.length > 1) {
      throw new Error('You cannot install more than one plug-in at a time.');
    }
    const pluginId = imageIds[0];

    if (!/^[a-z0-9]{64}$/.test(pluginId)) {
      throw new Error('The plug-in ID must be 64-char hex string.');
    }

    if (await models.plugin.findById(pluginId)) {
      throw new Error('This plug-in is already installed.');
    }

    const runner = new DockerRunner();
    const manifestText = await runner.loadFromTextFile(
      pluginId,
      '/plugin.json'
    );

    const manifest = JSON.parse(manifestText!);

    try {
      await validator.validate(
        'plugin' +
          '|only pluginName,version,description,icon,displayStrategy' +
          '|allRequiredExcept icon,displayStrategy',
        manifest
      );
    } catch (err) {
      if (err instanceof ValidationError) {
        console.error('Manifest file error.');
        throw err;
      }
    }

    const data = {
      pluginId,
      pluginName: manifest.pluginName,
      version: manifest.version,
      description: manifest.description || '',
      icon: manifest.icon,
      displayStrategy: manifest.displayStrategy,
      runConfiguration: { timeout: 900, gpus: '' }
    };

    const existing = await models.plugin.findAll({
      pluingName: manifest.pluginName,
      version: manifest.version
    });
    if (existing.length) {
      throw new Error(
        'There is a plugin registered with the same name and the same version.'
      );
    }

    console.log('\n', data, '\n');

    const confirm = await inquirer.prompt([
      { type: 'confirm', name: 'ok', message: 'Is this OK?' }
    ]);
    if (!confirm.ok) return;

    const doc = {
      type: 'CAD',
      icon: {
        glyph: 'calc',
        color: '#ffffff',
        backgroundColor: '#008800'
      },
      displayStrategy: [],
      ...data
    };
    await models.plugin.insert(doc);
    console.log(`Registered ${doc.pluginName} v${doc.version}`);
  };
};

command.dependencies = ['db', 'validator', 'models'];