import * as React from 'react';

const FormGroupNumberRange: React.FC<any> = props => {
  const {
    title,
    min,
    max,
    step,
    name,
    value,
    onChange,
    col = 6,
    align = 'left'
  } = props;

  return (
    <div className="form-group">
      <div className="form-row">
        <div className={`col-${12 - col - 2} text-${align}`}>
          {title && <label>{title}</label>}
        </div>
        <div className={`col-${col}`}>
          <input
            type="range"
            className="custom-range"
            min={min}
            max={max}
            step={step}
            name={name}
            value={value}
            onChange={onChange}
          />
        </div>
        <div className="col-2">
          <input
            type="number"
            className="form-control form-control-sm"
            min={min}
            max={max}
            step={step}
            name={name}
            value={value}
            onChange={onChange}
          />
        </div>
      </div>
    </div>
  );
};

export default FormGroupNumberRange;
