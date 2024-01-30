import {AdvancedFilterModel, JoinAdvancedFilterModel} from "ag-grid-community/dist/lib/interfaces/advancedFilterModel";
import {FilterModel} from "ag-grid-community/dist/lib/interfaces/iFilter";
import {convertFilterImpl} from "./index";

export function convertJoinFilter(model: FilterModel | AdvancedFilterModel) {
    if (!isJoin(model)) return undefined;

    const ret = model.conditions
        .map(convertFilterImpl)
        .join(` ${model.type} `);
    return `(${ret})`
}

function isJoin(model: FilterModel | AdvancedFilterModel): model is JoinAdvancedFilterModel {
    return model.type === 'join';
}