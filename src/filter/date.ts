import {FilterModel} from "ag-grid-community/dist/lib/interfaces/iFilter";
import {
    AdvancedFilterModel, DateAdvancedFilterModel,
    NumberAdvancedFilterModel
} from "ag-grid-community/dist/lib/interfaces/advancedFilterModel";
import {convertScalarFiler} from "./scalar";


function isDate(model: FilterModel | AdvancedFilterModel): model is DateAdvancedFilterModel {
    return model.filterType === 'date';
}

export function convertDateFiler(model: FilterModel | AdvancedFilterModel): string | undefined {
    if (!isDate(model)) return undefined;

    const ret = convertScalarFiler(model);
    return ret;
}

