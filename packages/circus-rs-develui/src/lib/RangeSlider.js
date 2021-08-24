import React from 'react';
import { MultiSlider } from './Slider';

const RangeSlider = props => {
  return <MultiSlider sliders={['lo', 'hi']} {...props} />;
};

RangeSlider.defaultProps = {
  min: 0,
  max: 100,
  value: [0, 100],
  step: 1,
  thumbTabIndex: 0
};

export default RangeSlider;
