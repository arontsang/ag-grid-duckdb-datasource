import {DuckDbDatasource} from "../index.mjs";
import {ColDef, IServerSideGetRowsParams} from "ag-grid-community";
import {GroupingQueryBuilder} from "./grouping";


export class PivotQueryBuilder extends GroupingQueryBuilder {
    public constructor(datasource: DuckDbDatasource) {
        super(datasource);
    }

    buildQuery(params: IServerSideGetRowsParams): string {
        return "";
    }


    protected async getSecondaryColumns(params: IServerSideGetRowsParams): Promise<ColDef[] | undefined> {
        return undefined;
    }
}