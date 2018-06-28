import createDaemonController from './functions/createDaemonController';
import config from './config';
import { QueueSystem, craeteMongoQueue } from './queue/queue';
import { PluginJobRequest } from './interface';
import * as mongo from 'mongodb';
import pluginJobRunner, { PluginJobRunner } from './job/pluginJobRunner';
import DockerRunner from './util/DockerRunner';
import pluginJobReporter from './job/pluginJobReporter';
import StaticDicomFileRepository from './dicom-file-repository/StaticDicomFileRepository';

export function bootstrapDaemonController() {
  const startOptions = config.daemon.startOptions;
  const controller = createDaemonController(startOptions);
  return controller;
}

interface QueueSystemData {
  queue: QueueSystem<PluginJobRequest>;
  dispose: () => Promise<void>;
}

/**
 * Creates a MonboDB-based queue system based on the configuration.
 */
export async function bootstrapQueueSystem(): Promise<QueueSystemData> {
  const client = await mongo.MongoClient.connect(config.queue.mongoUrl);
  const collection = client.db().collection(config.queue.collectionName);
  const queue = await craeteMongoQueue<PluginJobRequest>({ collection });
  return {
    queue,
    dispose: () => client.close()
  };
}

/**
 * Creates a job runner based on the current configuration.
 */
export async function bootstrapJobRunner(): Promise<PluginJobRunner> {
  const dockerRunner = new DockerRunner(config.docker);
  const jobReporter = pluginJobReporter(config.jobReporter);
  const dicomRepository = new StaticDicomFileRepository(
    config.dicomFileRepository
  );
  const jobRunner = pluginJobRunner({
    jobReporter,
    dockerRunner,
    dicomRepository,
    pluginList: config.pluginList,
    workingDirectory: config.pluginWorkingDir
  });
  return jobRunner;
}
