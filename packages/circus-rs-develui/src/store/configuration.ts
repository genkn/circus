import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppThunk, RootState } from './index';

const labelHost: string =
  window.location.protocol +
  '//' +
  window.location.hostname +
  '' +
  (window.location.port && window.location.port !== '80'
    ? ':' + window.location.port
    : '');
const labelBasePath = '/sampledata/(seriesUid)/labels/';
const maskDataPath = '/sampledata/(seriesUid)/masks/vessel_mask.raw';

export type SeriesEntry = {
  selected: boolean;
  title: string;
  seriesUid: string;
  partialVolumeDescriptor: string;
  useLabelDataUrl: string; // '1'|'0'
  useMaskDataUrl: string; // '1'|'0'
}

const slice = createSlice({
  name: 'configuration',
  initialState: {
    appStorageKey: 'rs-demo-save',
    server: '',
    labelHost,
    labelBasePath,
    maskDataPath,
    seriesEntries: [] as SeriesEntry[],
  },
  reducers: {
    setServer: (state, action: PayloadAction<string>) => {
      state.server = action.payload;
    },
    setSeriesEntries: (state, action: PayloadAction<SeriesEntry[]>) => {
      state.seriesEntries = action.payload;
    },
  }
});

export default slice.reducer;

export const { setServer, setSeriesEntries } = slice.actions;

export const loadConfiguration = (): AppThunk => {
  return async (dispatch, getState) => {
    const appStorageKey = appStorageKeySelector(getState());
    try {
      const { server = '', seriesEntries = [] } = JSON.parse(localStorage.getItem(appStorageKey) || '{}');
      dispatch(setServer(server));
      dispatch(setSeriesEntries(seriesEntries));
    } catch (e) {
      dispatch(setServer(''));
      dispatch(setSeriesEntries([]));
    }
  };
};

export const saveConfiguration = (): AppThunk => {
  return async (_dispatch, getState) => {
    const state = getState();
    const configuration = moduleSelector(state);
    const appStorageKey = appStorageKeySelector(state);
    const { server = '', seriesEntries } = configuration;
    localStorage.setItem(appStorageKey, JSON.stringify({
      server, seriesEntries
    }));
  };
};

const moduleSelector = (state: RootState) => state.configuration;
export const appStorageKeySelector = createSelector(moduleSelector, (state) => state.appStorageKey);
export const serverSelector = createSelector(moduleSelector, (state) => state.server);

export const seriesEntriesSelector = createSelector(moduleSelector, (state) => state.seriesEntries);
export const seriesSelector = createSelector(seriesEntriesSelector, (seriesEntries) => {
  const entry = seriesEntries.find(entry => entry.selected);
  if (entry) {
    const { seriesUid, partialVolumeDescriptor, useLabelDataUrl, useMaskDataUrl } = entry;
    return { seriesUid, partialVolumeDescriptor, useLabelDataUrl, useMaskDataUrl };
  } else {
    return undefined;
  }
});

export const vrConfigSelector = createSelector(
  moduleSelector,
  seriesSelector,
  (config, series) => {
    const {
      server,
      labelHost,
      labelBasePath,
      maskDataPath,
    } = config;

    const {
      seriesUid,
      partialVolumeDescriptor,
      useMaskDataUrl,
      useLabelDataUrl,
    } = series;

    return {
      server,
      labelHost: useLabelDataUrl === '1' ? labelHost: undefined,
      labelBasePath: useLabelDataUrl === '1' ? labelBasePath.replace('(seriesUid)', seriesUid): undefined,
      maskDataPath: useMaskDataUrl === '1' ? maskDataPath.replace('(seriesUid)', seriesUid) : undefined,
      seriesUid,
      partialVolumeDescriptor,
    }
  }
);