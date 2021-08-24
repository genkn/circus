import { Action, configureStore } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import { ThunkAction } from 'redux-thunk';
import configuration from './configuration';
import viewStates from './viewStates';
import volume from './volume';

export const reducer = combineReducers({ configuration, volume, viewStates });

export const store = configureStore({ reducer });
export const dispatch = store.dispatch;
// export const dispatch = (a: any) => {
//   console.log(a);
//   store.dispatch(a);
// }

export type RootState = ReturnType<typeof reducer>;
export type AppDispatch = typeof dispatch;

/**
 * The thunk action type. See the advanced tutorial of Redux Toolkit.
 */
export type AppThunk = ThunkAction<
  void, // the thunk doesn't return anything
  RootState, // state type for getState
  unknown, // no extra argument
  Action<string> // dispatch will accept this action type
>;
