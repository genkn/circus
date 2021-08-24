import produce from "immer";
import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { AppThunk, RootState } from './index';
import * as rs from '@utrad-ical/circus-rs/src/browser';

export interface NamedViewState {
  name: string;
  version: number;
  viewState: rs.ViewState;
}

const slice = createSlice({
  name: 'viewStates',
  initialState: {
    collection: [] as NamedViewState[],
  },
  reducers: {
    initializeViewState: (state, action: PayloadAction<{ name: string; viewState: rs.ViewState }>) => {
      const { name, viewState } = action.payload;
      if (!name || state.collection.some(namedViewState => namedViewState.name === name)) return;
      state.collection.push({ name, viewState, version: 0 });
    },

    updateViewState: (state, action: PayloadAction<{ name: string; viewState: rs.ViewState; version: number; }>) => {
      const { name, viewState, version } = action.payload;
      if (!name) return;
      const foundIndex = state.collection.findIndex(namedViewState => namedViewState.name === name);
      if (-1 !== foundIndex && state.collection[foundIndex].viewState !== viewState) {
        state.collection[foundIndex].viewState = viewState;
        state.collection[foundIndex].version = version;
      }
    },

    disposeViewState: (state, action: PayloadAction<{ name: string }>) => {
      const { name } = action.payload;
      if (!name) return;
      const foundIndex = state.collection.findIndex(namedViewState => namedViewState.name === name);
      if (-1 < foundIndex) {
        state.collection.splice(foundIndex, 1);
      }
    }
  }
});

export default slice.reducer;

export const { initializeViewState, disposeViewState } = slice.actions;

const moduleSelector = (state: RootState) => state.viewStates;

export const stateNamesSelector = createSelector(
  moduleSelector,
  (state) => state.collection
    .map(namedState => namedState.name)
    .filter((v, i, a) => i === a.indexOf(v))
    .sort()
);

export const createNamedStateSelector = (name: string) => createSelector(
  moduleSelector,
  (state) => {
    return state.collection.find(namedViewState => namedViewState.name === name);
  }
);

export const selectNamedState = (state: RootState, name: string) =>
  name ? moduleSelector(state).collection.find(namedViewState => namedViewState.name === name) : undefined;

export const selectViewState = (state: RootState, name: string) => {
  const foundNamedViewState = moduleSelector(state).collection.find(namedViewState => namedViewState.name === name);
  return foundNamedViewState
    ? foundNamedViewState.viewState
    : undefined;
};

// const delay = 50;
// const flushInterval = 200;
// let lastFlushed = 0;
// let next: any = null;
// export const updateViewState = (
//   { name, viewState, version }: { name: string; viewState: rs.ViewState; version: number; }
// ): AppThunk =>
//   async (dispatch) => {
//     if (next) clearTimeout(next);
//     const t = new Date().getTime();
//     if (lastFlushed < (t - flushInterval)) {
//       lastFlushed = t;
//       dispatch(slice.actions.updateViewState({ name, viewState, version }));
//     } else {
//       next = setTimeout(
//         () => {
//           lastFlushed = new Date().getTime();
//           dispatch(slice.actions.updateViewState({ name, viewState, version }))
//         },
//         delay
//       );
//     }
//     // dispatch(slice.actions.updateViewState({ name, viewState }));
//   };

export const updateViewState = (
  { name, viewState, version }: { name: string; viewState: rs.ViewState; version?: number; }
): AppThunk =>
  async (dispatch, getState) => {
    if (version === undefined) {
      const namedState = selectNamedState(getState(), name);
      version = namedState && namedState.version ? namedState.version + 1 : 1;
    }
    dispatch(slice.actions.updateViewState({ name, viewState, version }));
  };


export const registerViewState = ({ name, viewState }: { name: string, viewState: rs.ViewState }): AppThunk =>
  async (dispatch, getState) => {
    const currentViewState = selectNamedState(getState(), name);
    const action = currentViewState
      ? slice.actions.updateViewState({ name, viewState, version: currentViewState.version + 1 })
      : initializeViewState({ name, viewState });
    dispatch(action);
  };

type Writeable<T> = { -readonly [P in keyof T]: Writeable<T[P]> };
export interface ViewStateModifier {
  (viewState: Writeable<rs.ViewState>): void;
}

export const createViewStateModifier = (name: string) => {
  const namedStateSelector = createNamedStateSelector(name);

  return (modifier: ViewStateModifier): AppThunk =>
    (dispatch, getState) => {
      const currentNamedState = namedStateSelector(getState());
      const viewState = produce(currentNamedState.viewState, modifier);
      dispatch(updateViewState({ name, viewState, version: currentNamedState.version + 1 }));
    };
}
