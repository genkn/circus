import * as React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import RsToolbar from './RsToolbar';
import { ToolName } from '../util/tool';
import RsViewer5 from './RsViewer5';
import StateEditor from './StateEditor';
import ViewStateList from './ViewStateList';
import selectComposition from '../util/selectComposition';

const MprContent: React.FC<{}> = props => {
  const [editStateName, setEditStateName] = React.useState("@mpr-01");
  const handleSetEditStateName = (stateName) => setEditStateName(stateName);

  const [toolName, setToolName] = React.useState<ToolName>('pager');

  const dynamicComposition = useSelector((state: RootState) => selectComposition(state, 'dynamic'));
  const rawVolumeComposition = useSelector((state: RootState) => selectComposition(state, 'rawVolume'));

  return (
    <div>
      <div className="row">
        <div className="col-12">
          <RsToolbar
            activeToolName={toolName}
            handleSelectTool={(tn) => setToolName(tn as ToolName)}
          />
        </div>
        <div className="col-12">
          <div className="d-flex">
            <div className="mx-2">
              <RsViewer5
                id="mpr-raw-volume"
                composition={rawVolumeComposition}
                toolName={toolName}
                stateName={'@mpr-00'}
                rw={256}
                rh={256}
                handleSetEditStateName={handleSetEditStateName}
              />
            </div>
            <div className="mx-2">
              <RsViewer5
                id="mpr-dynamic"
                composition={dynamicComposition}
                toolName={toolName}
                stateName={'@mpr-00'}
                rw={256}
                rh={256}
                handleSetEditStateName={handleSetEditStateName}
              />
            </div>
          </div>
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

export default MprContent;
