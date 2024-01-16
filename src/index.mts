import {IServerSideDatasource, IServerSideGetRowsParams} from "ag-grid-community";
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
        } finally {
        }
    }



    private async getRowsImpl(params: IServerSideGetRowsParams): Promise<[unknown[], number]> {
        const connection = await this.database.connect();
        try {
            const query = this.buildQuery(params.request);


            const result = await connection.query(query + this.buildLimit(params.request)).then(x => x.toArray());
            const count = await connection.query(`
                SELECT COUNT(*)
                FROM (${query})  
                
                          
            `);

            const foo = count.getChildAt(0)!.get(0) as number;

            const ret: [unknown[], number] = [result, Number(foo)];
            return ret;
        } finally {
            await connection.close();
        }

    }

    private buildQuery(request: IServerSideGetRowsRequest): string {
        const sql = `
                WITH SOURCE AS (${this.source})
                SELECT * FROM SOURCE
                ${this.buildOrderBy(request)}
        `
        return sql;
    }

    private buildOrderBy(request: IServerSideGetRowsRequest): string {
        if (request.sortModel.length == 0)
            return "";

        const sort = request.sortModel
            .map(x => `${x.colId} ${x.sort}`)
            .join(", ")


        return `ORDER BY ${sort}`;
    }

    private buildLimit(request: IServerSideGetRowsRequest): string {
        if (request.startRow && request.endRow){
            return ` LIMIT ${request.endRow - request.startRow} OFFSET ${request.startRow}`
        }
        return "";
    }
}