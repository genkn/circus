import { DicomFileRepository } from '@utrad-ical/circus-lib/lib/dicom-file-repository';
import Logger from '@utrad-ical/circus-lib/lib/logger/Logger';
import ServiceLoader from '@utrad-ical/circus-lib/lib/ServiceLoader';
import path from 'path';
import { Configuration } from './config/Configuration';
import createDaemonController, {
  DaemonController
} from './daemon/createDaemonController';
import { PluginJobRequest } from './interface';
import PluginJobReporter from './job/reporter/PluginJobReporter';
import { PluginJobRegisterer } from './job/registerer/createPluginJobRegisterer';
import { PluginJobRunner } from './job/pluginJobRunner';
import { MongoClientPool } from './mongoClientPool';
import Queue from './job/queue/Queue';
import PluginDefinitionAccessor from './plugin-definition-accessor/PluginDefinitionAccessor';
import { CsCore } from './createCsCore';
import DockerRunner from './util/DockerRunner';

/**
 * The list of all dependencies that can be created via ServiceLoader.
 */
export interface Services {
  logger: Logger;
  daemonController: DaemonController;
  pluginDefinitionAccessor: PluginDefinitionAccessor;
  jobReporter: PluginJobReporter;
  queue: Queue<PluginJobRequest>;
  mongoClientPool: MongoClientPool;
  dicomFileRepository: DicomFileRepository;
  pluginJobRegisterer: PluginJobRegisterer;
  jobRunner: PluginJobRunner;
  dockerRunner: DockerRunner;
  core: CsCore;
}

// Keep this module as clean and simple as possible.
// Do not try to include any business logic here!

export default function configureServiceLoader(
  config: Configuration
): ServiceLoader<Services> {
  const serviceLoader = new ServiceLoader<Services>(config as any);
  serviceLoader.registerDirectory(
    'logger',
    '@utrad-ical/circus-lib/lib/logger',
    'Log4JsLogger'
  );
  serviceLoader.registerFactory('daemonController', async config => {
    // will register as factory
    // because this needs to access the whole config content
    return createDaemonController(config as any);
  });

  // The following three services interact with database
  serviceLoader.registerDirectory(
    'pluginDefinitionAccessor',
    path.join(__dirname, 'plugin-definition-accessor'),
    'StaticPluginDefinitionAccessor'
  );
  serviceLoader.registerDirectory(
    'jobReporter',
    path.join(__dirname, 'job', 'reporter'),
    'MongoPluginJobReporter'
  );
  serviceLoader.registerDirectory('queue', './queue', 'MongoQueue');

  // Used by mongodb-related services
  serviceLoader.registerModule(
    'mongoClientPool',
    path.join(__dirname, 'createMongoClientPool')
  );

  // DICOM file repository
  serviceLoader.registerDirectory(
    'dicomFileRepository',
    '@utrad-ical/circus-lib/lib/dicom-file-repository',
    'StaticDicomFileRepository'
  );

  // Misc 'singleton' modules
  serviceLoader.registerModule(
    'pluginJobRegisterer',
    path.join(__dirname, 'job', 'createPluginJobRegisterer')
  );
  serviceLoader.registerModule(
    'jobRunner',
    path.join(__dirname, 'job', 'pluginJobRunner')
  );
  serviceLoader.registerModule(
    'dockerRunner',
    path.join(__dirname, 'util', 'DockerRunner')
  );

  // "the facade"
  serviceLoader.registerModule('core', path.join(__dirname, 'createCsCore'));

  return serviceLoader;
}
