import { createSelector } from '@reduxjs/toolkit';
import * as rs from '@utrad-ical/circus-rs/src/browser';
import volumeLoaderSelector from './volumeLoaderSelector';

const rawVolumeCompositionSelector = createSelector(
    volumeLoaderSelector,
    (volumeLoader) => {
        const imageSource = new rs.RawVolumeMprImageSource({ volumeLoader });
        return new rs.Composition(imageSource);
    }
);

export default rawVolumeCompositionSelector;