import { createSelector } from '@reduxjs/toolkit';
import { seriesSelector, serverSelector } from '../store/configuration';
import * as rs from '@utrad-ical/circus-rs/src/browser';
import toPartialVolumeDescriptor from './toPartialVolumeDescriptor';

const dynamicCompositionSelector = createSelector(
    serverSelector,
    seriesSelector,
    (server, series) => {
        const {
            seriesUid,
            partialVolumeDescriptor,
        } = series;

        const imageSource = new rs.DynamicMprImageSource({
            rsHttpClient: new rs.RsHttpClient(server),
            seriesUid,
            partialVolumeDescriptor: toPartialVolumeDescriptor(partialVolumeDescriptor)
        });

        return new rs.Composition(imageSource);
    }
);

export default dynamicCompositionSelector;