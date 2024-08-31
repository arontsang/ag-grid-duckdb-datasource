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

        if (pivotColumns.length === 0 || params.request.valueCols.length === 0)
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
            ON ${pivotColumns.map(x => `(CASE WHEN ${x} = '' THEN '(Blanks)' ELSE "${x}" END)`).join(" || '_' || ")}
            USING sum(Salary) as "sum(Salary)"
            ${this.buildGroupBy(request)}
            ${this.buildGroupOrderBy(request)}
        )
        `
    }


    protected async getPivotResultsFieldAsync(params: IServerSideGetRowsParams): Promise<string[] | undefined> {
        const pivotColumns = [...getPivotColumns(params)];
        const query = `
            WITH SOURCE AS (${this.datasource.source})
            SELECT DISTINCT ${pivotColumns.map(column => `${column}`).join(', ')} FROM SOURCE
        `
        

        
        const columnValues = await this.datasource.doQueryAsync(query);

        function normalizeDimensionValue(value: any): string {
            if (value === "")
                return "(Blanks)";

            return value.toString()
        }

        function *GetPivotValues(): IterableIterator<string> {
            for (let rowIndex = 0; rowIndex < columnValues.numRows; rowIndex++) {
                const row = columnValues.get(rowIndex);
                if (row == null) break;
                const dimensionValue = pivotColumns
                    .map(column => normalizeDimensionValue(row[column]))
                    .join("_")

                for (const measure of params.request.valueCols) {
                    yield `${dimensionValue}_${measure.aggFunc ?? "sum"}(${measure.displayName})`
                }
            }
        }

        return [...GetPivotValues()];
    }
}

function *getPivotColumns(params: IServerSideGetRowsParams): IterableIterator<string> {
    for (const pivotCol of params.request.pivotCols) {
    if (pivotCol.field)
        yield pivotCol.field;
}
}