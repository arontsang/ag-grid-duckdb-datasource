import {
    DateAdvancedFilterModel,
    NumberAdvancedFilterModel,
    ScalarAdvancedFilterModelType
} from "ag-grid-community/dist/lib/interfaces/advancedFilterModel";
import {assertUnreachable} from "../never";

export function convertScalarFiler(model: DateAdvancedFilterModel | NumberAdvancedFilterModel): string | undefined {

    if (model.type == "blank")
        return `${model.colId} is null`;
    if (model.type == "notBlank")
        return `${model.colId} is not null`;

    return `${model.colId} ${operatorOf(model.type)} ${model.filter}`;
}


function operatorOf(model: Exclude<ScalarAdvancedFilterModelType, "blank" | "notBlank">): string {
    if (model == 'equals') return '='
    if (model == 'notEqual') return '<>'
    if (model == 'greaterThan') return '>'
    if (model == 'greaterThanOrEqual') return '>='
    if (model == 'lessThan') return '<'
    if (model == 'lessThanOrEqual') return '<='

    assertUnreachable(model);
}