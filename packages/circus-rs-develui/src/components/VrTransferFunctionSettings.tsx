import * as React from 'react';
import * as rs from '@utrad-ical/circus-rs/src/browser';
import GradationEditor from '../lib/GradationEditor';
import PresetButtons from './PresetButtons';
import { VrStateChangeDispatcher } from '../util/createVrStateChangeDispatcher';
import { transferFunction as transferFunctionPresets } from '../data-sample/transfer-functions';

interface TransferFunctionPreviewProps {
  transferFunction: rs.TransferFunction;
}
class TransferFunctionPreview extends React.Component<
  TransferFunctionPreviewProps,
  {
    fr: number;
    to: number;
  }
> {
  private canvas: React.RefObject<HTMLCanvasElement>;
  constructor(props) {
    super(props);
    this.canvas = React.createRef();
    this.draw = this.draw.bind(this);
    this.state = {
      fr: 0,
      to: 1024
    };
    this.handleSetRange = this.handleSetRange.bind(this);
  }

  handleSetRange(fr: number, to: number) {
    this.setState({ ...this.state, fr, to });
  }

  draw() {
    const { transferFunction } = this.props;
    const { fr, to } = this.state;
    const canvasElement = this.canvas.current;
    const width = canvasElement.width;
    const height = canvasElement.height;

    const definition = rs.getDefinitionOfTransferFunction(transferFunction);

    const [minValue] = definition[0];
    const [maxValue] = definition[definition.length - 1];

    if (fr <= minValue && maxValue <= to) {
      const renderTransferFunction = rs.createTransferFunction(
        definition.map(([value, color]) => [
          ((value - fr) * 32768) / (to - fr),
          color
        ])
      );
      const tfBuffer = rs.buildTransferFunctionMap(
        renderTransferFunction,
        width
      );
      const rnBuffer = new Uint8Array(tfBuffer.length * height);
      for (let x = 0; x < tfBuffer.byteLength; x += 4) {
        const r = tfBuffer[x + 0];
        const g = tfBuffer[x + 1];
        const b = tfBuffer[x + 2];
        const a = tfBuffer[x + 3];

        let y = height;
        for (; y > 45; y--) {
          rnBuffer[y * tfBuffer.byteLength + x + 0] = r;
          rnBuffer[y * tfBuffer.byteLength + x + 1] = g;
          rnBuffer[y * tfBuffer.byteLength + x + 2] = b;
          rnBuffer[y * tfBuffer.byteLength + x + 3] = 0xff;
        }
        for (; y > 0; y--) {
          rnBuffer[y * tfBuffer.byteLength + x + 0] = r;
          rnBuffer[y * tfBuffer.byteLength + x + 1] = g;
          rnBuffer[y * tfBuffer.byteLength + x + 2] = b;
          rnBuffer[y * tfBuffer.byteLength + x + 3] = a;
        }
        y = Math.floor((height - 1) * (1 - a / 0xff));
        rnBuffer[y * tfBuffer.byteLength + x + 0] = 0;
        rnBuffer[y * tfBuffer.byteLength + x + 1] = 0xff;
        rnBuffer[y * tfBuffer.byteLength + x + 2] = 0xff;
        rnBuffer[y * tfBuffer.byteLength + x + 3] = 0xff;
      }
      const rnImage = new ImageData(
        Uint8ClampedArray.from(rnBuffer),
        width,
        height
      );
      const ctx = canvasElement.getContext('2d');
      ctx.putImageData(rnImage, 0, 0);
    } else {
      const ctx = canvasElement.getContext('2d');
      ctx.clearRect(0, 0, width, height);
    }
  }

  componentDidMount() {
    this.draw();
  }
  componentDidUpdate() {
    this.draw();
  }

  render() {
    const { fr, to } = this.state;
    return (
      <React.Fragment>
        <canvas
          ref={this.canvas}
          width="1024"
          height="50"
          style={{ width: '100%', height: '50px', border: '1px solid #ccc' }}
        ></canvas>
        <div className="d-flex justify-content-between">
          <div className="text-left">
            <select
              className="form-control form-control-sm"
              value={fr}
              onChange={ev => this.handleSetRange(Number(ev.target.value), to)}
            >
              <option value={-4096}>-4096</option>
              <option value={-2048}>-2048</option>
              <option value={-1024}>-1024</option>
              <option value={0}>0</option>
              <option value={1024}>1024</option>
              <option value={2048}>2048</option>
              <option value={4096}>4096</option>
            </select>
          </div>
          <div className="text-right">
            <select
              className="form-control form-control-sm"
              value={to}
              onChange={ev => this.handleSetRange(fr, Number(ev.target.value))}
            >
              <option value={-4096}>-4096</option>
              <option value={-2048}>-2048</option>
              <option value={-1024}>-1024</option>
              <option value={0}>0</option>
              <option value={1024}>1024</option>
              <option value={2048}>2048</option>
              <option value={4096}>4096</option>
            </select>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

const title = "Transfer Function";
const VrTransferFunctionSettings: React.FC<{
  viewState: rs.ViewState;
  dispatcher: VrStateChangeDispatcher;
}> = props => {
  const { dispatcher, viewState } = props;

  if (!viewState) return null;
  if (viewState.type !== 'vr') return (
    <div className="card mb-2">
      <div className="card-header p-1">{title}</div>
      <div className="card-body p-4 text-muted">
        <strong>{viewState.type}</strong> state is not supported.
      </div>
    </div>
  );

  const { transferFunction } = viewState;
  const setTransferFunction
    = (transferFunction: rs.TransferFunction) => dispatcher.setTransferFunction(transferFunction);

  const presets = transferFunctionPresets;

  const [width, setWidth] = React.useState('5000%');
  const [viewWindow, setViewWindow] = React.useState({
    level: NaN,
    width: NaN
  });

  return (
    <div className="card mb-2">
      <div className="card-header p-1">Transfer Function</div>
      <div className="card-body p-1">
        <div>
          <PresetButtons
            presets={presets}
            handleApply={tf => setTransferFunction(tf)}
          />
        </div>
        <div className="pl-3 py-2">
          <TransferFunctionPreview transferFunction={transferFunction} />
        </div>

        <div className="pl-3 py-2">
          <div className="form-row">
            <div className="col-12">
              <div className="table-responsive" id="gradation-scroll">
                <table className="table" style={{ width }}>
                  <tbody>
                    <tr>
                      <td>
                        <GradationGuide transferFunction={transferFunction} />
                        <GradationEditor
                          block
                          value={transferFunction}
                          onChange={setTransferFunction}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="col-12">
              <select
                className="form-control form-control-sm float-right col-auto"
                onChange={ev => setWidth(ev.target.value)}
                value={width}
              >
                <option value="100%">x 1</option>
                <option value="500%">x 5</option>
                <option value="1000%">x 10</option>
                <option value="5000%">x 50</option>
                <option value="10000%">x 100</option>
                <option value="100000%">x 1000</option>
                <option value="1000000%">x 10000</option>
              </select>
            </div>
          </div>
        </div>
        <GradationTable transferFunction={transferFunction} />

        <div>
          <div className="form-row mb-2">
            <div className="col-5">
              <div className="input-group input-group-sm">
                <div className="input-group-prepend">
                  <span className="input-group-text">WL</span>
                </div>
                <input
                  className="form-control form-control-sm"
                  type="text"
                  value={isNaN(viewWindow.level) ? '' : viewWindow.level}
                  onChange={ev =>
                    setViewWindow({ ...viewWindow, level: Number(ev.target.value) })
                  }
                />
              </div>
            </div>
            <div className="col-5">
              <div className="input-group input-group-sm">
                <div className="input-group-prepend">
                  <span className="input-group-text">WW</span>
                </div>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={isNaN(viewWindow.width) ? '' : viewWindow.width}
                  onChange={ev =>
                    setViewWindow({ ...viewWindow, width: Number(ev.target.value) })
                  }
                />
              </div>
            </div>
            <div className="col-2">
              <button
                className="btn btn-sm btn-secondary btn-block"
                onClick={ev =>
                  setTransferFunction(
                    rs.windowToTransferFunction(viewWindow, 1.0)
                  )
                }
              >Apply</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
const GradationGuide = props => {
  const { transferFunction } = props;
  // Adjust to gradiation preview bar
  const wrapperStyle: any = {
    position: 'relative',
    margin: '0 4px',
    width: 'calc(100% - 8px)',
    height: '1.6em',
    fontSize: '80%'
  };

  const entryStyle = (left): any => ({
    position: 'absolute',
    left,
    borderLeft: '1px solid #000',
    paddingBottom: '40px',
    paddingLeft: '3px'
  });

  return (
    <div style={wrapperStyle}>
      {rs
        .getDefinitionOfTransferFunction(transferFunction)
        .map(([value, color], idx) => {
          const left = transferFunction[idx + 1].position * 100 + '%';
          return (
            <div key={idx} style={entryStyle(left)}>
              {value}
            </div>
          );
        })}
    </div>
  );
};

const GradationTable = props => {
  const { transferFunction } = props;

  return (
    <div style={{ fontFamily: 'monospace' }}>
      {rs
        .getDefinitionOfTransferFunction(transferFunction)
        .map(([value, color], idx) => {
          return (
            <div key={idx} className="row mb-1">
              <div className="col-1 text-center">{idx + 1}</div>
              <div className="col-2 text-right">
                <a
                  href="#"
                  onClick={ev => {
                    ev.preventDefault();
                    const schrollElem = document.getElementById(
                      'gradation-scroll'
                    );
                    schrollElem.scrollLeft =
                      schrollElem.scrollWidth *
                      transferFunction[idx + 1].position -
                      schrollElem.clientWidth * 0.4;
                  }}
                >
                  {value}
                </a>
              </div>
              <div className="col-8">{color}</div>
            </div>
          );
        })}
    </div>
  );
};

export default VrTransferFunctionSettings;
