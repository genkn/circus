import * as rs from '@utrad-ical/circus-rs/src/browser';

import { Vector3 } from 'three';

const detectSubVolume = (metadata, entry, margin) => ({
  offset: [
    Math.max(0, entry.origin[0] - margin),
    Math.max(0, entry.origin[1] - margin),
    Math.max(0, entry.origin[2] - margin)
  ] as [number, number, number],
  dimension: [
    Math.min(metadata.voxelCount[0], entry.size[0] + margin * 2),
    Math.min(metadata.voxelCount[1], entry.size[1] + margin * 2),
    Math.min(metadata.voxelCount[2], entry.size[2] + margin * 2)
  ] as [number, number, number]
});

const detectSection = (metadata, position, subVolume) => {
  const position3 = new Vector3(
    position[0] * metadata.voxelSize[0],
    position[1] * metadata.voxelSize[1],
    position[2] * metadata.voxelSize[2]
  );

  const target3 = new Vector3(
    (subVolume.offset[0] + subVolume.dimension[0] * 0.5) *
    metadata.voxelSize[0],
    (subVolume.offset[1] + subVolume.dimension[1] * 0.5) *
    metadata.voxelSize[1],
    (subVolume.offset[2] + subVolume.dimension[2] * 0.5) *
    metadata.voxelSize[2]
  );

  const eyeLine = new Vector3().subVectors(target3, position3);
  const up = new Vector3(0, 1, 0);

  const u = metadata.voxelCount[0] * metadata.voxelSize[0];
  const v = metadata.voxelCount[1] * metadata.voxelSize[1];

  const zoom = Math.max(
    metadata.voxelCount[0] / subVolume.dimension[0],
    metadata.voxelCount[1] / subVolume.dimension[1],
    metadata.voxelCount[2] / subVolume.dimension[2]
  );

  const xAxis = new Vector3()
    .crossVectors(eyeLine, up)
    .normalize()
    .multiplyScalar(u / zoom);

  const yAxis = new Vector3()
    .crossVectors(eyeLine, xAxis)
    .normalize()
    .multiplyScalar(v / zoom);

  const origin = target3
    .clone()
    .addScaledVector(xAxis, -0.5)
    .addScaledVector(yAxis, -0.5);

  return {
    origin: origin.toArray(),
    xAxis: xAxis.toArray(),
    yAxis: yAxis.toArray()
  };
};

const createCandidateState = (metadata, entry, highlightedLabelIndex): rs.VrViewState => {
  const subVolume = detectSubVolume(imageMetadata, entry, 30);
  const transferFunction = rs.createTransferFunction([
    [470, '#66000000'],
    [700, '#ff0000ff']
  ]);

  return {
    type: 'vr',
    section: detectSection(imageMetadata, entry.position, subVolume),
    subVolume,
    transferFunction,
    quality: 2,
    interpolationMode: 'trilinear',
    highlightedLabelIndex,
    enableMask: true,
    background: [0, 0, 0, 255],
    rayIntensity: 1,
  };
};

const imageMetadata = {
  voxelSize: [0.46875, 0.46875, 0.6] as [number, number, number],
  voxelCount: [512, 512, 132] as [number, number, number]
};

const entry1 = {
  origin: [257, 159, 27],
  size: [10, 12, 11],
  position: [324.0276961927813, 175.11348337068353, 31.242603550295858],
  target: [261.64231738035267, 164.15113350125944, 31.889168765743072]
};
const entry2 = {
  origin: [330, 212, 72],
  size: [7, 9, 6],
  position: [387.42562584220406, 215.0, 99.19526627218937],
  target: [332.06, 215.7, 74.33]
};
const entry3 = {
  origin: [230, 229, 73],
  size: [9, 9, 7],
  position: [283.0268443596146, 233.0, 107.89508713983365],
  target: [234.33495145631068, 233.29611650485438, 76.33009708737865]
};

export const candidate1 = createCandidateState(imageMetadata, entry1, 0);
export const candidate2 = createCandidateState(imageMetadata, entry2, 1);
export const candidate3 = createCandidateState(imageMetadata, entry3, 2);
