import { RootState } from '../store';
import dynamicCompositionSelector from './dynamicCompositionSelector';
import rawVolumeCompositionSelector from './rawVolumeCompositionSelector';
import vrCompositionSelector from './vrCompositionSelector';
import webglCompositionSelector from './webglCompositionSelector';

const selectComposition = (state: RootState, name: 'dynamic' | 'rawVolume' | 'vr' | 'webgl') => {
    switch (name) {
        case 'dynamic':
            return dynamicCompositionSelector(state);
        case 'rawVolume':
            return rawVolumeCompositionSelector(state);
        case 'vr':
            return vrCompositionSelector(state);
        case 'webgl':
            return webglCompositionSelector(state);
        default:
            return undefined;
    }
}

export default selectComposition;