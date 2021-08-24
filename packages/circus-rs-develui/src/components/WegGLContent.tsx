import * as React from 'react';
import { useSelector } from 'react-redux';
import * as rs from '@utrad-ical/circus-rs/src/browser';
import { RootState } from '../store';
import RsToolbar from './RsToolbar';
import { ToolName } from '../util/tool';
import selectComposition from '../util/selectComposition';
import RsViewer5 from './RsViewer5';
import StateEditor from './StateEditor';
import ViewStateList from './ViewStateList';

let glBackCanvasElement: HTMLCanvasElement | null = null;
rs.WebGlRawVolumeMprImageSource.captureCanvasElement((canvas: HTMLCanvasElement) => {
  glBackCanvasElement = canvas;
});

const WegGLContent: React.FC<{}> = props => {
  const [editStateName, setEditStateName] = React.useState("@mpr-01");
  const handleSetEditStateName = (stateName) => setEditStateName(stateName);

  const [toolName, setToolName] = React.useState<ToolName>('pager');
  const [tool, setTool] = React.useState<rs.Tool>();
  React.useEffect(() => {
    setTool(rs.toolFactory(toolName));
  }, [toolName]);

  const dynamicComposition = useSelector((state: RootState) => selectComposition(state, 'dynamic'));
  const rawVolumeComposition = useSelector((state: RootState) => selectComposition(state, 'rawVolume'));
  const webglComposition = useSelector((state: RootState) => selectComposition(state, 'webgl'));

  const glBackCanvasContainerRef = React.useRef<HTMLDivElement>();
  React.useEffect(() => {
    if (glBackCanvasContainerRef.current) {
      glBackCanvasContainerRef.current.appendChild(glBackCanvasElement);
    }
  }, [glBackCanvasContainerRef.current]);

  return (
    <div>
      <div className="row">
        <div className="col-12">
          <RsToolbar
            activeToolName={toolName}
            handleSelectTool={(tn) => setToolName(tn as ToolName)}
          />
        </div>
        {/* <div className="row">
          <div className="col-6">
            <div className="p-1 mb-1 bg-light">webgl</div>
            <RsImageViewer
              composition={webglComposition}
              initialStateSetter={() => {
                const namedState = selectNamedState(store.getState(), '@mpr-00');
                return namedState.viewState;
              }}
              tool={tool}
              rw={512}
              rh={512}
            />
          </div>
          <div className="col-6">
            <div className="p-1 mb-1 bg-light">rawVolume</div>
            <RsImageViewer
              composition={rawVolumeComposition}
              initialStateSetter={() => {
                const namedState = selectNamedState(store.getState(), '@mpr-00');
                return namedState.viewState;
              }}
              tool={tool}
              rw={512}
              rh={512}
            />
          </div>
        </div> */}
        <div className="col-12">
          <div className="d-flex">
            {/* <div className="mx-2">
              <div className="p-1 mb-1 bg-light">dynamic</div>
              <RsViewer5
                id="mpr-dynamic"
                composition={dynamicComposition}
                toolName={toolName}
                stateName={'@mpr-00'}
                rw={256}
                rh={256}
                handleSetEditStateName={handleSetEditStateName}
              />
            </div> */}
            <div className="mx-2">
              <div className="p-1 mb-1 bg-light">rawVolume</div>
              <RsViewer5
                id="mpr-raw-volume"
                composition={rawVolumeComposition}
                toolName={toolName}
                stateName={'@mpr-00'}
                rw={512}
                rh={512}
                handleSetEditStateName={handleSetEditStateName}
              />
            </div>
            <div className="mx-2">
              <div className="p-1 mb-1 bg-light">webgl</div>
              <RsViewer5
                id="webgl"
                composition={webglComposition}
                toolName={toolName}
                stateName={'@mpr-00'}
                rw={512}
                rh={512}
                handleSetEditStateName={handleSetEditStateName}
              />
            </div>
            {/* <div className="mx-2">
              <div className="p-1 mb-1 bg-light">gl-back-canvas</div>
              <div ref={glBackCanvasContainerRef}></div>
            </div> */}
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

export default WegGLContent;
