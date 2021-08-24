import * as React from 'react';
import { useSelector } from 'react-redux';
import * as rs from '@utrad-ical/circus-rs/src/browser';
import RsToolbar from './RsToolbar';
import { ToolName } from '../util/tool';
import RsViewer5, { RsImageViewer } from './RsViewer5';
import StateEditor from './StateEditor';
import ViewStateList from './ViewStateList';
import { dispatch, RootState } from '../store';
import { updateViewState } from '../store/viewStates';
import selectComposition from '../util/selectComposition';
import { candidate1, candidate2, candidate3 } from '../data-sample/candidate-view-states';

const VrContent: React.FC<{}> = props => {
  const [editStateName, setEditStateName] = React.useState();
  const handleSetEditStateName = (stateName) => setEditStateName(stateName);

  const stateName = "@vr-default";

  const [toolName, setToolName] = React.useState<ToolName>('celestialRotate');
  const vrComposition = useSelector((state: RootState) => selectComposition(state, 'vr'));

  const handleApplyState = (viewState: rs.ViewState) => {
    dispatch(updateViewState({ name: stateName, viewState }));
  };

  return (
    <div>
      <div className="row">
        <div className="col-12">
          <RsToolbar
            activeToolName={toolName}
            handleSelectTool={(tn) => setToolName(tn as ToolName)}
          />
        </div>
        <div className="col-6">
          <RsViewer5
            composition={vrComposition}
            toolName={toolName}
            stateName={stateName}
            rw={512}
            rh={512}
            handleSetEditStateName={handleSetEditStateName}
          />
        </div>
        <div className="col-6">
          <ViewStateThumbnail
            composition={vrComposition}
            viewState={candidate1}
            handleApplyState={handleApplyState}
          />
          <ViewStateThumbnail
            composition={vrComposition}
            viewState={candidate2}
            handleApplyState={handleApplyState}
          />
          <ViewStateThumbnail
            composition={vrComposition}
            viewState={candidate3}
            handleApplyState={handleApplyState}
          />
        </div>
      </div>
      <hr />
      <div className="row">
        <div className="col-12">
          <div className="form-row">
            <div className="col-2">
              <ViewStateList stateName={editStateName} handleSetEditStateName={handleSetEditStateName} />
            </div>
            <div className="col-10">
              <StateEditor stateName={editStateName} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ViewStateThumbnail: React.FC<{
  composition: rs.Composition;
  viewState: rs.ViewState;
  handleApplyState?: (viewState: rs.ViewState) => void;
}> = props => {

  const { composition, viewState, handleApplyState = () => { } } = props;

  const initialStateSetter = () => viewState;

  return (
    <div className="d-inline-block p-3">
      <RsImageViewer
        rw={128}
        rh={128}
        initialStateSetter={initialStateSetter}
        composition={composition}
      />
      <button className="btn btn-sm btn-block btn-outline-secondary" onClick={ev => handleApplyState(viewState)}>Apply</button>
    </div>
  )
}

export default VrContent;
