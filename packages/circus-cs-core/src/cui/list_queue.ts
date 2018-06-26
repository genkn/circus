import * as ajv from 'ajv';
import bootstrapQueueSystem from '../bootstrapQueueSystem';
import { QueueState } from '../queue/queue';

const argumentsSchema = {
  type: 'object',
  properties: {
    w: {
      // wait (default)
      type: 'boolean'
    },
    p: {
      // processing
      type: 'boolean'
    },
    e: {
      // error
      type: 'boolean'
    },
    d: {
      // done
      type: 'boolean'
    },
    a: {
      // all
      type: 'boolean'
    }
  }
};

export default async function list_queue(argv: any) {
  const argCheck = new ajv().compile(argumentsSchema)(argv);

  if (!argCheck) {
    console.error('Invalid arguments.');
    process.exit(1);
  }

  let state: QueueState | 'all';
  switch (true) {
    case argv.a:
      state = 'all';
      break;
    case argv.p:
      state = 'processing';
      break;
    case argv.d:
      state = 'done';
      break;
    case argv.e:
      state = 'error';
      break;
    case argv.w:
    default:
      state = 'wait';
      break;
  }

  const queue = await bootstrapQueueSystem();
  try {
    const items = await queue.list(state);
    console.log(items);
  } finally {
    queue.dispose();
  }
}
