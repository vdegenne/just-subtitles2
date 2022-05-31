import { css, html, LitElement, PropertyValueMap } from 'lit'
import { customElement, query, state } from 'lit/decorators.js'
import '@material/mwc-dialog'
import '@material/mwc-icon-button'
import { VTTTimeStamp } from './captions/TimeStamp'
import { VTTCaptionsSuperStructure } from './captions/CaptionsSuperStructure';
import { Cue, VTTCue } from './captions/Cue'
import { VTTTimeCode } from './captions/TimeCode'

@customElement('textarea-element')
export class TextareaElement extends LitElement {
  @state() captions!: string;
  private _lastCaptions: string = ''
  private VTTRepresentation!: VTTCaptionsSuperStructure;

  @query('#textarea') textarea!: HTMLTextAreaElement;

  constructor () {
    super()
    this.loadCaptions().then(captions => {
      this.captions = captions
      this._lastCaptions = captions
      this.updateVTTRepresentation()
      // console.log(this.VTTRepresentation)
    })
  }

  render() {
    return html`
    <textarea id=textarea
      style="width:100%;height:100%;box-sizing:border-box;resize:none;font-family:roboto;"
      @keyup=${()=>{this.onTextareaKeyup()}}>${this.captions}</textarea>
    `
  }

  protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    const vim = new VIM()
    vim.attach_to(this.textarea)
  }

  private async onTextareaKeyup() {
    this.captions = this.textarea.value
    if (this.textarea.value !== this._lastCaptions) {
      await this.saveCaptions()
      this.dispatchEvent(new CustomEvent('change'))
      // this.videoElement.reloadCaptions()
      this._lastCaptions = this.captions
      this.updateVTTRepresentation()
    }
  }

  /**
   * Insert a new cue into the representation
   */
  insertNewCue(startTime: number, endTime: number) {
    const selectionStart = this.textarea.selectionStart
    const cue = new VTTCue([
      [new VTTTimeStamp(startTime), VTTCue.separator, new VTTTimeStamp(endTime)].join(''),
      'insert text here'
    ])
    const currentCueIndex = this.getCurrentCueIndex()
    if (currentCueIndex >= 0) {
      const currentCue = this.VTTRepresentation.cues[currentCueIndex]
      const index = this.VTTRepresentation.getBlockIndexFromCue(currentCue)
      this.VTTRepresentation.insertBlock(index + 1, {
        type: 'cue',
        block: cue
      })
    }
    else {
      this.VTTRepresentation.insertBlock(this.VTTRepresentation.blockSize, {
        type: 'cue',
        block: cue
      })
    }
    // const timecode = this.getCurrentTimeCode()
    // if (timecode) {
    //   const block = this.VTTRepresentation.findCueBlockWithTime(timecode.startTime, timecode.endTime!)!
    //   const index = this.VTTRepresentation.getBlockIndex(block)
    //   this.VTTRepresentation.insertBlock(index + 1, {
    //     type: 'cue',
    //     block: cue
    //   })
    //   // console.log(this.VTTRepresentation)
    //   // return
    // }
    this.updateTextAreaFromRepresentation()
    this.textarea.selectionStart = selectionStart
    this.textarea.selectionEnd = selectionStart
  }

  moveCurrentCueStartTimeToLeft (seconds: number) {
    const selectionStart = this.textarea.selectionStart
    const currentCue = this.getCurrentCue()
    currentCue?.startTime.substract(seconds * 1000)
    this.updateTextAreaFromRepresentation()
    // console.log(currentCue)
    this.setCaretPosition(selectionStart)
    return currentCue
  }
  moveCurrentCueStartTimeToRight (seconds: number) {
    const selectionStart = this.textarea.selectionStart
    const currentCue = this.getCurrentCue()
    currentCue?.startTime.add(seconds * 1000)
    this.updateTextAreaFromRepresentation()
    // console.log(currentCue)
    this.setCaretPosition(selectionStart)
    return currentCue
  }
  moveCurrentCueEndTimeToLeft (seconds: number) {
    const selectionStart = this.textarea.selectionStart
    const currentCue = this.getCurrentCue()!
    currentCue.endTime!.substract(seconds * 1000)
    this.updateTextAreaFromRepresentation()
    // console.log(currentCue)
    this.setCaretPosition(selectionStart)
    return currentCue
  }
  moveCurrentCueEndTimeToRight (seconds: number) {
    const selectionStart = this.textarea.selectionStart
    const currentCue = this.getCurrentCue()!
    currentCue.endTime!.add(seconds * 1000)
    this.updateTextAreaFromRepresentation()
    // console.log(currentCue)
    this.setCaretPosition(selectionStart)
    return currentCue
  }

  /**
   * @returns The current timecode (before the caret) or null if no time were found
   */
  getCurrentTimeCode () {
    const beforeText = this.textarea.value.substring(0, this.textarea.selectionStart)
    const matches = beforeText.match(new RegExp(VTTCue.timeCodeRegexp, 'g'))
    const cueIndex = this.getCurrentCueIndex()
    if (cueIndex >= 0) {
      const cue = this.VTTRepresentation.cues[cueIndex] as VTTCue
      return new VTTTimeCode(cue.startTime, cue.endTime!)
    }
    // if (matches?.length) {
    //   return new VTTCue(matches[matches.length - 1])
    // }
    return null
  }

  getCurrentCueIndex () {
    const beforeText = this.textarea.value.substring(0, this.textarea.selectionStart)
    const matches = beforeText.match(new RegExp(VTTCue.timeCodeRegexp, 'g'))
    return matches ? matches.length - 1 : -1;
  }
  getCurrentCue () {
    const currentCueIndex = this.getCurrentCueIndex()
    if (currentCueIndex == -1) { return null }
    const cue = this.VTTRepresentation.cues[currentCueIndex] as VTTCue
    if (cue == null) { return null }
    return cue
  }

  updateVTTRepresentation (input: string = this.captions) {
    this.VTTRepresentation = new VTTCaptionsSuperStructure(input)
  }

  updateTextAreaFromRepresentation () {
    this.textarea.value = this.VTTRepresentation.toString()
    // @ts-ignore
    console.log(this.VTTRepresentation.blocks, this.VTTRepresentation.toString())
  }

  setCaretPosition (caretPosition: number) {
    this.textarea.selectionStart = caretPosition
    this.textarea.selectionEnd = caretPosition
  }

  async loadCaptions () {
    return await (await fetch('/api/get-captions')).text()
  }

  async saveCaptions () {
    await fetch('/api/save-captions', {
      method: 'POST',
      body: this.textarea.value
    })
  }


  protected createRenderRoot(): Element | ShadowRoot {
    return this
  }
}