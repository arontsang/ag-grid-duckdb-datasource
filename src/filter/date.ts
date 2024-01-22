import {FilterModel} from "ag-grid-community/dist/lib/interfaces/iFilter";
import {
    AdvancedFilterModel, DateAdvancedFilterModel,
    NumberAdvancedFilterModel
} from "ag-grid-community/dist/lib/interfaces/advancedFilterModel";
import {convertScalarFiler, operatorOf} from "./scalar";


function isDate(model: FilterModel | AdvancedFilterModel): model is DateAdvancedFilterModel {
    return model.type === 'number';
}

export function convertDateFiler(model: FilterModel | AdvancedFilterModel): string | undefined {
    if (!isDate(model)) return undefined;

    return convertScalarFiler(model);
}

