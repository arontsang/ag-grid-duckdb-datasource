import {IServerSideGetRowsRequest} from "ag-grid-community/dist/lib/interfaces/iServerSideDatasource";
import {DuckDbDatasource} from "../index.mjs";
import {IServerSideGetRowsParams} from "ag-grid-community";


export function isPivotQueryRequest(request: IServerSideGetRowsRequest): boolean {
    return request.pivotMode;
}

export function buildPivotQuery(params: IServerSideGetRowsParams , datasource: DuckDbDatasource): string {
    throw new Error("Not Implemented");
}