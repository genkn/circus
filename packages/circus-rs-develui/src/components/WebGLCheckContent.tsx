import * as React from 'react';
import { useSelector } from 'react-redux';
import * as rs from '@utrad-ical/circus-rs/src/browser';
import { RootState } from '../store';
import selectComposition from '../util/selectComposition';
import { ToolName } from '../util/tool';
import ImageViewer from './ImageViewer';
import RsToolbar from './RsToolbar';

const WebGLCheckContent: React.FC<{}> = props => {
  const webglComposition = useSelector((state: RootState) => selectComposition(state, 'webgl'));
  const rawVolumeComposition = useSelector((state: RootState) => selectComposition(state, 'rawVolume'));

  const [toolName, setToolName] = React.useState<ToolName>('pager');
  const [tool, setTool] = React.useState<rs.Tool>();
  React.useEffect(() => {
    setTool(rs.toolFactory(toolName));
  }, [toolName]);

  const initialStateSetter = (viewer: rs.Viewer, state: rs.ViewState) => {
    return { ...state };
    // return { ...state, debugMode: 1 };
  }

  const onCreateViewer = (viewer: rs.Viewer) => { };

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
          <strong>webgl</strong>
          <div style={{ width: '512px', height: '512px' }}>
            <ImageViewer
              composition={webglComposition}
              initialStateSetter={initialStateSetter}
              tool={tool}
              onCreateViewer={onCreateViewer}
            />
          </div>
        </div>
        <div className="col-6">
          <strong>rawVolume</strong>
          <div style={{ width: '512px', height: '512px' }}>
            <ImageViewer
              composition={rawVolumeComposition}
              initialStateSetter={initialStateSetter}
              tool={tool}
              onCreateViewer={onCreateViewer}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebGLCheckContent;
