import {IServerSideGetRowsRequest} from "ag-grid-community/dist/lib/interfaces/iServerSideDatasource";
import {FilterModel} from "ag-grid-community/dist/lib/interfaces/iFilter";
import {
    AdvancedFilterModel,
    ColumnAdvancedFilterModel, JoinAdvancedFilterModel, NumberAdvancedFilterModel
} from "ag-grid-community/dist/lib/interfaces/advancedFilterModel";
import {convertNumberFiler} from "./number";
import {convertTextFiler} from "./text";
import {convertJoinFilter} from "./join";


export function createFilterSql(request: IServerSideGetRowsRequest): string[] {
    const ret = new Array<string>();

    request.groupKeys.forEach(function (groupKey, index){
        const columnName = request.rowGroupCols[index].field;
        ret.push(`"${columnName}" = '${groupKey}'`)
    });

    if (request.filterModel){
        request.filterModel


    }


    return ret;
}







export function convertFilter(model: FilterModel | AdvancedFilterModel): string | undefined {
    return convertNumberFiler(model)
        ?? convertTextFiler(model)
        ?? convertJoinFilter(model)
        ?? convertNumberFiler(model);
}