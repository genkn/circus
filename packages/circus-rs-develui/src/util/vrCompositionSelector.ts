import { createSelector } from '@reduxjs/toolkit';
import { appStorageKeySelector, vrConfigSelector } from '../store/configuration';
import * as rs from '@utrad-ical/circus-rs/src/browser';
import volumeLoaderSelector from './volumeLoaderSelector';

const vrCompositionSelector = createSelector(
    vrConfigSelector,
    volumeLoaderSelector,
    appStorageKeySelector,
    (config, volumeLoader, appStorageKey) => {
        const cache = new rs.IndexedDbVolumeCache(appStorageKey);

        const {
            labelHost,
            labelBasePath,
            maskDataPath,
            seriesUid,
        } = config;

        const labelLoader = (labelHost && labelBasePath)
            ? new rs.CsLabelLoader({
                rsHttpClient: new rs.RsHttpClient(labelHost),
                basePath: labelBasePath
            })
            : undefined;

        const maskLoader = (labelHost && maskDataPath)
            ? new rs.VesselSampleLoader({
                host: labelHost,
                path: maskDataPath,
                cache
            })
            : undefined;

        // Prepare image source.
        // rs.VolumeRenderingImageSource.readyBeforeVolumeLoaded = true;
        // rs.VolumeRenderingImageSource.defaultDebugMode = 2;
        const imageSource = new rs.VolumeRenderingImageSource({
            volumeLoader,
            maskLoader,
            labelLoader
        });

        return new rs.Composition(imageSource);
    }
);

export default vrCompositionSelector;