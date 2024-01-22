import {AdvancedFilterModel, JoinAdvancedFilterModel} from "ag-grid-community/dist/lib/interfaces/advancedFilterModel";
import {FilterModel} from "ag-grid-community/dist/lib/interfaces/iFilter";
import {convertFilter} from "./index";

export function convertJoinFilter(model: FilterModel | AdvancedFilterModel) {
    if (!isJoin(model)) return undefined;

    const ret = model.conditions
        .map(convertFilter)
        .join(` ${model.type} `);
    return `(${ret})`
}

function isJoin(model: FilterModel | AdvancedFilterModel): model is JoinAdvancedFilterModel {
    return model.type === 'join';
}