import {DuckDbDatasource} from "../index.mjs";
import {GroupingQueryBuilder} from "./grouping";
import {ColumnVO, IServerSideGetRowsParams} from "ag-grid-community";


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
            ON ${pivotColumns.map(PivotQueryBuilder.columnValueExpression).join(" || '_' || ")}
            ${this.getPivotUsing(params)}
            ${this.buildGroupBy(request)}
            ${this.buildGroupOrderBy(request)}
        )
        `
    }

    private getPivotUsing(params: IServerSideGetRowsParams): string {
        function getExpression(column: ColumnVO): string {
            const agg = column.aggFunc ?? "sum"
            const colName = column.displayName;
            return `${agg}(${colName}) AS "${agg}(${colName})"`
        }
        const expressions = params.request.valueCols
            .map(column => getExpression(column))
        return `USING ${expressions.join(', ')}`


    }
    static columnValueExpression(column: string){
        return `(CASE WHEN ${column} = '' THEN '(Blanks)' WHEN ${column} IS NULL THEN '(Null)' ELSE "${column}" END)`
    }

    protected async getPivotResultsFieldAsync(params: IServerSideGetRowsParams): Promise<string[] | undefined> {
        const pivotColumns = [...getPivotColumns(params)];



        const query = `
            WITH SOURCE AS (${this.datasource.source})
            SELECT DISTINCT ${pivotColumns.map(x => `${PivotQueryBuilder.columnValueExpression(x)} as ${x}`).join(',\n\t\t')} FROM SOURCE
            ORDER BY ${pivotColumns.join(',')}
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