import * as rs from '@utrad-ical/circus-rs/src/browser';
import * as React from 'react';

import FormGroupSelection from './FormGroupSelection';
import { VrStateChangeDispatcher } from '../util/createVrStateChangeDispatcher';

const title = "Mask and label";
const VrMaskAndLabelSettings: React.FC<{
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
        <FormGroupSelection
          name="enableMask"
          title="Enable mask"
          options={{ 1: 'enable', 0: 'disable' }}
          valueType="boolean"
          value={viewState.enableMask}
          onChange={(ev) => dispatcher.setEnableMask(ev.target.value)}
        />
        <FormGroupSelection
          name="highlightedLabelIndex"
          title="Label no."
          options={{ '-1': 'disable', 0: '0', 1: '1', 2: '2' }}
          valueType="number"
          value={viewState.highlightedLabelIndex}
          onChange={(ev) => dispatcher.setHighlightedLabelIndex(ev.target.value)}
        />
        <FormGroupSelection
          name="debugMode"
          title="Debug mode"
          options={{
            '-1': 'default',
            0: 'disable',
            1: 'check volume box',
            2: 'volume rendering with volume box'
            // 3: 'check transfer function texture'
          }}
          valueType="number"
          value={
            isNaN(Number(viewState.debugMode))
              ? -1
              : viewState.debugMode
          }
          onChange={(ev) => dispatcher.setDebugMode(ev.target.value)}
        />
      </div>
    </div>
  )
}

export default VrMaskAndLabelSettings;
