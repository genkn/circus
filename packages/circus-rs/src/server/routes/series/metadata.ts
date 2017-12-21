import * as koa from 'koa';
import { ServerHelpers } from '../../ServerHelpers';

/**
 * Handles 'metadata' endpoint which gives general information
 * of the specified series.
 */
export default function metadata(helpers: ServerHelpers): koa.Middleware {
  return async function metadata(ctx, next) {
    const vol = ctx.state.volume;
    const response: any = {
      voxelCount: vol.getDimension(),
      voxelSize: vol.getVoxelSize(),
      estimatedWindow: vol.estimatedWindow,
      dicomWindow: vol.dicomWindow,
      pixelFormat: vol.getPixelFormat()
    };
    ctx.body = response;
  };
}
