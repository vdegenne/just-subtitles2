import { LitElement, html, css } from 'lit'
import { customElement } from 'lit/decorators.js'


@customElement('app-container')
export class AppContainer extends LitElement {

  static styles = css``

  render () {
    return html`
    <video-element></video-element>
    `
  }
}
