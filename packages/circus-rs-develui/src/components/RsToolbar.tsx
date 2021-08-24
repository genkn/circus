import * as React from 'react';
import { ToolName } from '../util/tool';

const RsToolbar: React.FC<{
  tools?: ToolName[];
  activeToolName?: string;
  handleSelectTool?: (toolName: string) => void;
}> = (props) => {
  const { activeToolName, handleSelectTool = () => { } } = props;
  const {
    tools = [
      'hand',
      'window',
      'zoom',
      'pager',
      'celestialRotate',
      // 'brush',
      // 'eraser',
      // 'bucket',
      // 'circle',
      // 'rectangle',
      // 'point',
      // 'ellipsoid',
      // 'cuboid'
    ]
  } = props;

  return (
    <ul className="circus-rs-toolbar">
      {tools.map(toolName => (
        <ToolbarItem
          key={toolName}
          toolName={toolName}
          active={toolName === activeToolName}
          onClick={() => handleSelectTool(toolName)}
        />
      ))}
    </ul>
  )
}

const ToolbarItem: React.FC<{
  toolName: ToolName;
  active?: boolean;
  onClick?: (ev: any) => void;
}> = (props) => {
  const { toolName, active, onClick = () => { } } = props;
  const kebabToolName = toKebabCase(toolName);
  return (
    <li className="circus-rs-toolbar-item">
      <button className={`${active ? 'active' : ''} circus-rs-toolbutton circus-rs-tool-${kebabToolName} rs-icon-${kebabToolName}`} type="button"
        onClick={onClick}
      ></button>
    </li>
  )
}
function toKebabCase(str: string): string {
  return str.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
}

export default RsToolbar;