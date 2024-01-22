import {FilterModel} from "ag-grid-community/dist/lib/interfaces/iFilter";
import {
    AdvancedFilterModel,
    NumberAdvancedFilterModel
} from "ag-grid-community/dist/lib/interfaces/advancedFilterModel";
import {convertScalarFiler} from "./scalar";

function isNumeric(model: FilterModel | AdvancedFilterModel): model is NumberAdvancedFilterModel {
    return model.type === 'number';
}

export function convertNumberFiler(model: FilterModel | AdvancedFilterModel): string | undefined {
    if (!isNumeric(model)) return undefined;

    return convertScalarFiler(model);
}

