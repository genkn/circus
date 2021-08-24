import * as React from 'react';
import selectComposition from '../util/selectComposition';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import * as rs from '@utrad-ical/circus-rs/src/browser';
import ImageSourceBenchmark from './ImageSourceBenchmark';
import classNames from 'classnames';

let glBackCanvasElement: HTMLCanvasElement | null = null;
rs.WebGlRawVolumeMprImageSource.captureCanvasElement((canvas: HTMLCanvasElement) => {
  glBackCanvasElement = canvas;
});

const BenchmarkContent: React.FC<{}> = props => {
  const dynamicComposition = useSelector((state: RootState) => selectComposition(state, 'dynamic'));
  const rawVolumeComposition = useSelector((state: RootState) => selectComposition(state, 'rawVolume'));
  const webglComposition = useSelector((state: RootState) => selectComposition(state, 'webgl'));
  const [composition, setComposition] = React.useState<rs.Composition>(webglComposition);

  const [initialState, setInitialState] = React.useState<rs.ViewState>();
  React.useEffect(() => {
    dynamicComposition.imageSource.ready().then(
      () => {
        const el = document.createElement('div');
        el.style.setProperty('width', '512px');
        el.style.setProperty('height', '512px');
        document.body.appendChild(el);
        const dummyViewer = new rs.Viewer(el);
        const state = dynamicComposition.imageSource.initialState(dummyViewer);
        dummyViewer.dispose();
        document.body.removeChild(el);

        setInitialState(state);
      }
    );
  }, [dynamicComposition]);

  const glBackCanvasContainerRef = React.useRef<HTMLDivElement>();
  React.useEffect(() => {
    if (glBackCanvasContainerRef.current) {
      glBackCanvasContainerRef.current.appendChild(glBackCanvasElement);
    }
  }, [glBackCanvasContainerRef.current]);

  return (
    <div>
      {/* <div className="mx-2">
        <div className="p-1 mb-1 bg-light">gl-back-canvas</div>
        <div ref={glBackCanvasContainerRef}></div>
      </div> */}
      {initialState ? (
        <>
          <button className={classNames("mx-2 btn ", composition === dynamicComposition ? 'btn-primary' : 'btn-outline-primary')}
            onClick={_ev => setComposition(dynamicComposition)}>dynamic</button>
          <button className={classNames("mx-2 btn ", composition === rawVolumeComposition ? 'btn-primary' : 'btn-outline-primary')}
            onClick={_ev => setComposition(rawVolumeComposition)}>rawVolume</button>
          <button className={classNames("mx-2 btn ", composition === webglComposition ? 'btn-primary' : 'btn-outline-primary')}
            onClick={_ev => setComposition(webglComposition)}>webgl</button>
          <hr />
          <ImageSourceBenchmark composition={composition} initialState={initialState} />
        </>
      ) : (<div>Preparing initialState ...</div>)}
    </div>
  );
};

export default BenchmarkContent;
