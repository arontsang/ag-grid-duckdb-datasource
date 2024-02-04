import {QueryBuilder} from "./index";
import {IServerSideGetRowsParams} from "ag-grid-community";

import {DuckDbDatasource} from "../index.mjs";


export class SimpleQueryBuilder extends QueryBuilder {
    public constructor(datasource: DuckDbDatasource) {
        super(datasource);
    }

    buildQuery(params: IServerSideGetRowsParams): string {
        const {request} = params;
        const sql = `
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
            SELECT * FROM GROUPFILTERED
            ${this.buildOrderBy(params)}
        )
        
        
    `

        return sql;
    }

}