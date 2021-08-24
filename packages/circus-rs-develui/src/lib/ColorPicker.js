import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import Dropdown from 'react-bootstrap/lib/Dropdown';
import tinycolor from 'tinycolor2';
import keycode from 'keycode';
import classnames from 'classnames';
import Slider from './Slider';
import styled from 'styled-components';

// Colors based on simple-color-picker released under the MIT License
// Copyright (c) 2010 Rachel Carvalho <rachel.carvalho@gmail.com>
// prettier-ignore
const defaultColors = [
  '#000000', '#444444', '#666666', '#999999',
  '#cccccc', '#eeeeee', '#f3f3f3', '#ffffff',
  '#ff0000', '#ff9900', '#ffff00', '#00ff00',
  '#00ffff', '#0000ff', '#9900ff', '#ff00ff',
  '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3',
  '#d0e0e3', '#cfe2f3', '#d9d2e9', '#ead1dc',
  '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8',
  '#a2c4c9', '#9fc5e8', '#b4a7d6', '#d5a6bd',
  '#e06666', '#f6b26b', '#ffd966', '#93c47d',
  '#76a5af', '#6fa8dc', '#8e7cc3', '#c27ba0',
  '#cc0000', '#e69138', '#f1c232', '#6aa84f',
  '#45818e', '#3d85c6', '#674ea7', '#a64d79',
  '#990000', '#b45f06', '#bf9000', '#38761d',
  '#134f5c', '#0b5394', '#351c75', '#741b47',
  '#660000', '#783f04', '#7f6000', '#274e13',
  '#0c343d', '#073763', '#20124d', '#4C1130'
];

const StyledDropdown = styled(Dropdown)`
  .dropdown-menu {
    min-width: auto;
    padding: 10px;
  }

  .color-picker-box-preview {
    display: inline-block;
    height: 1em;
    width: 1.5em;
    margin-right: 0.3em;
    border: 1px solid gray;
  }
`;

const noop = () => {};

const ColorPicker = props => {
  const {
    value,
    withAlpha,
    colors,
    showColorCode,
    bsSize = undefined,
    noCaret = false,
    onChange = noop,
    onToggle = noop,
    bsStyle = 'default',
    block = false,
    boxPreview = false,
    className,
    disabled
  } = props;

  const tc = tinycolor(props.value || '#ffffff');
  const style = {
    backgroundColor: tc.toHexString(),
    color: tinycolor.mostReadable(tc, ['#000', '#fff']).toHexString()
  };
  const classNames = classnames(
    'color-picker',
    {
      'color-picker-with-color-code': showColorCode,
      'dropdown-block': block
    },
    className
  );

  return (
    <StyledDropdown
      id="color-picker-dropdown"
      className={classNames}
      disabled={disabled}
      onToggle={onToggle}
    >
      <Dropdown.Toggle
        className="color-picker-toggle"
        style={boxPreview ? {} : style}
        bsSize={bsSize}
        bsStyle={bsStyle}
        block={block}
        noCaret={noCaret}
      >
        <span>
          {boxPreview && (
            <div className="color-picker-box-preview" style={style} />
          )}
          {showColorCode ? (
            withAlpha ? (
              tc.toHex8String()
            ) : (
              tc.toHexString()
            )
          ) : (
            <span>&thinsp;</span>
          )}
        </span>
      </Dropdown.Toggle>
      <Dropdown.Menu>
        <li role="presentation">
          <ColorPalette
            colors={colors}
            value={value}
            withAlpha={withAlpha}
            onChange={onChange}
            itemTabIndex={-1}
          />
        </li>
      </Dropdown.Menu>
    </StyledDropdown>
  );
};

ColorPicker.defaultProps = {
  colors: defaultColors
};

ColorPicker.propTypes = {
  colors: PropTypes.arrayOf(PropTypes.string),
  value: PropTypes.string,
  withAlpha: PropTypes.bool,
  onChange: PropTypes.func
};

export default ColorPicker;

const StyledDiv = styled.div`
  .color-picker-palette {
    padding-left: 1px;
    padding-top: 1px;
    width: ${14 * 8 + 2}px;
    display: flex;
    flex-flow: row wrap;
    .color-picker-palette-color {
      display: block;
      width: 15px;
      height: 15px;
      margin-left: -1px;
      margin-top: -1px;
      border: 1px solid white;
      &:hover {
        z-index: 1;
        border: 1px solid gray;
      }
      &.selected {
        z-index: 2;
        border: 1px solid black;
      }
      &:focus {
        z-index: 3;
      }
    }
    &.disabled {
      .color-picker-palette-color {
        &:hover {
          border-color: white;
        }
        &.selected {
          border: 1px solid gray;
        }
      }
    }
  }

  .color-picker-alpha-slider {
    width: 110px;
  }
`;

export const ColorPalette = props => {
  const {
    colors,
    value,
    onChange = () => {},
    disabled,
    withAlpha,
    itemsPerRow,
    className
  } = props;
  const [hasFocus, setHasFocus] = useState(false);
  const paletteRef = useRef();

  const focusRelative = (ev, delta) => {
    const children = Array.from(paletteRef.current.children);

    let curIndex;
    if (children.some(el => el === document.activeElement)) {
      // if fired from an already-focused item...
      curIndex = children.indexOf(ev.target);
    } else {
      curIndex = colors.indexOf(value);
      if (curIndex < 0) curIndex = 0;
    }

    const nextIndex = curIndex + delta;
    const nextNode = children[nextIndex];
    if (nextNode) {
      nextNode.focus();
      ev.preventDefault();
      ev.stopPropagation();
    }
  };

  const handleKeyDown = ev => {
    switch (keycode(ev)) {
      case 'enter':
      case 'space':
        handleSelect(ev);
        ev.preventDefault();
        break;
      case 'right':
        focusRelative(ev, 1);
        break;
      case 'left':
        focusRelative(ev, -1);
        break;
      case 'up':
        focusRelative(ev, -itemsPerRow);
        break;
      case 'down':
        focusRelative(ev, itemsPerRow);
        break;
    }
  };

  const handleSelect = ev => {
    if (disabled) return;
    const children = Array.from(paletteRef.current.children);
    const index = children.indexOf(ev.target);
    const rgbColor = colors[index];
    const color = withAlpha
      ? tinycolor(rgbColor)
          .setAlpha(tinycolor(value).getAlpha())
          .toHex8String()
      : rgbColor;
    onChange(color);
  };

  const handleAlphaChange = newAlpha => {
    const color = tinycolor(value)
      .setAlpha(newAlpha)
      .toHex8String();
    onChange(color);
  };

  const handleFocus = ev => {
    if (ev.target !== paletteRef.current) return;
    const index = colors.indexOf(value);
    const children = Array.from(paletteRef.current.children);
    if (index >= 0) {
      children[index].focus();
    } else if (children.length) {
      children[0].focus();
    }
    setHasFocus(true);
  };

  const handleBlur = () => {
    setHasFocus(false);
  };

  const rgbValue = withAlpha ? tinycolor(value).toHexString() : value;
  const alphaValue = withAlpha ? tinycolor(value).getAlpha() : 1;

  const classNames = classnames(
    'color-picker-palette',
    { disabled },
    className
  );

  return (
    <StyledDiv className="color-picker-container">
      <div
        tabIndex={disabled ? undefined : hasFocus ? undefined : 0}
        ref={paletteRef}
        className={classNames}
        onKeyDown={handleKeyDown}
        onClick={handleSelect}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        {colors.map((color, i) => (
          <div
            tabIndex={disabled ? undefined : -1}
            className={classnames('color-picker-palette-color', {
              selected: color === rgbValue
            })}
            style={{ backgroundColor: color }}
            key={i}
          />
        ))}
      </div>
      {withAlpha && (
        <Slider
          className="color-picker-alpha-slider"
          disabled={disabled}
          value={alphaValue}
          min={0}
          max={1}
          step={0.01}
          onChange={handleAlphaChange}
        />
      )}
    </StyledDiv>
  );
};

ColorPalette.defaultProps = {
  colors: defaultColors,
  itemsPerRow: 8
};

ColorPalette.propTypes = {
  colors: PropTypes.arrayOf(PropTypes.string),
  value: PropTypes.string,
  itemsPerRow: PropTypes.number,
  onChange: PropTypes.func
};
