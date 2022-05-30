import { html, LitElement } from 'lit'
import { customElement, query, state } from 'lit/decorators.js'
import '@material/mwc-dialog'
import '@material/mwc-icon-button'
import { Dialog } from '@material/mwc-dialog';

@customElement('video-element')
export class VideoElement extends LitElement {
  // @query('mwc-dialog') dialog!: Dialog;

  render() {
    return html`
    test
    `
  }
}