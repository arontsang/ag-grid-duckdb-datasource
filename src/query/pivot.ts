import {DuckDbDatasource} from "../index.mjs";
import {GroupingQueryBuilder} from "./grouping";
import {IServerSideGetRowsParams} from "ag-grid-community";
import * as arrow from "apache-arrow";


export class PivotQueryBuilder extends GroupingQueryBuilder {
    public constructor(datasource: DuckDbDatasource) {
        super(datasource);
    }

    buildQuery(params: IServerSideGetRowsParams): string | undefined {
        const {request} = params;
        const pivotColumns = [...getPivotColumns(params)];

        if (pivotColumns.length === 0)
            return undefined;

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
            PIVOT GROUPFILTERED
            ON ${pivotColumns.map(x => `"${x}"`).join(", ")}
            USING sum(Salary) as "sum(Salary)"
            ${this.buildGroupBy(request)}
            ${this.buildGroupOrderBy(request)}
        )
        `
    }


    protected getPivotResultsField(result: arrow.Table, params: IServerSideGetRowsParams): string[] | undefined {

        return ['Male_sum(Salary)', 'Female_sum(Salary)']
    }
}

function *getPivotColumns(params: IServerSideGetRowsParams): IterableIterator<string> {
    for (const pivotCol of params.request.pivotCols) {
    if (pivotCol.field)
        yield pivotCol.field;
}
}