import { AppDispatch, AppThunk } from "../store";
import { ViewStateModifier } from "../store/viewStates";
import * as rs from '@utrad-ical/circus-rs/src/browser';
import { InterpolationMode } from '@utrad-ical/circus-rs/src/browser/ViewState';

function asVrViewState(arg: any): arg is rs.VrViewState {
  return true;
}

const createVrStateChangeDispatcher = (
  dispatch: AppDispatch,
  actions: { modifyOperation: (modifier: ViewStateModifier) => AppThunk }
) => ({
  setEnableMask(value: boolean) {
    dispatch(
      actions.modifyOperation(viewState => {
        if (!asVrViewState(viewState)) return;
        viewState.enableMask = value;
      })
    );
  },
  setHighlightedLabelIndex(value: number) {
    dispatch(
      actions.modifyOperation(viewState => {
        if (!asVrViewState(viewState)) return;
        viewState.highlightedLabelIndex = value;
      })
    );
  },
  setDebugMode: (value: number) =>
    dispatch(
      actions.modifyOperation(viewState => {
        if (!asVrViewState(viewState)) return;
        viewState.debugMode = value;
      })
    ),

  setTransferFunction(value: rs.TransferFunction) {
    dispatch(
      actions.modifyOperation(viewState => {
        if (!asVrViewState(viewState)) return;
        viewState.transferFunction = value;
      })
    );
  },
  setRayIntensity(value: number) {
    dispatch(
      actions.modifyOperation(viewState => {
        if (!asVrViewState(viewState)) return;
        viewState.rayIntensity = value;
      })
    );
  },
  setQuality(value: number) {
    dispatch(
      actions.modifyOperation(viewState => {
        if (!asVrViewState(viewState)) return;
        viewState.quality = value;
      })
    );
  },
  setInterpolationMode(value: InterpolationMode) {
    dispatch(
      actions.modifyOperation(viewState => {
        if (!asVrViewState(viewState)) return;
        viewState.interpolationMode = value;
      })
    );
  },
  setSubVolumeRangeX(offset0: number, offset1: number, voxelCount?: [number, number, number]) {
    dispatch(
      actions.modifyOperation(viewState => {
        if (!asVrViewState(viewState)) return;

        if (viewState.subVolume) {
          viewState.subVolume.offset[0] = offset0;
          viewState.subVolume.dimension[0] = offset1 - offset0;
        } else if (voxelCount) {
          return {
            ...viewState,
            subVolume: {
              offset: [offset0, 0, 0],
              dimension: [offset1 - offset0, voxelCount[1], voxelCount[2]]
            }
          };
        }
      })
    );
  },
  setSubVolumeRangeY(offset0: number, offset1: number, voxelCount?: [number, number, number]) {
    dispatch(
      actions.modifyOperation(viewState => {
        if (!asVrViewState(viewState)) return;

        if (viewState.subVolume) {
          viewState.subVolume.offset[1] = offset0;
          viewState.subVolume.dimension[1] = offset1 - offset0;
        } else if (voxelCount) {
          return {
            ...viewState,
            subVolume: {
              offset: [0, offset0, 0],
              dimension: [voxelCount[0], offset1 - offset0, voxelCount[2]]
            }
          };
        }
      })
    );
  },
  setSubVolumeRangeZ(offset0: number, offset1: number, voxelCount?: [number, number, number]) {
    dispatch(
      actions.modifyOperation(viewState => {
        if (!asVrViewState(viewState)) return;

        if (viewState.subVolume) {
          viewState.subVolume.offset[2] = offset0;
          viewState.subVolume.dimension[2] = offset1 - offset0;
        } else if (voxelCount) {
          return {
            ...viewState,
            subVolume: {
              offset: [0, 0, offset0],
              dimension: [voxelCount[0], voxelCount[1], offset1 - offset0]
            }
          };
        }
      })
    );
  },
});

export default createVrStateChangeDispatcher;

export type VrStateChangeDispatcher = ReturnType<
  typeof createVrStateChangeDispatcher
>;
