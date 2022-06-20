import { html, LitElement, nothing, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import {styleMap} from 'lit/directives/style-map.js';
import { TimeStamp } from './captions/TimeStamp';

@customElement('timestamp-element')
export class TimeStampElement extends LitElement {
  @property() timestamp: string = ''
  @property({type: Array }) colors: string[]|undefined = TimeStampElement.defaultColors

  // static styles = css`
  // :host {
  //   display: flex;
  //   align:center;
  // }
  // `

  render () {
    return TimeStampElement.timestampTemplate(TimeStampElement.trimZeros(this.timestamp), this.colors)
  }

  static timestampTemplate (timestamp: string, colors?: string[]): TemplateResult {
    const parts = timestamp.split(/(\.|:)/).reverse()
    return html`
    <div style="display:flex;flex-direction:row-reverse;align-items:center">
      ${parts.map((part, i) => {
        return html`
        <span style=${styleMap({
          color: (colors ? colors[i] : 'inherit')
        })}>${part}</span>
        `
      })}
    </div>
    `
  }

  static trimZeros (str: string): string {
    return str.replace(/^[0:]+/, '')
  }


  static get defaultColors () {
    return ['orange', 'grey', 'yellow', 'grey', '#8bc34a', 'grey', '#2e7d32' ]
  }
}