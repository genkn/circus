import * as React from 'react';
import * as rs from '@utrad-ical/circus-rs/src/browser';
import { DicomVolumeMetadata } from '@utrad-ical/circus-rs/src/browser/image-source/volume-loader/DicomVolumeLoader';
import { VrStateChangeDispatcher } from '../util/createVrStateChangeDispatcher';
import RangeSlider from '../lib/RangeSlider';

interface VrSubVolumeSettingsProps {
  metadata: DicomVolumeMetadata;
  viewState: rs.ViewState;
  dispatcher: VrStateChangeDispatcher;
}
const title = "Sub volume";
const VrSubVolumeSettings: React.FC<VrSubVolumeSettingsProps> = props => {
  const { metadata, viewState, dispatcher } = props;

  if (!viewState) return null;
  if (viewState.type !== 'vr') return (
    <div className="card mb-2">
      <div className="card-header p-1">{title}</div>
      <div className="card-body p-4 text-muted">
        <strong>{viewState.type}</strong> state is not supported.
      </div>
    </div>
  );

  const { subVolume = { offset: [0, 0, 0], dimension: metadata.voxelCount.concat() } } = viewState;


  return (
    <div className="card mb-2">
      <div className="card-header p-1">{title}</div>
      <div className="card-body p-1">
        <div className="mb-1">
          <SubVolumeAxisHeader />
          <SubVolumeAxisRow
            label='X'
            max={metadata.voxelCount[0]}
            offset0={subVolume.offset[0]}
            offset1={subVolume.offset[0] + subVolume.dimension[0]}
            handleChangeRange={(offset0, offset1) => dispatcher.setSubVolumeRangeX(offset0, offset1, metadata.voxelCount)}
          />
          <SubVolumeAxisRow
            label='Y'
            max={metadata.voxelCount[1]}
            offset0={subVolume.offset[1]}
            offset1={subVolume.offset[1] + subVolume.dimension[1]}
            handleChangeRange={(offset0, offset1) => dispatcher.setSubVolumeRangeY(offset0, offset1, metadata.voxelCount)}
          />
          <SubVolumeAxisRow
            label='Z'
            max={metadata.voxelCount[2]}
            offset0={subVolume.offset[2]}
            offset1={subVolume.offset[2] + subVolume.dimension[2]}
            handleChangeRange={(offset0, offset1) => dispatcher.setSubVolumeRangeZ(offset0, offset1, metadata.voxelCount)}
          />
        </div>
      </div>
    </div>
  );
};

const SubVolumeAxisHeader: React.FC<{}> = props => {
  return (
    <div className="form-row">
      <div className="col-1">axis</div>
      <div className="col-8">offset</div>
      <div className="col-3">dimension</div>
    </div>
  );
}
const SubVolumeAxisRow: React.FC<{
  label: string;
  max: number;
  offset0: number;
  offset1: number;
  handleChangeRange: (offset0: number, offset1: number) => void;
}> = props => {
  const { label, max, offset0, offset1, handleChangeRange } = props;

  return (
    <div>
      <div className="form-row">
        <div className="col-1">
          <span className="form-control-plaintext text-center">{label}</span>
        </div>
        <div className="col-8 pt-1">
          <div className="input-group input-group-sm">
            <input
              type="number"
              className="form-control form-control-sm"
              value={offset0}
              onChange={ev => handleChangeRange(Number(ev.target.value) || 0, offset1)}
            />
            <div className="input-group-prepend">
              <span className="input-group-text"> - </span>
            </div>
            <input
              type="number"
              className="form-control form-control-sm"
              value={offset1}
              onChange={ev => handleChangeRange(offset0, Number(ev.target.value) || 0)}
            />
          </div>
        </div>
        <div className="col-3 pt-1">
          <input
            type="number"
            className="form-control form-control-sm"
            value={offset1 - offset0}
            onChange={ev => handleChangeRange(offset0, offset0 + (Number(ev.target.value) || 0))}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="col-12 px-3">
          <RangeSlider
            block
            min={0}
            max={max}
            value={[offset0, offset1]}
            step={1}
            onChange={([offset0, offset1]) => handleChangeRange(offset0, offset1)}
          />
          <input
            type="range"
            className="custom-range"
            min={0}
            max={max - (offset1 - offset0)}
            step={1}
            value={offset0}
            onChange={ev =>
              handleChangeRange(Number(ev.target.value), Number(ev.target.value) + (offset1 - offset0))
            }
          />
        </div>
      </div>

    </div>
  );
};

export default VrSubVolumeSettings;
