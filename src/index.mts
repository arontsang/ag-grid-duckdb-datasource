import {
    ColDef,
    ColGroupDef,
    GridOptions,
    IServerSideDatasource,
    IServerSideGetRowsParams
} from "ag-grid-community";
import {AsyncDuckDB} from "@duckdb/duckdb-wasm";
import {isPivotQueryRequest} from "./pivot";
import {LoadSuccessParams} from "ag-grid-community/dist/lib/rowNodeCache/rowNodeBlock";
import {QueryBuilder} from "./query";
import {SimpleQueryBuilder} from "./query/simple";
import {GroupingQueryBuilder} from "./query/grouping";
import {PivotQueryBuilder} from "./query/pivot";

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

    readonly database: AsyncDuckDB;
    readonly source: string;

    private readonly simple: QueryBuilder;
    private readonly grouping: QueryBuilder;
    private readonly pivot: QueryBuilder;


    constructor(database: AsyncDuckDB, source: string) {
        this.database = database;
        this.source = source;

        this.simple = new SimpleQueryBuilder(this);
        this.grouping = new GroupingQueryBuilder(this);
        this.pivot = new PivotQueryBuilder(this);
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
            const result = await this.getRowsAsync(params);
            params.success(result)
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


    private getRowsAsync(params: IServerSideGetRowsParams): Promise<LoadSuccessParams> {
        if (isPivotQueryRequest(params.request)){
            return this.pivot.getRowsAsync(params);
        }

        if (params.request.rowGroupCols.length == params.request.groupKeys.length){
            return this.simple.getRowsAsync(params);
        }

        return this.grouping.getRowsAsync(params);
    }

    public async doQueryAsync<T>(query: string) {
        const connection = await this.database.connect();
        try {
            // @ts-ignore
            return connection.query<T>(query);
        }
        finally {
            await connection.close();
        }
    }
}