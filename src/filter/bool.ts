import {FilterModel} from "ag-grid-community/dist/lib/interfaces/iFilter";
import {
    AdvancedFilterModel, BooleanAdvancedFilterModel,
} from "ag-grid-community/dist/lib/interfaces/advancedFilterModel";


function isBool(model: FilterModel | AdvancedFilterModel): model is BooleanAdvancedFilterModel {
    return model.filterType === 'boolean';
}

export function convertNumberFiler(model: FilterModel | AdvancedFilterModel): string | undefined {
    if (!isBool(model)) return undefined;

    return `${model.colId} = ${model.filterType}`;
}
