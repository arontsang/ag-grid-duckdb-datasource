import {IServerSideGetRowsRequest} from "ag-grid-community/dist/lib/interfaces/iServerSideDatasource";
import {DuckDbDatasource} from "../index.mjs";
import {whereFragment} from "../filter";
import {IServerSideGetRowsParams} from "ag-grid-community";


export function buildSimpleQuery(params: IServerSideGetRowsParams, datasource: DuckDbDatasource): string {
    const {request} = params;
    return `
        WITH SOURCE AS (${datasource.source}),
        FILTERED AS (
            SELECT * FROM SOURCE
            ${whereFragment(request)}
        ),
        QUERY AS (
            SELECT * FROM FILTERED
            ${buildOrderBy(params)}
        )
        
        
    `
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