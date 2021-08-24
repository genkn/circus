import * as React from 'react';
import classNames from 'classnames';
import { useSelector } from 'react-redux';
import { seriesSelector } from '../store/configuration';
import { loadVolumeMetadata, metadataSelector } from '../store/volume';
import { store, dispatch, RootState } from '../store';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  useHistory,
  useLocation,
  Redirect,
  Link
} from "react-router-dom";
import Configuration from './Configuration';
import MprContent from './MprContent';
import VrContent from './VrContent';
import WegGLContent from './WegGLContent';
import BenchmarkContent from './BenchmarkContent';
import BenchmarkVrContent from './BenchmarkVrContent';
import WebGLCheckContent from './WebGLCheckContent';

const App: React.FC<{}> = props => {
  return (
    <Router>
      <AppNavbar />
      <div className="container mt-4 mb-5">
        <Switch>
          <Route path="/" exact><RouteCheck title="Home" /></Route>
          <Route path="/configuration"><Configuration /></Route>
          <Route path="/mpr"><EnsureConfigured><MprContent /></EnsureConfigured></Route>
          <Route path="/vr"><EnsureConfigured><VrContent /></EnsureConfigured></Route>
          <Route path="/webgl"><EnsureConfigured><WegGLContent /></EnsureConfigured></Route>
          <Route path="/benchmark"><EnsureConfigured><BenchmarkContent /></EnsureConfigured></Route>
          <Route path="/benchmark-vr"><EnsureConfigured><BenchmarkVrContent /></EnsureConfigured></Route>
          <Route path="/webgl-check"><WebGLCheckContent /></Route>
        </Switch>
      </div>
    </Router>
  )
}

const AppNavbar: React.FC<{}> = props => {
  const { pathname } = useLocation();
  return (
    <ul className="nav nav-tabs mt-2 mx-1">
      <AppNavbarItem to="/" current={pathname}>Home</AppNavbarItem>
      <AppNavbarItem to="/mpr" current={pathname}>MPR</AppNavbarItem>
      <AppNavbarItem to="/vr" current={pathname}>VR</AppNavbarItem>
      <AppNavbarItem to="/webgl" current={pathname}>WebGL</AppNavbarItem>
      <AppNavbarItem to="/benchmark" current={pathname}>Benchmark</AppNavbarItem>
      <AppNavbarItem to="/benchmark-vr" current={pathname}>BenchmarkVr</AppNavbarItem>
      <AppNavbarItem to="/webgl-check" current={pathname}>WebGL-Check</AppNavbarItem>
      <ConfigurationDropdownNavItem />
      <UtilDropdownNavItem />
    </ul >
  )
}

const AppNavbarItem: React.FC<{
  current?: string;
  to?: string;
}> = props => {
  const { to, current } = props;
  return (
    <li className="nav-item">
      <Link to={to} className={classNames("nav-link", { active: to === current })} href={to} >{props.children}</Link>
    </li>
  )
}


const EnsureConfigured: React.FC<{}> = props => {

  const series = useSelector(seriesSelector);
  const [configured, setConfigured] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (series) {
      const { seriesUid, partialVolumeDescriptor } = series;
      setLoading(true);
      (async () => {
        await dispatch(loadVolumeMetadata(seriesUid, partialVolumeDescriptor));
        setConfigured(true);
        setLoading(false);
      })();
    } else {
      setConfigured(false);
      setLoading(false);
    }
  }, [series]);

  if (loading) return <div>Loading ...</div>;
  if (!configured) return <Redirect to="/configuration" />;
  return <>{props.children}</>;
}

const RouteCheck: React.FC<{ title: string; }> = ({ title }) => <div>{title}</div>;

const utilities = {
  "Dump store.getState()": () => console.log(store.getState())
}

const UtilDropdownNavItem: React.FC<{}> = props => {
  const [hoverDropdown, toggleHoverDropdown] = React.useState(false);
  const [pinDropdown, togglePinDropdown] = React.useState(false);

  const show = hoverDropdown || pinDropdown;

  return (
    <li className={classNames("nav-item dropdown", { show })}
      onMouseEnter={ev => toggleHoverDropdown(true)}
      onMouseLeave={ev => toggleHoverDropdown(false)}
    >
      <a className="nav-link dropdown-toggle" href="#" onClick={ev => togglePinDropdown(!pinDropdown)}>Util</a>
      <div className={classNames("dropdown-menu dropdown-menu-right", { show })}>
        {Object.entries(utilities).map(([name, fn]) => (
          <a key={name} className="dropdown-item" href={"#"} onClick={(ev) => { ev.preventDefault(); fn(); }}>{name}</a>
        ))}
      </div>
    </li>
  )
}

const ConfigurationDropdownNavItem: React.FC<{}> = props => {
  const metadata = useSelector((state: RootState) => metadataSelector(state));
  const [hoverDropdown, toggleHoverDropdown] = React.useState(false);
  const [pinDropdown, togglePinDropdown] = React.useState(false);

  const show = hoverDropdown || pinDropdown;

  const onClickLink = _ev => {
    toggleHoverDropdown(false);
    togglePinDropdown(false);
  };

  return (
    <li className={classNames("ml-auto nav-item dropdown", { show })}
      onMouseEnter={_ev => toggleHoverDropdown(true)}
      onMouseLeave={_ev => toggleHoverDropdown(false)}
    >
      <a className="nav-link dropdown-toggle" href="#" onClick={_ev => togglePinDropdown(!pinDropdown)}>Config</a>
      <div className={classNames("dropdown-menu dropdown-menu-right", { show })}>
        <Link to="/configuration" className="dropdown-item" href="/configuration" onClick={onClickLink}>Edit</Link>
        {metadata && <><div className="dropdown-divider"></div><ImageSourceInformation metadata={metadata} /></>}
      </div>
    </li>
  )
}

const ImageSourceInformation = props => {
  const { metadata } = props;
  return (
    <div className="px-2 bg-light">
      <div>
        <div><small className="text-muted">Voxel count</small></div>
        <div className="mt-n1">
          <span>{metadata.voxelCount[0]}</span>
          <small className="mx-1">x</small>
          <span>{metadata.voxelCount[1]}</span>
          <small className="mx-1">x</small>
          <span>{metadata.voxelCount[2]}</span>
        </div>
      </div>
      <div>
        <div><small className="text-muted">Voxel size</small></div>
        <div className="mt-n1">
          <span>{metadata.voxelSize[0]}</span>
          <small className="mx-1">x</small>
          <span>{metadata.voxelSize[1]}</span>
          <small className="mx-1">x</small>
          <span>{metadata.voxelSize[2]}</span>
        </div>
      </div>
      <div>
        <div><small className="text-muted">Volume size [mm]</small></div>
        <div className="mt-n1">
          <span>{metadata.voxelCount[0] * metadata.voxelSize[0]}</span>
          <small className="mx-1">x</small>
          <span>{metadata.voxelCount[1] * metadata.voxelSize[1]}</span>
          <small className="mx-1">x</small>
          <span>{metadata.voxelCount[2] * metadata.voxelSize[2]}</span>
        </div>
      </div>
    </div>
  );
};

export default App;
