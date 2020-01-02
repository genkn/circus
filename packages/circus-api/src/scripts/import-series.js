import glob from 'glob-promise';
import * as path from 'path';
import chalk from 'chalk';
import * as fs from 'fs-extra';
import connectDb from '../db/connectDb';
import createValidator from '../createValidator';
import createModels from '../db/createModels';
import DicomImporter from '../DicomImporter';
import {
  StaticDicomFileRepository,
  MemoryDicomFileRepository
} from '@utrad-ical/circus-lib/lib/dicom-file-repository';

export function help(optionText) {
  console.log('Imports DICOM series from file/directory.\n');
  console.log(
    'Usage: node circus.js import-series --domain=DOMAIN [target...]'
  );
  console.log(optionText);
}

export function options() {
  return [
    {
      names: ['domain', 'd'],
      help: 'Import domain.',
      helpArg: 'DOMAIN',
      type: 'string'
    }
  ];
}

function bootstrapDicomImporter(models) {
  const dicomPath = process.env.CIRCUS_DICOM_DIR;
  const dicomRepository = dicomPath
    ? new StaticDicomFileRepository({ dataDir: dicomPath })
    : new MemoryDicomFileRepository({});

  return new DicomImporter(dicomRepository, models, {
    utility: process.env.DICOM_UTILITY
  });
}

async function importSeries(db, files, domain) {
  const validator = await createValidator();
  const models = createModels(db, validator);
  const importer = bootstrapDicomImporter(models);

  const paths = files.map(p => path.resolve(process.cwd(), p));
  if (!paths.length) {
    console.log(chalk.red('No file or directory specified.'));
    return;
  }

  let count = 0;
  for (const pathArg of paths) {
    let stat;
    try {
      stat = await fs.stat(pathArg);
    } catch (err) {
      const message =
        err.code === 'ENOENT'
          ? `${pathArg} is not a file nor a directory.`
          : `Error while trying to access ${pathArg}.`;
      console.error(chalk.red(message));
      continue;
    }
    let files;
    if (stat.isFile()) {
      files = [pathArg];
    } else if (stat.isDirectory()) {
      files = await glob(path.join(pathArg, '**/*.dcm'));
    }
    for (const file of files) {
      console.log(`Importing: ${file}`);
      await importer.importFromFile(file, domain);
      count++;
    }
  }
  console.log(chalk.green('Import finished.'));
  console.log(`Imported ${count} file(s).`);
}

export async function exec(options) {
  let db, dbConnection;

  const domain = options.domain;
  if (!domain) throw new Error('Domain must be specified.');

  const files = options._args;
  if (!files.length) throw new Error('Import target must be specified.');

  try {
    ({ db, dbConnection } = await connectDb());
    await importSeries(db, files, domain);
  } catch (err) {
    console.error(err);
  } finally {
    if (db) await dbConnection.close();
  }
}
