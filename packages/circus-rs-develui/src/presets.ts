import * as rs from '@utrad-ical/circus-rs/src/browser';

const imageMetadata = {
  voxelSize: [0.46875, 0.46875, 0.6] as [number, number, number],
  voxelCount: [512, 512, 132] as [number, number, number]
};

const mprState: rs.MprViewState = {
  type: 'mpr',
  window: {
    level: 329,
    width: 658
  },
  interpolationMode: 'trilinear',
  section: {
    origin: [0, 0, 53.4],
    xAxis: [240, 0, 0],
    yAxis: [0, 240, 0]
  }
};

function subVolumeFromAxialSection(
  voxelSize: [number, number, number],
  section,
  thickness: number = 3
) {
  const offset: [number, number, number] = [
    section.origin[0] / voxelSize[0],
    section.origin[1] / voxelSize[1],
    section.origin[2] / voxelSize[2]
  ];
  const dimension: [number, number, number] = [
    section.xAxis[0] / voxelSize[0],
    section.yAxis[1] / voxelSize[1],
    thickness / voxelSize[2]
  ];
  return { offset, dimension };
}
const dicomState: rs.VrViewState = {
  type: 'vr',
  section: mprState.section,
  interpolationMode: mprState.interpolationMode,
  background: [0, 0, 0, 0xff],
  subVolume: subVolumeFromAxialSection(
    imageMetadata.voxelSize,
    mprState.section
  ),
  transferFunction: rs.mprTransferFunction(mprState.window),
  rayIntensity: 1.0,
  quality: 2.0
};
