import {FilterModel} from "ag-grid-community/dist/lib/interfaces/iFilter";
import {
    AdvancedFilterModel,
    NumberAdvancedFilterModel
} from "ag-grid-community/dist/lib/interfaces/advancedFilterModel";
import {convertScalarFiler} from "./scalar";


interface SetFilterModel {
    filterType: 'set'
    values: unknown[]
    colId: string
}

function isSet(model: FilterModel | AdvancedFilterModel): model is SetFilterModel {
    return model.filterType === 'set';
}

export function convertSetFiler(model: FilterModel | AdvancedFilterModel): string | undefined {
    if (!isSet(model)) return undefined;

    function printValue(value: any): string | number {
        if (!value) return "''";
        if (typeof value == 'number') return value;

        return `'${value}'`;
    }

    const values = model.values.map(x => printValue(x)).join(",");
    if (!values.length) return undefined
    return `${model.colId} IN (${values})`;
}

