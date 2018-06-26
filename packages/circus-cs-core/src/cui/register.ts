import * as ajv from 'ajv';
import bootstrapQueueSystem from '../bootstrapQueueSystem';
import { createItem } from '../queue/queue';

const argumentsSchema = {
  type: 'object',
  properties: {
    jobId: {
      type: 'string'
    },
    pluginId: {
      type: 'string'
    },
    seriesUid: {
      type: 'string'
    },
    environment: {
      type: 'string'
    },
    priority: {
      type: 'number'
    }
  },
  required: ['pluginId', 'seriesUid']
};

export default async function register(argv: any) {
  const argCheck = new ajv().compile(argumentsSchema)(argv);

  if (!argCheck) {
    console.error('Invalid arguments.');
    process.exit(1);
  }

  const queue = await bootstrapQueueSystem();
  try {
    const newJobId = () => new Date().getTime().toString();
    const { jobId, pluginId, seriesUid, environment, priority } = argv;
    const item = createItem(
      jobId || newJobId(),
      {
        pluginId,
        series: [{ seriesUid }],
        environment
      },
      priority
    );
    await queue.enqueue(item);
  } finally {
    queue.dispose();
  }
}
