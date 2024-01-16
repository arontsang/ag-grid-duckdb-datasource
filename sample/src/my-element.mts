import { LitElement, html } from 'lit'
import {ref} from 'lit/directives/ref.js';
import {DuckDbDatasource} from "ag-grid-duckdb-datasource/index.mjs";
import 'ag-grid-enterprise';
import duckdb from "./duckdb.ts"
import * as agGrid from 'ag-grid-community';

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
      <link href="
https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.1/styles/ag-grid.min.css
" rel="stylesheet">
      <div ${ref(this.onDivChanged)} style="width: 100%; height: 100%" />
    `
  }

  onDivChanged(div: Element | undefined): void {
    if (!div) return;

    const src = new URL("/userdata1.parquet", document.baseURI).href
    const source = `SELECT * FROM read_parquet('${src}')`;

    const datasource = new DuckDbDatasource(duckdb, source);
    agGrid.createGrid(div as HTMLDivElement, {
      rowModelType: 'serverSide',
      serverSideDatasource: datasource,
      columnDefs: [
        { field: "first_name" },
        { field: "last_name" },
      ]
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ag-grid-duckdb': AgGridDuckDb
  }
}

customElements.define('ag-grid-duckdb', AgGridDuckDb);