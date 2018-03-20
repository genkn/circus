import Tool from './Tool';
import WindowTool from './state/WindowTool';
import HandTool from './state/HandTool';
import ZoomTool from './state/ZoomTool';
import PagerTool from './state/PagerTool';
import CelestialRotateTool from './state/CelestialRotateTool';
import BrushTool from './cloud/BrushTool';
import EraserTool from './cloud/EraserTool';
import BucketTool from './cloud/BrushTool';
import VrRotateZoomTool from './state/VrRotateZoomTool';

const toolCollection: { [toolName: string]: Tool } = {};

const defaultTools: { [toolName: string]: typeof Tool } = {
  null: Tool, // Null tool that ignores all UI events only to show a static image
  hand: HandTool,
  window: WindowTool,
  zoom: ZoomTool,
  pager: PagerTool,
  celestialRotate: CelestialRotateTool,

  brush: BrushTool,
  eraser: EraserTool,
  bucket: BucketTool,

  'vr-rotate-zoom': VrRotateZoomTool
};

Object.keys(defaultTools).forEach(key => {
  const toolClass = defaultTools[key];
  toolCollection[key] = new toolClass();
});

export function registerTool(toolName: string, toolClass: typeof Tool): void {
  if (toolName in toolCollection) {
    throw new Error('This tool name is already assigned');
  }
  toolCollection[toolName] = new toolClass();
}

export function toolFactory(key: string): Tool {
  return toolCollection[key];
}
