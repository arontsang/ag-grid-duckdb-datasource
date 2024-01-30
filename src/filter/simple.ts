import {FilterModel} from "ag-grid-community/dist/lib/interfaces/iFilter";
import {AdvancedFilterModel} from "ag-grid-community/dist/lib/interfaces/advancedFilterModel";
import {convertFilterImpl} from "./index";


function isSimpleFilter(model: FilterModel | AdvancedFilterModel): model is FilterModel{
    return model.filterType == undefined;
}

export function convertSimpleFilter(model: FilterModel | AdvancedFilterModel) {
    if (!isSimpleFilter(model)) return undefined;

    const simpleFilters = Object.entries(model)
        .map(([colId, filter]) => ({ colId, ...filter }))
        .map(convertFilterImpl)
        .filter(x => x);

    if (simpleFilters.length === 0)
        return undefined;


    return `(${simpleFilters.join(" AND ")})`
}