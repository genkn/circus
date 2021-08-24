import * as React from 'react';
import { useSelector } from 'react-redux';
import { dispatch, RootState } from '../store';
import { createViewStateModifier, registerViewState, selectNamedState, updateViewState } from '../store/viewStates';
import { metadataSelector } from '../store/volume';
import createSectionChangeDispatcher from '../util/createSectionChangeDispatcher';
import SectionSettings from './SectionSettings';
import { appStorageKeySelector } from '../store/configuration';
import classNames from 'classnames';
import createVrStateChangeDispatcher from '../util/createVrStateChangeDispatcher';
import VrTransferFunctionSettings from './VrTransferFunctionSettings';
import VrSubVolumeSettings from './VrSubVolumeSettings';
import VrWebGLRenderSettings from './VrWebGLRenderSettings';
import VrMaskAndLabelSettings from './VrMaskAndLabelSettings';

const StateEditor: React.FC<{ stateName: string; }> = props => {
  const { stateName } = props;
  const metadata = useSelector((state: RootState) => metadataSelector(state));
  const namedState = useSelector((state: RootState) => selectNamedState(state, stateName));
  const modifyOperation = createViewStateModifier(stateName);

  const sectionDispatcher = createSectionChangeDispatcher(dispatch, { modifyOperation });
  const [displayPanes, setDisplayPanes] = React.useState<Record<string, boolean>>({});

  const appStorageKey = useSelector((state: RootState) => appStorageKeySelector(state));

  const [saveKey, setSaveKey] = React.useState<string>();
  React.useEffect(() => {
    setSaveKey(
      appStorageKey && stateName
        // ? appStorageKey + '.' + stateName + '.displayPanes'
        ? appStorageKey + '.displayPanes'
        : undefined
    );
  }, [appStorageKey, stateName]);

  React.useEffect(() => {
    const display = JSON.parse(localStorage.getItem(saveKey) || '{}');
    setDisplayPanes(display);
  }, [saveKey]);

  React.useEffect(() => {
    localStorage.setItem(saveKey, JSON.stringify(displayPanes));
  }, [saveKey, displayPanes]);

  const handleTogglePane = (name: string) => {
    // setDisplayPanes({ ...displayPanes, [name]: !displayPanes[name] });
    setDisplayPanes({ [name]: true });
  }
  const vrStateDispatcher = createVrStateChangeDispatcher(dispatch, { modifyOperation });

  if (!namedState || !namedState.viewState) return null;

  return (
    <div>
      <div className="form-row">
        <div className="col-2">
          <div className="list-group list-group-flush">
            <TogglePaneListGroupItem toggle="StateInformation" displayPanes={displayPanes} handleTogglePane={handleTogglePane}><small>Global</small></TogglePaneListGroupItem>
            <TogglePaneListGroupItem toggle="SectionSettings" displayPanes={displayPanes} handleTogglePane={handleTogglePane}><small>Section</small></TogglePaneListGroupItem>
            <TogglePaneListGroupItem toggle="VrTransferFunctionSettings" displayPanes={displayPanes} handleTogglePane={handleTogglePane}><small>Vr Transfer Function</small></TogglePaneListGroupItem>
            <TogglePaneListGroupItem toggle="VrSubVolumeSettings" displayPanes={displayPanes} handleTogglePane={handleTogglePane}><small>Vr Sub Volume</small></TogglePaneListGroupItem>
            <TogglePaneListGroupItem toggle="VrWebGLRenderSettings" displayPanes={displayPanes} handleTogglePane={handleTogglePane}><small>Vr Setting</small></TogglePaneListGroupItem>
            <TogglePaneListGroupItem toggle="VrMaskAndLabelSettings" displayPanes={displayPanes} handleTogglePane={handleTogglePane}><small>Vr Mask And Label</small></TogglePaneListGroupItem>
          </div>
          <div className="mt-2">
            <button className="btn btn-sm btn-block btn-outline-secondary" onClick={ev => console.log(JSON.stringify(namedState.viewState, null, 2))}>
              dump state
            </button>
          </div>
        </div>
        <div className="col-10">
          {displayPanes.StateInformation && <TheNamedStateJsonEditor stateName={stateName} />}
          {displayPanes.SectionSettings && <SectionSettings metadata={metadata} viewState={namedState.viewState} dispatcher={sectionDispatcher} />}
          {displayPanes.VrTransferFunctionSettings && <VrTransferFunctionSettings viewState={namedState.viewState} dispatcher={vrStateDispatcher} />}
          {displayPanes.VrSubVolumeSettings && <VrSubVolumeSettings metadata={metadata} viewState={namedState.viewState} dispatcher={vrStateDispatcher} />}
          {displayPanes.VrWebGLRenderSettings && <VrWebGLRenderSettings viewState={namedState.viewState} dispatcher={vrStateDispatcher} />}
          {displayPanes.VrMaskAndLabelSettings && <VrMaskAndLabelSettings viewState={namedState.viewState} dispatcher={vrStateDispatcher} />}
        </div>
      </div>
    </div>
  )
}

const TogglePaneListGroupItem: React.FC<{
  displayPanes: Record<string, boolean>;
  handleTogglePane: (pane: string) => void;
  toggle: string;
}> = props => {
  const { toggle, displayPanes, handleTogglePane } = props;
  return (
    <a
      href={"#" + toggle}
      onClick={(e) => { e.preventDefault(); handleTogglePane(toggle) }}
      className={classNames('list-group-item list-group-item-light list-group-item-action p-1', { active: displayPanes[toggle] })}>
      {props.children}
    </a>
  )
}

const stringify = (vs: any) => {
  const json = JSON.stringify(vs, null, 2);
  // return json.replace(/\[\s*([-\d\.]+),\s*([-\d\.]+),\s*([-\d\.]+)\s*\]/msg, '[$1, $2, $3]');
  return json.replace(/\[\s*((?:[-\d\.]+,\s*)*(?:[-\d\.]+))\s*\]/msg, (match, p1) => {
    return '[' + p1.split(',').map(s => s.trim()).join(', ') + ']';
  });
}

const TheNamedStateJsonEditor: React.FC<{
  stateName: string;
}> = props => {
  const { stateName } = props;

  const namedState = useSelector((state: RootState) => selectNamedState(state, stateName));

  const [saveName, setSaveName] = React.useState(stateName);
  React.useEffect(() => {
    setSaveName(stateName);
  }, [stateName]);

  const [applyError, setApplyError] = React.useState<string>();
  const applyEditState = () => {
    try {
      const viewState = JSON.parse(json);
      setApplyError(undefined);
      dispatch(updateViewState({ name: stateName, viewState, version: namedState.version + 1 }));
    } catch (e) {
      setApplyError(e.toString());
    }
  };
  const resetEditState = () => {
    setJson(stringify(namedState.viewState));
    setApplyError(undefined);
  };

  const saveStateAs = (name: string) => {
    const viewState = JSON.parse(json);
    dispatch(registerViewState({ name, viewState }));
  };

  const [json, setJson] = React.useState(stringify(namedState.viewState));
  React.useEffect(
    () => {
      setJson(stringify(namedState.viewState));
    },
    [namedState.viewState]
  )

  return (
    <>
      {applyError && (
        <div className="alert alert-danger">
          <a href="#" className="close" onClick={ev => { ev.preventDefault(); setApplyError(undefined); }}>&times;</a>
          {applyError}
        </div>
      )}
      <div className="bg-light form-row">
        <div className="col-2">
          <button className="btn btn-block btn-sm btn-outline-info" onClick={ev => applyEditState()}>Apply changes</button>
        </div>
        <div className="col-2">
          <button className="btn btn-block btn-sm btn-outline-warning" onClick={ev => resetEditState()}>Discard changes</button>
        </div>
        <div className="col-8">
          <div className="form-group">
            <div className="input-group input-group-sm is-invalid">
              <div className="input-group-prepend">
                <span className="input-group-text">Save as</span>
              </div>
              <input type="text"
                value={saveName}
                className='form-control form-control-sm'
                onChange={ev => setSaveName(ev.target.value)} />
              <div className="input-group-append">
                <button className="btn btn-secondary"
                  onClick={ev => saveStateAs(saveName)}
                >Save</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <textarea rows={20} className="form-control form-control-sm" onChange={(ev) => setJson(ev.target.value)} value={json}></textarea>
    </>
  )
}


export default StateEditor;
