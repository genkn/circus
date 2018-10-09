import { Item } from './queue/queue';
import { PluginDefinition, PluginJobRequest } from './interface';
export interface CsCore {
  // Daemon controller
  daemon: {
    start(): Promise<void>;
    stop(): Promise<void>;
    status(): Promise<'running' | 'stopped'>;
    pm2list(): Promise<void>;
    pm2killall(): Promise<void>;
  };
  // plugin handler
  plugin: {
    list: () => Promise<PluginDefinition[]>;
    get: (pluginId: string) => Promise<PluginDefinition>;
  };
  // job handler
  job: {
    list: (
      state?: 'wait' | 'processing' | 'all'
    ) => Promise<Item<PluginJobRequest>[]>;
    register: (
      jobId: string,
      payload: PluginJobRequest,
      priority?: number
    ) => Promise<void>;
  };
  // dispose
  dispose(): Promise<void>;
}

export interface PluginDefinitionAccessor {
  list: () => Promise<PluginDefinition[]>;
  get: (pluginId: string) => Promise<PluginDefinition>;
}
