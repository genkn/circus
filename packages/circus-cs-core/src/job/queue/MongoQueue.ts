import Queue, { QueueState, Item } from './Queue';
import { FunctionService } from '@utrad-ical/circus-lib';
import { MongoClientPool } from '../../mongoClientPool';
import { PluginJobRequest } from '../../interface';

const createMongoQueue: FunctionService<
  Queue<PluginJobRequest>,
  { mongoClientPool: MongoClientPool }
> = async (options: any, { mongoClientPool }) => {
  const connection = await mongoClientPool.connect(options.mongoUrl);
  const collection = await connection.db().collection(options.collectionName);
  await collection.createIndex({ jobId: 1 }, { unique: true });

  const list = async function(state: QueueState | 'all' = 'wait') {
    const statusFilter = state === 'all' ? {} : { state };
    return await collection
      .find(statusFilter, { sort: { priority: -1, _id: 1 } })
      .toArray();
  };

  const enqueue = async (
    jobId: string,
    payload: PluginJobRequest,
    priority: number = 0
  ) => {
    const item: Item<PluginJobRequest> = {
      jobId,
      state: 'wait',
      payload,
      createdAt: new Date(),
      updatedAt: new Date(),
      startedAt: null,
      priority
    };
    const { insertedId } = await collection.insertOne(item);
    return insertedId.toString();
  };

  const dequeue = async () => {
    const result = (await collection.findOneAndUpdate(
      { state: 'wait' },
      { $set: { state: 'processing', startedAt: new Date() } },
      { sort: { priority: -1, _id: 1 }, returnOriginal: false }
    )).value as Item<PluginJobRequest> | null;
    return result;
  };

  const settle = async (jobId: string) => {
    const result = await collection.findOneAndDelete({
      jobId,
      state: 'processing'
    });
    if (!result.value)
      throw new Error('Tried to mark a job as done before it gets started.');
  };

  return { list, enqueue, dequeue, settle };
};

createMongoQueue.dependencies = ['mongoClientPool'];

export default createMongoQueue;