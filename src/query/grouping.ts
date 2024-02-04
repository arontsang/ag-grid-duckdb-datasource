import {QueryBuilder} from "./index";
import {ColumnVO, IServerSideGetRowsParams} from "ag-grid-community";
import {IServerSideGetRowsRequest} from "ag-grid-community/dist/lib/interfaces/iServerSideDatasource";
import {DuckDbDatasource} from "../index.mjs";


export class GroupingQueryBuilder extends QueryBuilder{

    public constructor(datasource: DuckDbDatasource) {
        super(datasource);
    }

    buildQuery(params: IServerSideGetRowsParams): string {
        const {request} = params;
        return `
        WITH SOURCE AS (${this.datasource.source}),
        FILTERED AS (
            SELECT * FROM SOURCE
            ${this.whereFragment(request)}
        ),
        GROUPFILTERED AS (
            SELECT * FROM FILTERED
            ${this.buildGroupFilter(request)}
        ),
        QUERY AS (
            ${buildSelect(request)}
            FROM GROUPFILTERED
            ${this.buildGroupBy(request)}
            ${this.buildGroupOrderBy(request)}
        ) 
        `
    }

    protected buildGroupBy( request: IServerSideGetRowsRequest): string {
        if (request.rowGroupCols && request.groupKeys){
            if (request.groupKeys.length < request.rowGroupCols.length){
                const column = request.rowGroupCols[request.groupKeys.length];

                return `GROUP BY  ${column.field} `
            }
        }

        return "";
    }

    protected buildGroupOrderBy(request: IServerSideGetRowsRequest): string {
        const col = groupColumn(request);
        const sort = request.sortModel.filter(x => x.colId == col.field);
        if (sort.length == 0) return "";

        return `ORDER BY ${col.field} ${sort[0].sort}`
    }

}


function groupColumn(request : IServerSideGetRowsRequest): ColumnVO {
    return request.rowGroupCols[request.groupKeys.length];
}


function buildSelect(request : IServerSideGetRowsRequest): string {

    if (request.rowGroupCols && request.groupKeys){
        if (request.groupKeys.length < request.rowGroupCols.length){
            const columns = [
                groupColumn(request).field,
                ...request.valueCols.map(x => `${x.aggFunc}(${x.field}) AS ${x.field}`)
            ]
            return `SELECT ${columns.join(',')} `
        }
    }

    return "SELECT *"
}



