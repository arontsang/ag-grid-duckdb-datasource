import {DuckDbDatasource} from "../index.mjs";
import {IServerSideGetRowsRequest} from "ag-grid-community/dist/lib/interfaces/iServerSideDatasource";
import {IServerSideGetRowsParams} from "ag-grid-community";
import { whereFragment } from "../filter";

export function buildGroupQuery(params: IServerSideGetRowsParams, datasource: DuckDbDatasource): string {
    const {request} = params;
    return `
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
            ${buildSelect(request)}
            FROM GROUPFILTERED
            ${buildGroupBy(request)}
        ) 
    `
}

export function buildGroupFilter(request : IServerSideGetRowsRequest): string {
    function* getFilterFragments(){
        let index = 0;
        while (index < request.groupKeys.length){
            const column = request.rowGroupCols[index];
            const value = request.groupKeys[index];
            yield ` "${column.field}" = '${value}' `;
            index++;
        }
    }

    const filterFragments = [...getFilterFragments()];
    if (filterFragments.length == 0) return "";

    return ` WHERE ${filterFragments.join(" AND ")}`
}

function buildSelect( request : IServerSideGetRowsRequest): string {

    if (request.rowGroupCols && request.groupKeys){
        if (request.groupKeys.length < request.rowGroupCols.length){
            const column = request.rowGroupCols[request.groupKeys.length];

            return `SELECT ${column.field} `
        }
    }

    return "SELECT *"
}

function buildGroupBy( request: IServerSideGetRowsRequest): string {
    if (request.rowGroupCols && request.groupKeys){
        if (request.groupKeys.length < request.rowGroupCols.length){
            const column = request.rowGroupCols[request.groupKeys.length];

            return `GROUP BY  ${column.field} `
        }
    }

    return "";

}