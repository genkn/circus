import * as React from 'react';
import { useSelector } from 'react-redux';
import { dispatch, RootState } from '../store';
import { initializeViewState, selectNamedState, stateNamesSelector, updateViewState } from '../store/viewStates';
import * as rs from '@utrad-ical/circus-rs/src/browser';
import ImageViewer, { createStateChanger, ImageViewerProps, InitialStateSetterFunc } from './ImageViewer';

const RsViewer5: React.FC<{
  id?: string | number;
  composition?: rs.Composition;
  stateName?: string;
  toolName?: string;
  rw?: number;
  rh?: number;
  handleSetEditStateName?: (name: string) => void;
}> = props => {
  const {
    id,
    composition,
    stateName: origStateName,
    toolName = 'pager',
    handleSetEditStateName = () => { },
    rw = 256,
    rh = 256
  } = props;

  const [stateName, setStateName] = React.useState(origStateName || 'viewer-' + Math.random().toString().replace('.', '').substr(8));
  React.useEffect(() => setStateName(origStateName), [origStateName]);

  return (
    <div>
      <RsViewerWithNamedState
        id={id}
        stateName={stateName}
        toolName={toolName}
        composition={composition}
        rw={rw}
        rh={rh}
      />
      <div className="form-row align-items-end mt-1">
        <div className="col-10">
          <StateNameSelect
            stateName={stateName}
            handleChangeStateName={(_prevName, newName) => setStateName(newName)}
          />
        </div>
        <div className="col-2 text-right">
          <a href={"#" + stateName} onClick={ev => handleSetEditStateName(stateName)}>
            <small>Edit</small>
          </a>
        </div>
      </div>
    </div>
  )
}

interface RsViewerWithNamedStateProps {
  id?: string | number;
  composition?: rs.Composition;
  stateName?: string;
  toolName?: string;
  w?: number;
  h?: number;
  rw?: number;
  rh?: number;
}

const RsViewerWithNamedState: React.FC<RsViewerWithNamedStateProps> = (props) => {
  const { id, stateName = '', composition, w, h, rw, rh, toolName = 'pager' } = props;

  const [preparedComposition, setPreparedComposition] = React.useState<rs.Composition>();
  const loadingComposition = React.useRef<rs.Composition>();
  React.useEffect(() => {
    if (composition) {
      loadingComposition.current = composition;
      composition.imageSource.ready().then(() => {
        if (loadingComposition.current === composition) {
          setPreparedComposition(composition);
        }
      });
    } else {
      setPreparedComposition(undefined);
    }
  }, [composition]);

  const namedState = useSelector((state: RootState) => selectNamedState(state, stateName));
  const versionRef = React.useRef<number>();
  const incomingVersionRef = React.useRef<number>();

  const initialStateSetter: InitialStateSetterFunc<any>
    = (viewer, viewState): rs.ViewState => {
      return namedState && namedState.viewState ? namedState.viewState : viewState;
    }
  const stateChanger = React.useMemo(() => createStateChanger<rs.ViewState>(), []);

  React.useEffect(() => {
    versionRef.current = undefined;
  }, [stateName]);

  React.useEffect(() => {
    if (!namedState) return;

    if (versionRef.current === undefined) {
      versionRef.current = namedState.version;
    }
    if (versionRef.current < namedState.version) {
      // console.log(id + ' Update to new state');
      stateChanger((viewState, viewer) => {
        incomingVersionRef.current = namedState.version;
        return namedState.viewState;
      });
    }
  }, [namedState]);

  const [tool, setTool] = React.useState<rs.Tool>();
  React.useEffect(() => {
    setTool(rs.toolFactory(toolName));
  }, [toolName]);

  const onCreateViewer = React.useCallback(
    (viewer: rs.Viewer) => {
      if (stateName && preparedComposition && !namedState) {
        dispatch(initializeViewState({
          name: stateName,
          viewState: preparedComposition.imageSource.initialState(viewer)
        }));
      }
    },
    [stateName, preparedComposition, !namedState]
  );

  const onViewStateChange = React.useCallback(
    (viewer: rs.Viewer) => {
      if (!stateName) return;

      if (!incomingVersionRef.current) {
        // console.log(id + ' Propagate new state#' + (versionRef.current + 1));
        dispatch(updateViewState({
          name: stateName,
          viewState: viewer.getState(),
          version: ++versionRef.current
        }));
      } else {
        versionRef.current = incomingVersionRef.current;
        incomingVersionRef.current = undefined;
      }
    },
    [stateName]
  );

  return <RsImageViewer
    id={id}
    rw={rw}
    rh={rh}
    initialStateSetter={initialStateSetter}
    composition={preparedComposition}
    stateChanger={stateChanger}
    tool={tool}
    onCreateViewer={onCreateViewer}
    onViewStateChange={onViewStateChange}
  />
}

export const RsImageViewer: React.FC<ImageViewerProps & {
  rw?: number;
  rh?: number;
}> = props => {

  const {
    className,
    composition,
    stateChanger,
    tool,
    id,
    initialStateSetter,
    onCreateViewer,
    onDestroyViewer,
    onViewStateChange,
    onMouseUp,
    rw, rh
  } = props;

  return (
    <ViewerFrame rw={rw} rh={rh} composition={composition}>
      <ImageViewer
        id={id}
        // rw={rw}
        // rh={rh}
        className={className}
        initialStateSetter={initialStateSetter}
        composition={composition}
        stateChanger={stateChanger}
        tool={tool}
        onCreateViewer={onCreateViewer}
        onViewStateChange={onViewStateChange}
      />
    </ViewerFrame>
  );
}

export const ViewerFrame: React.FC<{
  composition?: rs.Composition;
  rw?: number;
  rh?: number;
}> = props => {
  const { composition, rw, rh } = props;

  const [preparedComposition, setPreparedComposition] = React.useState<rs.Composition>();
  const loadingComposition = React.useRef<rs.Composition>();
  React.useEffect(() => {
    if (composition) {
      loadingComposition.current = composition;
      composition.imageSource.ready().then(() => {
        if (loadingComposition.current === composition) {
          setPreparedComposition(composition);
        }
      });
    } else {
      setPreparedComposition(undefined);
    }
  }, [composition]);

  const style = {
    display: 'inline-block',
    width: rw.toString() + 'px',
    height: rh.toString() + 'px',
    backgroundColor: '#000',
    color: '#fff'
  }

  return (
    <div style={style}>
      {!preparedComposition ? "Now Loading" : props.children}
    </div>
  );
}

const StateNameSelect: React.FC<{
  stateName?: string;
  handleChangeStateName?: (prevName: string, newName: string) => void;
}> = props => {
  const { stateName = '', handleChangeStateName } = props;
  const stateNames = useSelector((state: RootState) => stateNamesSelector(state));

  return (
    <select className="custom-select custom-select-sm"
      onChange={ev => handleChangeStateName(stateName, ev.target.value)}
      value={stateNames.some(sn => sn === stateName) ? stateName : ''}
    >
      {stateNames.map(sn => (
        <option key={sn} value={sn}>{sn}</option>
      ))}
      <option value={''}>Not connected</option>
    </select>
  )
}

export default RsViewer5;
