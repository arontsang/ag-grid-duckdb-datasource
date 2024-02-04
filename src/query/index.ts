import {
    IServerSideGetRowsParams,
    IServerSideGetRowsRequest
} from "ag-grid-community/dist/lib/interfaces/iServerSideDatasource";
import {LoadSuccessParams} from "ag-grid-community/dist/lib/rowNodeCache/rowNodeBlock";
import {DuckDbDatasource} from "../index.mjs";
import {ColDef} from "ag-grid-community";
import {convertFilterImpl, whereFragment} from "../filter";



interface IQueryBuilder {
    getRowsAsync(params: IServerSideGetRowsParams): Promise<LoadSuccessParams>;
}

export abstract class QueryBuilder implements IQueryBuilder {

    protected readonly datasource: DuckDbDatasource;


    protected constructor(datasource: DuckDbDatasource) {
        this.datasource = datasource;
    }

    abstract buildQuery(params: IServerSideGetRowsParams): string

    async getRowsAsync(params: IServerSideGetRowsParams): Promise<LoadSuccessParams> {
        const ctes = this.buildQuery(params);

        const query = `
            ${ctes}
            SELECT * FROM QUERY
            ${this.buildLimit(params)}
        `;
        const countQuery = `${ctes} SELECT COUNT(*) FROM QUERY`

        const me = this;
        async function getSecondaryColumns() : Promise<undefined | ColDef[]> {
            if (params.api.getPivotColumns().length){
                return undefined;
            }

            return me.getSecondaryColumns(params);
        }


        const [result, count, pivotColumns] = await Promise.all([
            this.datasource.doQueryAsync(query),
            this.datasource.doQueryAsync(countQuery),
            getSecondaryColumns()
        ]);

        if(pivotColumns){
            params.api.setPivotColumns(pivotColumns);
        }

        return { rowData: result.toArray(), rowCount: Number(count.getChildAt(0)!.get(0)) };
    }

    protected getSecondaryColumns(params: IServerSideGetRowsParams): Promise<undefined | ColDef[]> {
        return Promise.resolve(undefined);
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

    private buildLimit({ request }: IServerSideGetRowsParams): string {
        if (request.startRow && request.endRow){
            return ` LIMIT ${request.endRow - request.startRow} OFFSET ${request.startRow}`
        }
        return "";
    }
}