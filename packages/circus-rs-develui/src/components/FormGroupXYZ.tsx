import * as React from 'react';

interface FormGroupXYZProps {
  values: {
    x: number;
    y: number;
    z: number;
  };
  ranges: {
    x: [number, number],
    y: [number, number],
    z: [number, number],
  };
  changeHandlers: {
    x: (value: number) => void;
    y: (value: number) => void;
    z: (value: number) => void;
  };
  step?: number;
}
const FormGroupXYZ: React.FC<FormGroupXYZProps> = (props) => {
  const { values, ranges, changeHandlers, step = 0.1 } = props;

  return (
    <>
      <div className="form-row">
        <div className="col-4">
          <div className="input-group input-group-sm">
            <div className="input-group-prepend">
              <span className="input-group-text">X</span>
            </div>
            <input
              type="number"
              className="form-control form-control-sm"
              step={step}
              value={values.x}
              onChange={(ev) => changeHandlers.x(Number(ev.target.value))}
            />
          </div>
        </div>
        <div className="col-4">
          <div className="input-group input-group-sm">
            <div className="input-group-prepend">
              <span className="input-group-text">Y</span>
            </div>
            <input
              type="number"
              className="form-control form-control-sm"
              step={step}
              value={values.y}
              onChange={(ev) => changeHandlers.y(Number(ev.target.value))}
            />
          </div>
        </div>
        <div className="col-4">
          <div className="input-group input-group-sm">
            <div className="input-group-prepend">
              <span className="input-group-text">Z</span>
            </div>
            <input
              type="number"
              className="form-control form-control-sm"
              step={step}
              value={values.z}
              onChange={(ev) => changeHandlers.z(Number(ev.target.value))}
            />
          </div>
        </div>
      </div>
      <div className="d-flex">
        <small className="mx-1">X</small>
        <input type="range" className="custom-range"
          min={ranges.x[0]}
          max={ranges.x[1]}
          step={step}
          value={values.x}
          onChange={(ev) => changeHandlers.x(Number(ev.target.value))}
        />
      </div>
      <div className="d-flex">
        <small className="mx-1">Y</small>
        <input type="range" className="custom-range"
          min={ranges.y[0]}
          max={ranges.y[1]}
          step={step}
          value={values.y}
          onChange={(ev) => changeHandlers.y(Number(ev.target.value))}
        />
      </div>
      <div className="d-flex">
        <small className="mx-1">Z</small>
        <input type="range" className="custom-range"
          min={ranges.z[0]}
          max={ranges.z[1]}
          step={step}
          value={values.z}
          onChange={(ev) => changeHandlers.z(Number(ev.target.value))}
        />
      </div>
    </>
  )
}

export default FormGroupXYZ;