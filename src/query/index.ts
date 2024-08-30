import {
    IServerSideGetRowsParams,
    IServerSideGetRowsRequest
} from "ag-grid-community/dist/lib/interfaces/iServerSideDatasource";
import {LoadSuccessParams} from "ag-grid-community/dist/lib/rowNodeCache/rowNodeBlock";
import {DuckDbDatasource} from "../index.mjs";
import {ColDef} from "ag-grid-community";
import {convertFilterImpl, whereFragment} from "../filter";
import * as arrow from 'apache-arrow';



interface IQueryBuilder {
    getRowsAsync(params: IServerSideGetRowsParams): Promise<LoadSuccessParams>;
}

export abstract class QueryBuilder implements IQueryBuilder {

    protected readonly datasource: DuckDbDatasource;


    protected constructor(datasource: DuckDbDatasource) {
        this.datasource = datasource;
    }

    abstract buildQuery(params: IServerSideGetRowsParams): string | undefined

    async getRowsAsync(params: IServerSideGetRowsParams): Promise<LoadSuccessParams> {
        const queryBase = this.buildQuery(params);

        if (queryBase === undefined){
            return {
                rowData: [],
                rowCount: 0,
            }
        }

        const query = `
            ${queryBase}
            SELECT * FROM QUERY
            ${this.buildLimit(params)}
        `;
        const countQuery = `${queryBase} SELECT COUNT(*) FROM QUERY`

        const [result, count] = await Promise.all([
            this.datasource.doQueryAsync(query),
            this.datasource.doQueryAsync(countQuery)
        ]);

        const rowData = result.toArray();
        return {
            rowData,
            rowCount: Number(count.getChildAt(0)!.get(0)),
            pivotResultFields: this.getPivotResultsField(result, params)
        };
    }

    protected getPivotResultsField(result: arrow.Table, params: IServerSideGetRowsParams): string[] | undefined {
        return undefined;
    }

    protected whereFragment(request: IServerSideGetRowsRequest): string {
        return whereFragment(request);
    }

    protected buildGroupFilter(request : IServerSideGetRowsRequest): string {
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

    protected buildOrderBy({ request, api }: IServerSideGetRowsParams): string {
        if (request.sortModel.length == 0)
            return "";

        const sort = request.sortModel

            .filter(x => api.getColumn(x.colId)?.getColDef().field)
            .map(x => `${x.colId} ${x.sort}`)
            .join(", ")


        return `ORDER BY ${sort}`;
    }

    protected buildLimit({ request }: IServerSideGetRowsParams): string {
        if (typeof(request.startRow) === "number" 
            && typeof(request.endRow) === "number"){
            return ` LIMIT ${request.endRow - request.startRow} OFFSET ${request.startRow}`
        }
        return "";
    }
}
