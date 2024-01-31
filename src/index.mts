import {
    ColDef,
    ColGroupDef,
    GridOptions,
    IServerSideDatasource,
    IServerSideGetRowsParams
} from "ag-grid-community";
import {AsyncDuckDB} from "@duckdb/duckdb-wasm";
import {buildSimpleQuery} from "./simple";
import {buildPivotQuery, isPivotQueryRequest} from "./pivot";
import {buildGroupQuery} from "./grouping";

const setFilterCallbackSet = Symbol();

function setFilterCallbackAlreadySet(colDefs: GridOptions['columnDefs']) {
    if (!colDefs) return false;

    const asUnknown = colDefs as any;
    if (!asUnknown[setFilterCallbackSet]){
        asUnknown[setFilterCallbackSet] = true;
        return false;
    }

    return true;
}

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
        const columnDefs = params.api.getGridOption('columnDefs');
        if(columnDefs && !setFilterCallbackAlreadySet(columnDefs)) {
            this.setSetFilterCallback(columnDefs);
            params.api.setGridOption('columnDefs', columnDefs);
        }

        try {
            const [result, totalRowCount] = await this.getRowsImpl(params);
            params.success({ rowData: result, rowCount: totalRowCount })
        }
        catch {
            params.fail();
        }
    }

    private setSetFilterCallback(columnDefs: (ColDef | ColGroupDef)[]) {
        const me = this;
        function isGroup(col: ColDef | ColGroupDef): col is ColGroupDef{
            const group = col as ColGroupDef;
            return !!group.children;
        }

        for (const columnDef of columnDefs) {
            if (isGroup(columnDef))
                this.setSetFilterCallback(columnDef.children);
            else{
                if (columnDef.filter == 'agSetColumnFilter' && !columnDef.filterParams?.values){
                    columnDef.filterParams = columnDef.filterParams ?? {};
                    columnDef.filterParams = {
                        ...columnDef.filterParams,
                        values: async (params: { success: (item: unknown[]) => void }) => {
                            const query = `
                                WITH SOURCE AS (${me.source})
                                SELECT DISTINCT ${columnDef.field} FROM SOURCE LIMIT 100;
                            `;
                            const results = await me.doQueryAsync(query);
                            const values = results.getChildAt(0)!.toArray();
                            //const values = results.get(0)!.toArray();
                            params.success(values);
                        }
                    }
                }
            }
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

    private async doQueryAsync<T>(query: string) {
        const connection = await this.database.connect();
        try {
            // @ts-ignore
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

    private buildLimit({ request }: IServerSideGetRowsParams): string {
        if (request.startRow && request.endRow){
            return ` LIMIT ${request.endRow - request.startRow} OFFSET ${request.startRow}`
        }
        return "";
    }
}