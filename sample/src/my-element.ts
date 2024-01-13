import { LitElement, html } from 'lit'
import {ref} from 'lit/directives/ref.js';

/**
 * An example element.
 *
 * @slot - This element has a slot
 * @csspart button - The button
 */

class AgGridDuckDb extends LitElement {


  render() {
    return html`
      <div ${ref(this.onDivChanged)} />
    `
  }

  onDivChanged(div: Element | undefined): void {
    if (!div) return;


  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ag-grid-duckdb': AgGridDuckDb
  }
}

customElements.define('ag-grid-duckdb', AgGridDuckDb);