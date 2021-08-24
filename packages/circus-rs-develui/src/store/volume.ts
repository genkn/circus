import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { AppThunk, RootState } from './index';
import * as rs from '@utrad-ical/circus-rs/src/browser';
import { DicomVolumeMetadata } from '@utrad-ical/circus-rs/src/browser/image-source/volume-loader/DicomVolumeLoader';
import toPartialVolumeDescriptor, { PartialVolumeDescriptor } from '../util/toPartialVolumeDescriptor';

const slice = createSlice({
  name: 'volume',
  initialState: {
    server: '',
    seriesUid: '',
    partialVolumeDescriptor: undefined as PartialVolumeDescriptor | undefined,
    metadata: undefined as DicomVolumeMetadata | undefined
  },
  reducers: {
    clear: (state) => {
      state.server = '';
      state.seriesUid = '';
      state.partialVolumeDescriptor = undefined;
      state.metadata = undefined;
    },
    setRsServer: (state, action: PayloadAction<{ server: string; }>) => {
      const { server } = action.payload;
      state.server = server;
    },
    setVolumeMetadata: (
      state,
      action: PayloadAction<{
        seriesUid: string;
        partialVolumeDescriptor: string;
        metadata: DicomVolumeMetadata;
      }>
    ) => {
      const { seriesUid, partialVolumeDescriptor, metadata } = action.payload;
      state.seriesUid = seriesUid;
      state.partialVolumeDescriptor = toPartialVolumeDescriptor(partialVolumeDescriptor);
      state.metadata = metadata;
    },
  }
});


export default slice.reducer;

// action
export const { setRsServer } = slice.actions;

// selector
const moduleSelector = (state: RootState) => state.volume;

// operation
export const loadVolumeMetadata = (seriesUid: string, partialVolumeDescriptor: string): AppThunk =>
  async (dispatch, getState) => {
    const server = moduleSelector(getState()).server;
    const volumeLoader = new rs.RsVolumeLoader({
      rsHttpClient: new rs.RsHttpClient(server),
      seriesUid,
      partialVolumeDescriptor: toPartialVolumeDescriptor(partialVolumeDescriptor)
    });
    try {
      const metadata = await volumeLoader.loadMeta();
      dispatch(slice.actions.setVolumeMetadata({ seriesUid, partialVolumeDescriptor, metadata }));
    } catch (e) {
      throw e;
    }
  };

export const metadataSelector = createSelector(
  moduleSelector,
  (state) => state.metadata
);