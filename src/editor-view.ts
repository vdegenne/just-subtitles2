import { html, LitElement, PropertyValueMap } from 'lit'
import { customElement, query, state } from 'lit/decorators.js'
// import {VTTCue} from '../docs/modules/captions/Cue';
import {getVideoName} from '../docs/util.js'
import { VTTCaptionsSuperStructure } from './captions/CaptionsSuperStructure.js';
import { ControllerController } from './ControllerController.js';
import { TextareaElement } from './textarea-element.js';
import { VideoElement } from './video-element.js';


@customElement('editor-view')
export class EditorView extends LitElement {

  private controllerController = new ControllerController(this)

  constructor () {
    super()
    getVideoName().then(videoname => {
      this.videoElement.loadVideo(videoname)
    })
  }

  @query('video-element') videoElement!: VideoElement;
  @query('textarea-element') textareaElement!: TextareaElement;

  render () {
    return html`
    <style>
        #wrapper {
          width: 600px;
          display: flex;
          flex-direction: column;
          height: 100vh;
          margin: 0 auto;
        }
    </style>
    <div id=wrapper>
      <video-element></video-element>
      <textarea-element
        style="display:flex;flex:1;flex-direction: column"
        @change=${()=>{this.videoElement.reloadCaptions()}}></textarea-element>
    </div>
    `
  }

  protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    this.registerEventListeners()
  }



  async registerEventListeners () {
    await this.textareaElement.updateComplete

    function preventAll(e: Event) {
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()
    }

    this.textareaElement.textarea.addEventListener('keydown', e => {
      // console.log(e.code)

      // if (e.shiftKey && e.code == 'Comma') {
      //   this.videoElement.speedDown()
      // }
      // if (e.shiftKey && e.code == 'Period') {
      //   this.videoElement.speedUp()
      // }
      if (e.code == 'Escape') {
        preventAll(e)
        this.videoElement.clearPlayFroTo()
        this.videoElement.pause()
        // this.videoElement.togglePlay()
      }
      if (e.ctrlKey && e.code == 'Space' || (e.altKey && e.code == 'Enter')) {
        this.videoElement.togglePlay()
      }
      // if (e.altKey && e.code == 'Space') {
      //   const timecode = this.textareaElement.getCurrentTimeCode()
      //   if (timecode) {
      //     this.videoElement.currentTime = timecode.startTime.toSeconds()
      //   }
      //   this.videoElement.play()
      //   // this.videoElement.togglePlay()
      // }

      /**
       * Textarea Navigation
       */
      if (e.altKey && e.code == 'ArrowUp') {
        this.previousCue()
      }
      if (e.altKey && e.code == 'ArrowDown') {
        this.nextCue()
      }

      /**
       * Video Navigation
       */
      if (e.code == 'Numpad4' || (e.altKey && e.code == 'ArrowLeft')) {
        preventAll(e)
        this.videoElement.stepBack(0.1)
      }
      if (e.code == 'Numpad6' || (e.altKey && e.code == 'ArrowRight')) {
        preventAll(e)
        this.videoElement.stepForward(0.1)
      }



      /** ???????? */
      if (e.altKey && e.code == 'Digit0') {
        preventAll(e)
        this.clingVideoToStartTime()
      }
      if (e.altKey && e.code == 'Digit4') {
        preventAll(e)
        this.clingVideoToEndTime()
      }


      if (e.altKey && e.code == 'KeyO') {
        this.insertNewCue()
      }


      if (e.code == 'F3' || (e.altKey && e.code == 'KeyI') || (e.altKey && e.code == 'Digit3') || (false && e.shiftKey && e.code == 'Space') || e.code == 'Numpad0') {
        preventAll(e)
        this.playInterval(true)
      }

      /** STRETCHING TIME */
      if (e.code == 'F1') {
        preventAll(e)
        this.stretchStartTimeToLeft()
      }
      if (e.code == 'F2') {
        preventAll(e)
        this.stretchStartTimeToRight()
      }
      if (!e.altKey && e.code == 'F11') {
        preventAll(e)
        this.stretchEndTimeToLeft()
      }
      if (e.altKey && e.code == 'F12') {
        this.clingEndTimeToVideoCurrentTime()
        // this.textareaElement.setCurrentCueEndTime(this.videoElement.currentTime)
      }
      if (!e.altKey && e.code == 'F12') {
        preventAll(e)
        this.stretchEndTimeToRight()
      }

    })
  }

  insertNewCue() {
    const currentTime = this.videoElement.currentTime + 0.001
    this.textareaElement.insertNewCue(currentTime, currentTime + 3)
  }

  stretchStartTimeToLeft(time = 0.1) {
    const cue = this.textareaElement.moveCurrentCueStartTimeToLeft(time)
    this.playInterval()
  }
  stretchStartTimeToRight(time = 0.1) {
    const cue = this.textareaElement.moveCurrentCueStartTimeToRight(time)
    this.playInterval()
  }
  stretchEndTimeToLeft (time = 0.1) {
    const cue = this.textareaElement.moveCurrentCueEndTimeToLeft(time)
    if (cue) {
      const startTime = cue.startTime.toSeconds()
      const endTime = cue.endTime!.toSeconds()
      const from = endTime - 1 < startTime ? startTime : endTime - 1;
      this.videoElement.playFroTo(from, endTime)
    }
  }
  stretchEndTimeToRight (time = 0.1) {
    const cue = this.textareaElement.moveCurrentCueEndTimeToRight(time)
    if (cue) {
      const startTime = cue.startTime.toSeconds()
      const endTime = cue.endTime!.toSeconds()
      const from = endTime - 1 < startTime ? startTime : endTime - 1;
      this.videoElement.playFroTo(from, endTime)
    }
  }

  clingVideoToStartTime () {
    // reach the video to startTime of current cue
    const timecode = this.textareaElement.getCurrentTimeCode()
    if (timecode) {
      this.videoElement.currentTime = timecode.startTime.toSeconds()
    }
  }
  clingVideoToEndTime () {
    // reach the video to startTime of current cue
    const timecode = this.textareaElement.getCurrentTimeCode()
    if (timecode && timecode.endTime) {
      this.videoElement.clearPlayFroTo()
      this.videoElement.currentTime = timecode.endTime.toSeconds()
    }
  }
  clingStartTimeToVideoCurrentTime () { this.textareaElement.setCurrentCueStartTime(this.videoElement.currentTime) }
  clingEndTimeToVideoCurrentTime () { this.textareaElement.setCurrentCueEndTime(this.videoElement.currentTime) }

  previousCue () { this.textareaElement.moveCaretToPreviousCue() }
  nextCue () { this.textareaElement.moveCaretToNextCue() }
  lastCue () { this.textareaElement.moveCaretToLastCue() }

  togglePlay () {
    this.videoElement.cancelPlayFroTo()
    this.videoElement.togglePlay()
  }

  async playInterval(resetOnEnd = false) {
    const cue = this.textareaElement.getCurrentCue()
    if (cue) {
      // this.videoElement.cancelPlayFroTo()
      const startTime = cue.startTime.toSeconds()
      const endTime = cue.endTime!.toSeconds()
      try {
        await this.videoElement.playFroTo(startTime, endTime, resetOnEnd) //cue.endTime!.toSeconds())
      } catch (e) {
        // on cancel, nothing
      }
    }
  }
  // togglePlayInterval () {
  //   if (this.videoElement.playing) {
  //     // this.videoElement.clearPlayFroTo()
  //     this.videoElement.pause()
  //   }
  //   else {
  //     this.playInterval(false)
  //   }
  // }

  protected createRenderRoot(): Element | ShadowRoot {
    return this;
  }
}