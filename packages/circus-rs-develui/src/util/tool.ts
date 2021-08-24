import * as rs from '@utrad-ical/circus-rs/src/browser';
const toolCollection = {
    'hand': rs.toolFactory('hand'),
    'window': rs.toolFactory('window'),
    'zoom': rs.toolFactory('zoom'),
    'pager': rs.toolFactory('pager'),
    'celestialRotate': rs.toolFactory('celestialRotate'),
    'ruler': rs.toolFactory('ruler'),

    'circle': rs.toolFactory('circle'),
    'rectangle': rs.toolFactory('rectangle'),
    'polyline': rs.toolFactory('polyline'),
    'point': rs.toolFactory('point'),

    'ellipsoid': rs.toolFactory('ellipsoid'),
    'cuboid': rs.toolFactory('cuboid'),

    'brush': rs.toolFactory('brush'),
    'eraser': rs.toolFactory('eraser'),
    'bucket': rs.toolFactory('bucket'),
    'wand': rs.toolFactory('wand'),
    'wandEraser': rs.toolFactory('wandEraser'),
};

export type ToolName = keyof typeof toolCollection;

const tool2name = Object.entries(toolCollection).reduce(
    (collection, [name, tool]) => {
        collection.set(tool, name as ToolName);
        return collection;
    },
    new Map<rs.Tool, ToolName>()
);

export const getNameFromTool = (tool: rs.Tool) => tool ? tool2name.get(tool) : undefined;
export const getToolFromName = (name: keyof typeof toolCollection) => name ? rs.toolFactory(name) : undefined;
