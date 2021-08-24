import * as rs from '@utrad-ical/circus-rs/src/browser';
import * as React from 'react';
import { SectionChangeDispatcher } from '../util/createSectionChangeDispatcher';
import FormGroupXYZ from './FormGroupXYZ';

const SectionSettings: React.FC<{
  metadata;
  viewState: rs.ViewState;
  dispatcher: SectionChangeDispatcher;
}> = (props) => {

  const { metadata, viewState, dispatcher } = props;

  if (!viewState) return <div>...</div>;

  return (
    <div className="card mb-2">
      <div className="card-header p-1">Section control</div>
      <div className="card-body p-1">
        <strong>[origin]</strong>
        <FormGroupXYZ
          values={{ x: viewState.section.origin[0], y: viewState.section.origin[1], z: viewState.section.origin[2] }}
          changeHandlers={{ x: (v) => dispatcher.setOrigin0(v), y: (v) => dispatcher.setOrigin1(v), z: (v) => dispatcher.setOrigin2(v) }}
          ranges={{
            x: [-metadata.voxelCount[0] * metadata.voxelSize[0], metadata.voxelCount[0] * metadata.voxelSize[0]],
            y: [-metadata.voxelCount[1] * metadata.voxelSize[1], metadata.voxelCount[1] * metadata.voxelSize[1]],
            z: [-metadata.voxelCount[2] * metadata.voxelSize[2], metadata.voxelCount[2] * metadata.voxelSize[2]],
          }}
        />
        <strong>[x-axis]</strong>
        <FormGroupXYZ
          values={{ x: viewState.section.xAxis[0], y: viewState.section.xAxis[1], z: viewState.section.xAxis[2] }}
          changeHandlers={{ x: (v) => dispatcher.setXAxis0(v), y: (v) => dispatcher.setXAxis1(v), z: (v) => dispatcher.setXAxis2(v) }}
          ranges={{
            x: [0.1, metadata.voxelCount[0] * metadata.voxelSize[0] * 5],
            y: [0.1, metadata.voxelCount[1] * metadata.voxelSize[1] * 5],
            z: [0.1, metadata.voxelCount[2] * metadata.voxelSize[2] * 5],
          }}
        />
        <strong>[y-axis]</strong>
        <FormGroupXYZ
          values={{ x: viewState.section.yAxis[0], y: viewState.section.yAxis[1], z: viewState.section.yAxis[2] }}
          changeHandlers={{ x: (v) => dispatcher.setYAxis0(v), y: (v) => dispatcher.setYAxis1(v), z: (v) => dispatcher.setYAxis2(v) }}
          ranges={{
            x: [0.1, metadata.voxelCount[0] * metadata.voxelSize[0] * 5],
            y: [0.1, metadata.voxelCount[1] * metadata.voxelSize[1] * 5],
            z: [0.1, metadata.voxelCount[2] * metadata.voxelSize[2] * 5],
          }}
        />
      </div>
    </div>
  )
}

export default SectionSettings;