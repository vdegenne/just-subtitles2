import { html, LitElement, nothing, PropertyValueMap } from 'lit'
import { until } from "lit/directives/until.js";
import { customElement, query, state } from 'lit/decorators.js'
import '@material/mwc-dialog'
import '@material/mwc-icon-button'
import { VTTTimeStamp, TimeStamp } from './captions/TimeStamp'
import { VTTCaptionsSuperStructure } from './captions/CaptionsSuperStructure';
import { Cue, VTTCue } from './captions/Cue'
import { VTTTimeCode } from './captions/TimeCode'
import { CueBlock } from './captions/Block'


@customElement('textarea-element')
export class TextareaElement extends LitElement {
  private captions!: string = 'empty';
  private _lastCaptions: string = ''
  private vtt!: VTTCaptionsSuperStructure;

  @query('#textarea') textarea!: HTMLTextAreaElement;

  constructor () {
    super()
    this.loadCaptions().then(captions => {
      this.captions = captions
      this._lastCaptions = captions
      this.updateVTTRepresentation()
      this.requestUpdate()
    })
  }

  render() {
    return html`
    <!-- ${until(this.cueStripTemplate())} -->
    <style>
      #textarea {
        min-width: 449px;
      }
    </style>
    <textarea id=textarea
      style="height:100%;box-sizing:border-box;resize:none;font-family:'Fira Code';border:none;outline:none;caret-color:red;padding-left:12px"
      @keyup=${()=>{this.onTextareaKeyup()}}>${this.captions}</textarea>
    `
  }

  async cueStripTemplate (cue: Cue|null = null) {
    await this.updateComplete
    if (!cue) {
      cue = this.getCurrentCue()
      if (!cue) return nothing
    }
    const startTimeFormatted = cue.startTime
    const endTimeFormatted = cue.endTime
    return html`
    <div style="background-color:#616161;color:white;font-size:0.9em;padding:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
      <span>${startTimeFormatted} --> ${endTimeFormatted} : ${cue.text!['any']}</span>
    </div>
    `
  }
  updateCueStrip () { this.requestUpdate() }

  protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    // const vim = new VIM()
    // vim.attach_to(this.textarea)
    // this.updateComplete.then(() => this.requestUpdate())
  }

  private async onTextareaKeyup() {
    this.captions = this.textarea.value
    if (this.textarea.value !== this._lastCaptions) {
      await this.saveCaptions()
      // this.dispatchEvent(new CustomEvent('change'))
      // this.videoElement.reloadCaptions()
      this._lastCaptions = this.captions
      this.updateVTTRepresentation()
    }
    else {
      // this.requestUpdate()
    }
  }

  /**
   * Insert a new cue into the representation
   */
  insertNewCue(startTime: number, endTime: number) {
    // const selectionStart = this.textarea.selectionStart
    const cue = new VTTCue([
      [new VTTTimeStamp(startTime), VTTCue.separator, new VTTTimeStamp(endTime)].join(''),
      ''
    ])
    // console.log(cue)
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
    // this.setCaretPosition(selectionStart)
    this.goToLine(newCue.line + 1)
    this.focusToCaret()

    this.saveCaptions()
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
    this.saveCaptions()
  }
  moveCurrentCueStartTimeToRight (seconds: number) {
    const selectionStart = this.textarea.selectionStart
    const currentCue = this.getCurrentCue()
    currentCue?.startTime.add(seconds * 1000)
    this.updateTextAreaFromRepresentation()
    this.setCaretPosition(selectionStart)
    this.saveCaptions()
    return currentCue
  }
  moveCurrentCueEndTimeToLeft (seconds: number) {
    const selectionStart = this.textarea.selectionStart
    const currentCue = this.getCurrentCue()!
    currentCue.endTime!.substract(seconds * 1000)
    this.updateTextAreaFromRepresentation()
    this.setCaretPosition(selectionStart)
    this.saveCaptions()
    return currentCue
  }
  moveCurrentCueEndTimeToRight (seconds: number) {
    const selectionStart = this.textarea.selectionStart
    const currentCue = this.getCurrentCue()!
    currentCue.endTime!.add(seconds * 1000)
    this.updateTextAreaFromRepresentation()
    this.setCaretPosition(selectionStart)
    this.saveCaptions()
    return currentCue
  }
  setCurrentCueStartTime(currentTime: number) {
    const selectionStart = this.textarea.selectionStart
    const cue = this.getCurrentCue()
    if (cue) {
      cue.startTime = new TimeStamp(currentTime)
    }
    this.updateTextAreaFromRepresentation()
    this.setCaretPosition(selectionStart)
    this.saveCaptions()
  }
  setCurrentCueEndTime(currentTime: number) {
    const selectionStart = this.textarea.selectionStart
    const cue = this.getCurrentCue()
    if (cue && cue.endTime) {
      cue.endTime = new VTTTimeStamp(currentTime)
    }
    this.updateTextAreaFromRepresentation()
    this.setCaretPosition(selectionStart)
    this.saveCaptions()
  }

  clingStartTimeToPreviousCueEndTime () {
    const cueIndex = this.getCurrentCueIndex()
    if (cueIndex >= 0) {
      const currentCueBlock = this.vtt.getCueBlockFromIndex(cueIndex)
      if (currentCueBlock) {
        const previousCueBlock = this.vtt.getCueBlockFromIndex(cueIndex - 1)
        if (previousCueBlock && previousCueBlock.cue.endTime) {
          currentCueBlock.cue.startTime = new TimeStamp(previousCueBlock.cue.endTime.toSeconds())
          currentCueBlock.cue.startTime.add(1)
          this.updateTextAreaFromRepresentation()
          this.saveCaptions()
        }
      }
    }
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
    const cue = this.vtt.cues[currentCueIndex] as Cue
    if (cue == null) { return null }
    return cue
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

  highlightCaret() {
    this.textarea.selectionEnd = this.textarea.selectionStart + 1
  }

  moveCaretToPreviousCue () {
    const cueIndex = this.getCurrentCueIndex()
    if (cueIndex > 0) {
      const previousCueBlock = this.vtt.getCueBlockFromIndex(cueIndex - 1)
      if (previousCueBlock) {
        this.goToLine(previousCueBlock.line + 1)
        this.focusToCaret()
        this.highlightCaret()
        this.updateCueStrip()
      }
    }
  }
  moveCaretToNextCue() {
    const cueIndex = this.getCurrentCueIndex()
    // if (cueIndex >= 0) {
      const nextCueBlock = this.vtt.getCueBlockFromIndex(cueIndex + 1)
      if (nextCueBlock) {
        this.goToLine(nextCueBlock.line + 1)
        this.focusToCaret()
        this.highlightCaret()
        this.updateCueStrip()
      }
    // }
  }
  moveCaretToLastCue() {
    const cues = this.vtt.getCueBlocks()
    if (cues.length > 0) {
      this.goToLine(cues[cues.length - 1].line + 1)
      this.focusToCaret()
      this.updateCueStrip()
    }
  }

  focusToCaret() {
    this.textarea.blur()
    this.textarea.focus()
    // this.textarea.scrollBy(0, 10)
    // this.textarea.selectionEnd = this.textarea.selectionStart + 1
  }

  updateVTTRepresentation (input: string = this.captions) {
    this.vtt = new VTTCaptionsSuperStructure(input)
    // this.requestUpdate()
  }

  updateTextAreaFromRepresentation () {
    const selectionStart = this.textarea.selectionStart
    this.textarea.value = this.vtt.toString()
    this.setCaretPosition(selectionStart)
    // @ts-ignore
    // console.log(this.vtt.blocks, this.vtt.toString())
  }

  async loadCaptions () {
    return await (await fetch('/api/get-captions')).text()
  }

  async saveCaptions () {
    await fetch('/api/save-captions', {
      method: 'POST',
      body: this.textarea.value
    })
    // saving the captions, that means a change occured
    this.dispatchEvent(new CustomEvent('change'))
  }

  protected createRenderRoot(): Element | ShadowRoot {
    return this
  }
}