import {IServerSideGetRowsRequest} from "ag-grid-community/dist/lib/interfaces/iServerSideDatasource";
import {DuckDbDatasource} from "../index.mjs";
import {whereFragment} from "../filter";
import {IServerSideGetRowsParams} from "ag-grid-community";
import {buildGroupFilter} from "../grouping";


export function buildSimpleQuery(params: IServerSideGetRowsParams, datasource: DuckDbDatasource): string {
    const {request} = params;
    const sql = `
        WITH SOURCE AS (${datasource.source}),
        FILTERED AS (
            SELECT * FROM SOURCE
            ${whereFragment(request)}
        ),
        GROUPFILTERED AS (
            SELECT * FROM FILTERED
            ${buildGroupFilter(request)}
        ),
        QUERY AS (
            SELECT * FROM GROUPFILTERED
            ${buildOrderBy(params)}
        )
        
        
    `

    return sql;
}



function buildOrderBy({ request, api }: IServerSideGetRowsParams): string {
    if (request.sortModel.length == 0)
        return "";

    const sort = request.sortModel

        .filter(x => api.getColumn(x.colId)?.getColDef().field)
        .map(x => `${x.colId} ${x.sort}`)
        .join(", ")


    return `ORDER BY ${sort}`;
}