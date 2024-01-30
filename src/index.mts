import {ColumnApi, GridApi, IServerSideDatasource, IServerSideGetRowsParams} from "ag-grid-community";
import {AsyncDuckDB} from "@duckdb/duckdb-wasm";
import {IServerSideGetRowsRequest} from "ag-grid-community/dist/lib/interfaces/iServerSideDatasource";
import {buildSimpleQuery} from "./simple";
import {buildPivotQuery, isPivotQueryRequest} from "./pivot";
import {buildGroupQuery} from "./grouping";
import type * as  arrow from 'apache-arrow';

export class DuckDbDatasource implements IServerSideDatasource {

    private readonly database: AsyncDuckDB;
    readonly source: string;


    constructor(database: AsyncDuckDB, source: string) {
        this.database = database;
        this.source = source;
    }

    destroy(): void {
    }

    async getRows(params: IServerSideGetRowsParams) {

        try {
            const [result, totalRowCount] = await this.getRowsImpl(params);
            params.success({ rowData: result, rowCount: totalRowCount })
        }
        catch {
            params.fail();
        }
    }



    private async getRowsImpl(params: IServerSideGetRowsParams): Promise<[unknown[], number]> {
        const ctes = this.buildQuery(params);

        const query = `
            ${ctes}
            SELECT * FROM QUERY
            ${this.buildLimit(params)}
        `;
        const countQuery = `${ctes} SELECT COUNT(*) FROM QUERY`


        const [result, count] = await Promise.all([
            this.doQueryAsync(query),
            this.doQueryAsync(countQuery)
        ]);



        const ret: [unknown[], number] = [result.toArray(), Number(count.getChildAt(0)!.get(0))];
        return ret;
    }

    private async doQueryAsync<T extends { [key: string]: arrow.DataType; }>(query: string) {
        const connection = await this.database.connect();
        try {
            return connection.query<T>(query);
        }
        finally {
            await connection.close();
        }
    }

    private buildQuery(params: IServerSideGetRowsParams): string {
        if (isPivotQueryRequest(params.request)){
            return buildPivotQuery(params, this);
        }

        if (params.request.rowGroupCols.length == params.request.groupKeys.length){
            return buildSimpleQuery(params, this);
        }

        return buildGroupQuery(params, this);
    }





    private buildLimit({ request, api }: IServerSideGetRowsParams): string {
        if (request.startRow && request.endRow){
            return ` LIMIT ${request.endRow - request.startRow} OFFSET ${request.startRow}`
        }
        return "";
    }



    private filterBy({ request, api }: IServerSideGetRowsParams<any, any>): string {
        const groupFilter =
            request.groupKeys.map((groupValue, index) => {
                const groupColumn = request.rowGroupCols[index];
                return ` "${groupColumn.field}" = '${groupValue}' `;
            });


        //const preFilter = request.filterModel;

        if (!groupFilter.length) return "";

        return ` WHERE ${groupFilter.join(' AND ')} `;
    }
}