import * as rs from '@utrad-ical/circus-rs/src/browser';
import * as React from 'react';
import { transferFunction as transferFunctionSamples } from '../data-sample/transfer-functions';
import { drawBenchmark } from '../benchmark';

type ControlBenchmarkProps = {
  viewer: rs.Viewer;
};

type ControlBenchmarkStates = {
  benchmarkResult?: string;
};

export default class ControlBenchmark extends React.Component<
  ControlBenchmarkProps,
  ControlBenchmarkStates
> {
  constructor(props) {
    super(props);

    this.state = {};
    this.benchmark = this.benchmark.bind(this);
    this.handleClickRotationBenchmark = this.handleClickRotationBenchmark.bind(
      this
    );
    this.handleClickTransferFunctionBenchmark = this.handleClickTransferFunctionBenchmark.bind(
      this
    );
    this.handleClickLabelSwitchBenchmark = this.handleClickLabelSwitchBenchmark.bind(
      this
    );
    this.handleClickMoveBenchmark = this.handleClickMoveBenchmark.bind(this);
    this.handleClickZoomBenchmark = this.handleClickZoomBenchmark.bind(this);
    this.handleClickNochangeBenchmark = this.handleClickNochangeBenchmark.bind(
      this
    );
  }

  async benchmark(title: string, fn: (viewer) => void) {
    const { viewer } = this.props;
    this.setState({
      ...this.state,
      benchmarkResult: 'Running ' + title + ' ...'
    });
    await new Promise<void>(_ => setTimeout(() => _(), 100));
    const benchmarkResult = await drawBenchmark(viewer, fn, title);
    this.setState({
      ...this.state,
      benchmarkResult
    });
  }
  async handleClickNochangeBenchmark(_ev) {
    this.benchmark('No change', viewer => {
      viewer.setState({
        ...viewer.getState()
      } as rs.VrViewState);
    });
  }

  async handleClickRotationBenchmark(_ev) {
    this.benchmark('Rotate (celestial rotate tool)', viewer =>
      rs.rotateBy(viewer, 10, 0)
    );
  }

  async handleClickMoveBenchmark(_ev) {
    let i = 0;
    this.benchmark('Move viewport (hand tool)', viewer => {
      const t = (Math.PI / 30) * ++i;
      rs.moveBy(viewer, Math.cos(t) * 3, Math.sin(t) * 3);
    });
  }

  async handleClickZoomBenchmark(_ev) {
    let i = 0;
    this.benchmark('Zoom/Pan viewport (zoom tool)', viewer => {
      const t = (Math.PI / 30) * ++i;
      rs.zoomBy(viewer, Math.sin(t) * 3);
    });
  }

  async handleClickTransferFunctionBenchmark(_ev) {
    const entries: (keyof typeof transferFunctionSamples)[] = [
      'dicom',
      'vessel',
    ];
    let i = 0;
    this.benchmark('Transfer function', viewer => {
      viewer.setState({
        ...viewer.getState(),
        transferFunction:
          transferFunctionSamples[entries[i++ % entries.length]]
      } as rs.VrViewState);
    });
  }

  async handleClickLabelSwitchBenchmark(_ev) {
    const { viewer } = this.props;
    viewer.setState({
      ...viewer.getState(),
      transferFunction: transferFunctionSamples.vessel
    } as rs.VrViewState);

    const entries = [0, 1, 2, -1];
    let i = 0;
    this.benchmark('Change hilight Label', viewer => {
      viewer.setState({
        ...viewer.getState(),
        highlightedLabelIndex: entries[i++ % entries.length]
      } as rs.VrViewState);
    });
  }

  render() {
    return (
      <div className="card mb-2">
        <div className="card-header p-1">Benchmark</div>
        <div className="card-body p-1">
          <ul>
            {Object.entries({
              'Rotate (celestial rotate tool)': this
                .handleClickRotationBenchmark,
              'Move viewport (hand tool)': this.handleClickMoveBenchmark,
              'Zoom/Pan viewport (zoom tool)': this.handleClickZoomBenchmark,
              'Transfer function': this.handleClickTransferFunctionBenchmark,
              'Highlight label': this.handleClickLabelSwitchBenchmark,
              'No change': this.handleClickNochangeBenchmark
            }).map(([title, handleClick], idx) => (
              <li key={idx}>
                <a
                  className="d-inline-block mr-2"
                  key={idx}
                  href={'#' + escape(title)}
                  onClick={handleClick}
                >
                  {title}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="card-body p-2 bg-light">
          {this.state.benchmarkResult}
        </div>
      </div>
    );
  }
}
