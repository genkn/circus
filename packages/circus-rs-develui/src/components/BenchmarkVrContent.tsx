import * as React from 'react';
import { useSelector } from 'react-redux';
import * as rs from '@utrad-ical/circus-rs/src/browser';
import selectComposition from '../util/selectComposition';
import { RootState } from '../store';
import ImageSourceBenchmark from './ImageSourceBenchmark';

let glBackCanvasElement: HTMLCanvasElement | null = null;
rs.VolumeRenderingImageSource.captureCanvasElement && rs.VolumeRenderingImageSource.captureCanvasElement((canvas: HTMLCanvasElement) => {
  glBackCanvasElement = canvas;
});

const BenchmarkVrContent: React.FC<{}> = props => {
  const vrComposition = useSelector((state: RootState) => selectComposition(state, 'vr'));
  const [composition, setComposition] = React.useState<rs.Composition>(vrComposition);

  const [initialState, setInitialState] = React.useState<rs.ViewState>();
  React.useEffect(() => {
    vrComposition.imageSource.ready().then(
      () => {
        const el = document.createElement('div');
        el.style.setProperty('width', '512px');
        el.style.setProperty('height', '512px');
        document.body.appendChild(el);
        const dummyViewer = new rs.Viewer(el);
        const state = vrComposition.imageSource.initialState(dummyViewer);
        dummyViewer.dispose();
        document.body.removeChild(el);

        setInitialState(state);
      }
    );
  }, [vrComposition]);

  const glBackCanvasContainerRef = React.useRef<HTMLDivElement>();
  React.useEffect(() => {
    if (glBackCanvasContainerRef.current) {
      glBackCanvasContainerRef.current.appendChild(glBackCanvasElement);
    }
  }, [glBackCanvasContainerRef.current]);

  return (
    <div>
      <div className="mx-2">
        <div className="p-1 mb-1 bg-light">gl-back-canvas</div>
        <div ref={glBackCanvasContainerRef}></div>
      </div>

      {initialState ? <ImageSourceBenchmark composition={composition} initialState={initialState} /> : <div>Preparing initialState ...</div>}
    </div>
  );
};

export default BenchmarkVrContent;
