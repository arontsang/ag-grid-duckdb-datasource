import {IServerSideGetRowsRequest} from "ag-grid-community/dist/lib/interfaces/iServerSideDatasource";

export function isPivotQueryRequest(request: IServerSideGetRowsRequest): boolean {
    return request.pivotMode;
}

