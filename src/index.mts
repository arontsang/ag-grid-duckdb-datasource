import {ColumnApi, GridApi, IServerSideDatasource, IServerSideGetRowsParams} from "ag-grid-community";
import {AsyncDuckDB} from "@duckdb/duckdb-wasm";
import {IServerSideGetRowsRequest} from "ag-grid-community/dist/lib/interfaces/iServerSideDatasource";

export class DuckDbDatasource implements IServerSideDatasource {

    private readonly database: AsyncDuckDB;
    private readonly source: string;


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
        const connection = await this.database.connect();
        try {
            const query = this.buildQuery(params);


            const result = await connection.query(query + this.buildLimit(params)).then(x => x.toArray());
            const count = await connection.query(`
                SELECT COUNT(*)
                FROM (${query})  
                
                          
            `);

            const ret: [unknown[], number] = [result, Number(count.getChildAt(0)!.get(0))];
            return ret;
        } finally {
            await connection.close();
        }

    }

    private buildQuery(params: IServerSideGetRowsParams): string {
        const sql = `
                WITH SOURCE AS (${this.source})
                ${this.buildSelect(params)}
                FROM SOURCE
                ${this.filterBy(params)}
                ${this.buildGroupBy(params)}
                ${this.buildOrderBy(params)}
        `
        return sql;
    }

    private buildSelect({ request, api }: IServerSideGetRowsParams): string {

        if (request.rowGroupCols && request.groupKeys){
            if (request.groupKeys.length < request.rowGroupCols.length){
                const column = request.rowGroupCols[request.groupKeys.length];

                return `SELECT ${column.field} `
            }
        }

        return "SELECT *"
    }

    private buildOrderBy({ request, api, columnApi }: IServerSideGetRowsParams): string {
        if (request.sortModel.length == 0)
            return "";

        const sort = request.sortModel

            .filter(x => api.getColumn(x.colId)?.getColDef().field)
            .map(x => `${x.colId} ${x.sort}`)
            .join(", ")


        return `ORDER BY ${sort}`;
    }

    private buildLimit({ request, api }: IServerSideGetRowsParams): string {
        if (request.startRow && request.endRow){
            return ` LIMIT ${request.endRow - request.startRow} OFFSET ${request.startRow}`
        }
        return "";
    }

    private buildGroupBy({ request, api }: IServerSideGetRowsParams): string {
        if (request.rowGroupCols && request.groupKeys){
            if (request.groupKeys.length < request.rowGroupCols.length){
                const column = request.rowGroupCols[request.groupKeys.length];

                return `GROUP BY  ${column.field} `
            }
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