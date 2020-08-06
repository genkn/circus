import React from 'react';
import ShrinkSelect from '@smikitky/rb-components/lib/ShrinkSelect';
import TimeDisplay from 'components/TimeDisplay';

const Item: React.FC<{
  value: any;
}> = props => {
  const revision = props.value;
  return (
    <span className="revision-selector-item">
      <span className="date">
        <TimeDisplay value={revision.date} />
      </span>
      <span className="status label label-default">{revision.status}</span>
      <span className="description">{revision.description}</span>
      <span className="creator">{revision.creator}</span>
    </span>
  );
};

const RevisionSelector: React.FC<{
  revisions: any[];
  selected: number;
  onSelect: (index: number) => void;
}> = React.memo(props => {
  const { onSelect, revisions = [], selected } = props;

  const handleSelect = (value: string) => {
    const index = parseInt(/(\d+)$/.exec(value)![1]);
    onSelect(index);
  };

  const opts: { [key: string]: any } = {};
  revisions
    .slice()
    .reverse()
    .forEach((r, i) => {
      const originalIndex = revisions.length - i - 1;
      opts[`rev${originalIndex}`] = { caption: <Item value={r} /> };
    });
  const sel = `rev${selected}`;
  return <ShrinkSelect options={opts} value={sel} onChange={handleSelect} />;
});

export default RevisionSelector;