import { LitElement, html } from 'lit'
import {ref} from 'lit/directives/ref.js';
import {DuckDbDatasource} from "ag-grid-duckdb-datasource/index.mjs";
import 'ag-grid-enterprise';
import duckdb from "./duckdb.ts"
import * as agGrid from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import {GridOptions} from "ag-grid-community";

/**
 * An example element.
 *
 * @slot - This element has a slot
 * @csspart button - The button
 */

agGrid.ModuleRegistry.registerModules([  ]);

class AgGridDuckDb extends LitElement {


  render() {
    return html`
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.1/styles/ag-grid.min.css" integrity="sha256-U46e4IPc0QQXJWqKQe+rlwkn7jjPSpEkzWtYCTuToN8=" crossorigin="anonymous" />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.1/styles/ag-theme-alpine.min.css" integrity="sha256-BzxohCuzZdLPliAbgAT5KQ29FYtyht2TDX9MbVQxt0U=" crossorigin="anonymous">
      <div  ${ref(this.onDivChanged)} class="ag-theme-alpine" style="width: 100%; height: 100%" />
    `
  }

  onDivChanged(div: Element | undefined): void {
    if (!div) return;

    const src = new URL("./userdata1.parquet", document.baseURI).href
    const source = `SELECT * FROM read_parquet('${src}')`;

    const datasource = new DuckDbDatasource(duckdb, source);
    const gridOptions: GridOptions = {
      rowModelType: 'serverSide',
      serverSideDatasource: datasource,
      defaultColDef: {
        enableRowGroup: true,

      },
      serverSidePivotResultFieldSeparator: '_',
      blockLoadDebounceMillis: 10,
      columnDefs: [
        { field: "first_name", filter: 'agTextColumnFilter'   },
        { field: "last_name", filter: 'agTextColumnFilter' },
        { field: "title", filter: 'agTextColumnFilter', enablePivot: true },
        { field: "gender", filter: 'agSetColumnFilter', enablePivot: true },
        { field: "country", filter: 'agSetColumnFilter', enablePivot: true },
        { field: "salary", filter: 'agNumberColumnFilter', defaultAggFunc: 'sum', allowedAggFuncs: ['sum', 'min', 'max', 'avg'], enableValue: true },
        { field: "birthdate", filter: 'agDateColumnFilter' },
      ],
      sideBar: [
        'columns',
        'filters'
      ]
    };
    agGrid.createGrid(div as HTMLDivElement, gridOptions);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ag-grid-duckdb': AgGridDuckDb
  }
}

customElements.define('ag-grid-duckdb', AgGridDuckDb);