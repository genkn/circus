import * as React from 'react';

const FormGroupSelection: React.FC<any> = props => {
  const {
    name,
    title,
    options,
    value,
    onChange,
    type = 'radio',
    valueType
  } = props;

  const valueFilter = ((type) => {
    switch (type) {
      case 'boolean':
        return (val: any) => Number(val) > 0;
      case 'number':
        return (val: any) => (Number(val) === NaN ? undefined : Number(val));
      default:
        return (val: any) => val;
    }
  })(valueType);

  return (
    <div className="form-group">
      <div className="form-row">
        <div className="col-4">
          <label>{title}</label>
        </div>
        <div className="col-8">
          {Object.entries(options).map(([optVal, optLabel], idx) => (
            <span key={idx} className={`custom-control custom-${type} mr-2`}>
              <input
                type={type}
                name={name}
                className="custom-control-input"
                id={(name + idx).replace(/\s+/, '')}
                value={optVal}
                checked={valueFilter(optVal) === valueFilter(value)}
                onChange={ev => {
                  onChange({
                    ...ev,
                    target: { name, value: valueFilter(optVal) }
                  });
                }}
              />
              <label
                className="custom-control-label"
                htmlFor={(name + idx).replace(/\s+/, '')}
              >
                <small>{optLabel}</small>
              </label>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FormGroupSelection;
