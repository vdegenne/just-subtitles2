import { css, html, LitElement, PropertyValueMap } from 'lit'
import { customElement, query, state } from 'lit/decorators.js'
import '@material/mwc-dialog'
import '@material/mwc-icon-button'
import { VTTTimeStamp, TimeStamp } from './captions/TimeStamp'
import { VTTCaptionsSuperStructure } from './captions/CaptionsSuperStructure';
import { VTTCue } from './captions/Cue'
import { VTTTimeCode } from './captions/TimeCode'
import { CueBlock } from './captions/Block'

@customElement('textarea-element')
export class TextareaElement extends LitElement {
  @state() captions!: string;
  private _lastCaptions: string = ''
  private vtt!: VTTCaptionsSuperStructure;

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
      style="width:100%;height:100%;box-sizing:border-box;resize:none;font-family:roboto;border:none;outline:none;"
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
      ''
    ])
    const currentCue = this.getCurrentCue()
    const newCue = new CueBlock(this.vtt, cue)
    if (currentCue) {
      // const currentCue = this.vtt.cues[currentCue]
      const index = this.vtt.getBlockIndexFromCue(currentCue)
      this.vtt.insertBlock(index + 1, newCue)
    }
    else {
      this.vtt.insertBlock(this.vtt.blockSize, newCue)
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
    this.setCaretPosition(selectionStart)
    this.goToLine(newCue.line + 1)
  }

  moveCurrentCueStartTimeToLeft (seconds: number) {
    const selectionStart = this.textarea.selectionStart
    const cue = this.getCurrentCue()
    if (cue) {
      cue.startTime.substract(seconds * 1000)
      this.updateTextAreaFromRepresentation()
      // console.log(currentCue)
      this.setCaretPosition(selectionStart)
      return cue
    }
    else {
      return null;
    }
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
  setCurrentCueEndTime(currentTime: number) {
    const cue = this.getCurrentCue()
    if (cue && cue.endTime) {
      cue.endTime = new TimeStamp(currentTime)
    }
    this.updateTextAreaFromRepresentation()
  }

  /**
   * @returns The current timecode (before the caret) or null if no time were found
   */
  getCurrentTimeCode () {
    const beforeText = this.textarea.value.substring(0, this.textarea.selectionStart)
    const matches = beforeText.match(new RegExp(VTTCue.timeCodeRegexp, 'g'))
    const cueIndex = this.getCurrentCueIndex()
    if (cueIndex >= 0) {
      const cue = this.vtt.cues[cueIndex] as VTTCue
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
    const cue = this.vtt.cues[currentCueIndex] as VTTCue
    if (cue == null) { return null }
    return cue
  }

  updateVTTRepresentation (input: string = this.captions) {
    this.vtt = new VTTCaptionsSuperStructure(input)
  }

  updateTextAreaFromRepresentation () {
    this.textarea.value = this.vtt.toString()
    // @ts-ignore
    console.log(this.vtt.blocks, this.vtt.toString())
  }

  setCaretPosition (caretPosition: number) {
    this.textarea.selectionStart = caretPosition
    this.textarea.selectionEnd = caretPosition
  }

  goToLine (line: number) {
    let lines = this.textarea.value.split(/\n/)
    lines = lines.slice(0, line - 1)
    this.setCaretPosition(lines.join(' ').length + 1)
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