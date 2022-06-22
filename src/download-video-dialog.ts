import { html, LitElement } from 'lit'
import { customElement, query } from 'lit/decorators.js'
import { Dialog } from '@material/mwc-dialog';
import { EditorView } from './editor-view'
import {sleep} from './util'

@customElement('download-video-dialog')
export class DownloadVideoDialog extends LitElement {
  private app: EditorView;
  private _websocket?: WebSocket;

  @query('mwc-dialog') dialog!: Dialog;

  constructor (app: EditorView) {
    super()
    this.app = app;
  }

  render() {
    return html`
    <mwc-dialog heading="Download Video">

      <mwc-button unelevated slot=primaryAction
        @click=${()=>{this.downloadVideo()}}>download</mwc-button>
      <mwc-button outlined slot=secondaryAction dialogAction=close>close</mwc-button>
    </mwc-dialog>
    `
  }

  show () {
    this.dialog.show()
  }

  async downloadVideo () {
    this._websocket = new WebSocket('ws://localhost:8080/');
    this._websocket.addEventListener('message', (data: any) => {
      console.log("~ data", data)
    })
    await sleep(1000)
    const path = this.app.projectPath.slice(1, -1)
    this._websocket.send(JSON.stringify({
      command: 'youtube-dl',
      path: decodeURIComponent(path)
    }))
  }
}