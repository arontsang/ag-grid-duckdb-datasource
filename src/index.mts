import {IServerSideDatasource, IServerSideGetRowsParams} from "ag-grid-community";
import {AsyncDuckDB} from "@duckdb/duckdb-wasm";

export class DuckDbDatasource implements IServerSideDatasource {

    private readonly database: AsyncDuckDB;


    constructor(database: AsyncDuckDB) {
        this.database = database;
    }

    destroy(): void {
    }

    async getRows(params: IServerSideGetRowsParams) {
        try {
            const [rows, totalRowCount] = await this.getRowsImpl(params);
            params.success({ rowData: [], rowCount: 0 })
        }
        catch {
            params.fail();
        }
    }

    private async getRowsImpl(params: IServerSideGetRowsParams): Promise<[unknown[], number]> {
        const ret: [unknown[], number] = [[], 0];
        return ret;
    }
}