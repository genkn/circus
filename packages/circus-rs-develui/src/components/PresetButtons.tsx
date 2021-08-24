import * as React from 'react';

const PresetButtons = props => {
  const { presets, handleApply } = props;
  return (
    <div className="p-2 bg-light">
      {Object.entries(presets).map(([name, tf], idx) => (
        <a
          href={'#' + idx}
          key={idx}
          className="d-inline-block mr-3"
          onClick={ev => {
            ev.preventDefault();
            handleApply(tf);
          }}
        >
          {name}
        </a>
      ))}
    </div>
  );
};

export default PresetButtons;
