import {DuckDbDatasource} from "../index.mjs";
import {IServerSideGetRowsRequest} from "ag-grid-community/dist/lib/interfaces/iServerSideDatasource";

export function buildGroupQuery(request: IServerSideGetRowsRequest, datasource: DuckDbDatasource): string {
    throw new Error("Not Implemented");
}