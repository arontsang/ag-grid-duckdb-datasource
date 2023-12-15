import {IServerSideDatasource, IServerSideGetRowsParams} from "ag-grid-community";
import type {Database as DuckDbDatabase} from 'duckdb-async';

export class DuckDbDatasource implements IServerSideDatasource {

    private readonly database: DuckDbDatabase;


    constructor(database: DuckDbDatabase) {
        this.database = database;
    }

    destroy(): void {
    }

    async getRows(params: IServerSideGetRowsParams) {
        try {
            const [rows, totalRowCount] = await this.getRowsImpl(params);
            params.successCallback(rows, totalRowCount);
        }
        catch {
            params.failCallback();
        }
    }

    private async getRowsImpl(params: IServerSideGetRowsParams): Promise<[unknown[], number]> {
        const ret: [unknown[], number] = [[], 0];
        return ret;
    }
}