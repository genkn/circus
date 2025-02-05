import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useCsResults } from '../CsResultsContext';
import { Display } from '../Display';
import { Button } from '../../ui/Button';

interface Choice {
  value: number | string;
  caption: string;
  color?: string;
}

interface PersonalChoice extends Choice {
  consensualMapsTo?: number | string;
}

interface ChoiceOptions {
  ui?: 'toggleButtons' | 'dropdown';
  multiple?: boolean;
  personal: (string | PersonalChoice)[];
  consensual?: (string | Choice)[];
  excludeFromActionLog?: boolean;
}

const normalizeChoiceOption = (def: string | Choice, index: number): Choice => {
  return typeof def === 'string' ? { value: index, caption: def } : def;
};

export const Choice: Display<ChoiceOptions, string | number> = props => {
  const {
    initialFeedbackValue,
    personalOpinions,
    onFeedbackChange,
    options: {
      ui = 'toggleButtons',
      personal: personalButtons,
      consensual: consensualButtons,
      excludeFromActionLog
    }
  } = props;
  const { consensual, editable, eventLogger } = useCsResults();

  const buttons = useMemo(
    () =>
      (consensual && consensualButtons
        ? consensualButtons
        : personalButtons
      ).map(normalizeChoiceOption),
    [consensual]
  );

  const personalCounts = useMemo(() => {
    const counts = new Map<string | number, number>();
    if (!consensual) return counts;
    personalOpinions.forEach(p => {
      const pdef = personalButtons
        .map(normalizeChoiceOption)
        .find(def => p.data == def.value) as PersonalChoice;
      const fb = pdef?.consensualMapsTo ?? p.data;
      return counts.set(fb, (counts.get(fb) ?? 0) + 1);
    });
    return counts;
  }, [personalOpinions]);

  const [selected, setSelected] = useState<string | number | undefined>(() => {
    if (!consensual) return initialFeedbackValue;
    // If all personal feedbacks agree, preselect it
    if (personalCounts.size === 1) return Array.from(personalCounts.keys())[0];
    return undefined;
  });

  useEffect(() => {
    // Reports the validation status
    const valid =
      typeof selected === 'number' &&
      buttons.find(def => def.value === selected) !== undefined;
    if (valid) {
      onFeedbackChange({ valid: true, value: selected! });
    } else {
      onFeedbackChange({ valid: false, error: 'Not selected' });
    }
  }, [selected]);

  const handleSelect = (selection: string | number) => {
    setSelected(selection);
    if (!excludeFromActionLog) {
      eventLogger(`Choice selection: ${selection}`, { selection });
    }
  };

  const UI: ChoiceUI = ui === 'dropdown' ? Select : ToggleButtons;
  return (
    <div>
      <UI
        choices={buttons}
        onSelect={handleSelect}
        opinions={personalCounts}
        selected={selected}
        disabled={!editable}
      />
    </div>
  );
};

type ChoiceUI = React.FC<{
  choices: Choice[];
  onSelect: (value: string | number) => void;
  opinions?: Map<string | number, number>;
  selected: string | number | undefined;
  disabled: boolean;
}>;

const ToggleButtons: ChoiceUI = props => {
  const { choices, onSelect, opinions, selected, disabled } = props;
  return (
    <ToggleButtonsContainer>
      {choices.map(choice => (
        <Button
          key={choice.value}
          onClick={() => onSelect(choice.value)}
          disabled={disabled}
          color={choice.color}
          selected={choice.value === selected}
        >
          {(opinions?.get(choice.value) ?? 0) > 0 && (
            <span className="opinions">{opinions?.get(choice.value)}</span>
          )}
          {choice.caption}
        </Button>
      ))}
    </ToggleButtonsContainer>
  );
};

const ToggleButtonsContainer = styled.div`
  display: flex;
  > * {
    flex: 1 1 auto;
  }
  gap: 2px;
  .opinions {
    border: 1px solid gray;
    background-color: rgba(0, 0, 0, 0.3);
    padding: 2px 4px;
    border-radius: 5px;
    font-size: 80%;
    margin-right: 3px;
  }
`;

const Select: ChoiceUI = props => {
  const { choices, onSelect, opinions, selected, disabled } = props;
  return (
    <select
      value={selected}
      onChange={ev => onSelect(ev.target.value)}
      disabled={disabled}
    >
      {choices.map(choice => (
        <option value={choice.value}>{choice.caption}</option>
      ))}
    </select>
  );
};
