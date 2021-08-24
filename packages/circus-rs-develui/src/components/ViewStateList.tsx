import * as React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { stateNamesSelector } from '../store/viewStates';
import classNames from 'classnames';

const ViewStateList: React.FC<{
  stateName?: string;
  handleSetEditStateName: (stateName: string) => void;
}> = props => {
  const { stateName, handleSetEditStateName } = props;
  const stateNames = useSelector((state: RootState) => stateNamesSelector(state));

  return (
    <div className="list-group list-group-flush">
      {stateNames.map(n => (
        <a key={n}
          href={'#' + n}
          className={classNames('list-group-item list-group-item-light list-group-item-action p-1', { active: stateName === n })}
          onClick={ev => { ev.preventDefault(); handleSetEditStateName(n) }}
        >{n}</a>
      ))}
    </div>
  );
}

export default ViewStateList;
