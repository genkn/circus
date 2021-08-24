import { createSelector } from '@reduxjs/toolkit';
import { appStorageKeySelector, seriesSelector, serverSelector } from '../store/configuration';
import * as rs from '@utrad-ical/circus-rs/src/browser';
import toPartialVolumeDescriptor from './toPartialVolumeDescriptor';

const volumeLoaderSelector = createSelector(
    serverSelector,
    seriesSelector,
    appStorageKeySelector,
    (server, series, appStorageKey) => {
        const cache = new rs.IndexedDbVolumeCache(appStorageKey);

        const {
            seriesUid,
            partialVolumeDescriptor,
        } = series;

        const volumeLoader = new rs.RsVolumeLoader({
            rsHttpClient: new rs.RsHttpClient(server),
            seriesUid,
            partialVolumeDescriptor: toPartialVolumeDescriptor(partialVolumeDescriptor),
            cache
        });

        return volumeLoader;
    }
);

export default volumeLoaderSelector;