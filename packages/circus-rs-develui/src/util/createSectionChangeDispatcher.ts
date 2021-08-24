import { AppDispatch, AppThunk } from "../store";
import { ViewStateModifier } from "../store/viewStates";

const createSectionChangeDispatcher = (dispatch: AppDispatch, actions: {
    modifyOperation: (modifier: ViewStateModifier) => AppThunk
}) => ({
    setOrigin0: (value) => dispatch(actions.modifyOperation((viewState) => {
        viewState.section.origin[0] = Number(value) || 0;
    })),
    setOrigin1: (value) => dispatch(actions.modifyOperation((viewState) => {
        viewState.section.origin[1] = Number(value) || 0;
    })),
    setOrigin2: (value) => dispatch(actions.modifyOperation((viewState) => {
        viewState.section.origin[2] = Number(value) || 0;
    })),
    setXAxis0: (value) => dispatch(actions.modifyOperation((viewState) => {
        viewState.section.xAxis[0] = Number(value) || 0;
    })),
    setXAxis1: (value) => dispatch(actions.modifyOperation((viewState) => {
        viewState.section.xAxis[1] = Number(value) || 0;
    })),
    setXAxis2: (value) => dispatch(actions.modifyOperation((viewState) => {
        viewState.section.xAxis[2] = Number(value) || 0;
    })),
    setYAxis0: (value) => dispatch(actions.modifyOperation((viewState) => {
        viewState.section.yAxis[0] = Number(value) || 0;
    })),
    setYAxis1: (value) => dispatch(actions.modifyOperation((viewState) => {
        viewState.section.yAxis[1] = Number(value) || 0;
    })),
    setYAxis2: (value) => dispatch(actions.modifyOperation((viewState) => {
        viewState.section.yAxis[2] = Number(value) || 0;
    })),
});

export default createSectionChangeDispatcher;

export type SectionChangeDispatcher = ReturnType<typeof createSectionChangeDispatcher>;

