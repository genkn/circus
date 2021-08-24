import { createSelector } from '@reduxjs/toolkit';
import * as rs from '@utrad-ical/circus-rs/src/browser';
import volumeLoaderSelector from './volumeLoaderSelector';

const webglCompositionSelector = createSelector(
    volumeLoaderSelector,
    (volumeLoader) => {
        const imageSource = new rs.WebGlRawVolumeMprImageSource({ volumeLoader });
        return new rs.Composition(imageSource);
    }
);

export default webglCompositionSelector;