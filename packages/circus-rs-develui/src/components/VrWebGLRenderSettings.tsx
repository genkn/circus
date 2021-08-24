import * as rs from '@utrad-ical/circus-rs/src/browser';
import * as React from 'react';
import FormGroupSelection from './FormGroupSelection';
import FormGroupNumberRange from './FormGroupNumberRange';
import { VrStateChangeDispatcher } from '../util/createVrStateChangeDispatcher';

const title = "VR render settings";
const VrWebGLRenderSettings: React.FC<{
  viewState: rs.ViewState;
  dispatcher: VrStateChangeDispatcher;
}> = (props) => {
  const { dispatcher, viewState } = props;

  if (!viewState) return null;
  if (viewState.type !== 'vr') return (
    <div className="card mb-2">
      <div className="card-header p-1">{title}</div>
      <div className="card-body p-4 text-muted">
        <strong>{viewState.type}</strong> state is not supported.
      </div>
    </div>
  );

  return (
    <div className="card mb-2">
      <div className="card-header p-1">{title}</div>
      <div className="card-body p-1">
        <FormGroupNumberRange
          title="rayIntensity"
          min="0.1"
          max="10.0"
          step="0.1"
          name="rayIntensity"
          value={viewState.rayIntensity}
          onChange={(ev) => dispatcher.setRayIntensity(ev.target.value)}
        />
        <FormGroupNumberRange
          title="quality"
          min="0.1"
          max="10.0"
          step="0.1"
          name="quality"
          value={viewState.quality}
          onChange={(ev) => dispatcher.setQuality(ev.target.value)}
        />
        <FormGroupSelection
          name="interpolationMode"
          title="Interporation mode"
          options={{
            nearestNeighbor: 'nearestNeighbor',
            trilinear: 'trilinear'
          }}
          valueType="string"
          value={viewState.interpolationMode}
          onChange={(ev) => dispatcher.setInterpolationMode(ev.target.value)}
        />
      </div>
    </div>
  )
}

export default VrWebGLRenderSettings;
