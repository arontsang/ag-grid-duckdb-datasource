import {FilterModel} from "ag-grid-community/dist/lib/interfaces/iFilter";
import {
    AdvancedFilterModel, TextAdvancedFilterModel
} from "ag-grid-community/dist/lib/interfaces/advancedFilterModel";


function isText(model: FilterModel | AdvancedFilterModel): model is TextAdvancedFilterModel {
    return model.filterType === 'text';
}

export function convertTextFiler(model: FilterModel | AdvancedFilterModel): string | undefined {
    if (!isText(model)) return undefined;

    switch (model.type){
        case "equals":
            return `${model.colId} = '${model.filter}'`;
        case "notEqual":
            return `${model.colId} = '${model.filter}'`;
        case "contains":
            return `${model.colId} like '%${model.filter}%'`;
        case "endsWith":
            return `${model.colId} like '${model.filter}%'`;
        case "startsWith":
            return `${model.colId} like '%${model.filter}'`;
        case "notContains":
            return `${model.colId} not like '%${model.filter}%'`;
        case "blank":
            return `${model.colId} is null`;
        case "notBlank":
            return `${model.colId} is not null`;
    }


}