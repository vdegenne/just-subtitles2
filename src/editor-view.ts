import { html, LitElement, PropertyValueMap } from 'lit'
import { customElement, query, state } from 'lit/decorators.js'
// import {VTTCue} from '../docs/modules/captions/Cue';
import {getVideoName} from '../docs/util.js'
import { VTTCaptionsSuperStructure } from './captions/CaptionsSuperStructure.js';
import { TextareaElement } from './textarea-element.js';
import { VideoElement } from './video-element.js';


@customElement('editor-view')
export class EditorView extends LitElement {


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
        style="display:flex;flex:1"
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

      // if (e.code == 'Escape') {
      //   preventAll(e)
      //   this.videoElement.togglePlay()
      // }
      if (e.ctrlKey) {
        if (e.code == 'Space') {
          this.videoElement.togglePlay()
        }


        if (e.code == 'Numpad0') {
          preventAll(e)
          // reach the video to startTime of current cue
          const timecode = this.textareaElement.getCurrentTimeCode()
          if (timecode) {
            this.videoElement.currentTime = timecode.startTime.toSeconds()
          }
        }

        if (e.code == 'KeyH') {
          preventAll(e)
          this.videoElement.stepBack(1)
        }
        if (e.code == 'KeyL') {
          preventAll(e)
          this.videoElement.stepForward(1)
        }
      }



      if (e.altKey && e.code == 'Digit4') {
        preventAll(e)
        // reach the video to startTime of current cue
        const timecode = this.textareaElement.getCurrentTimeCode()
        if (timecode) {
          this.videoElement.currentTime = timecode.startTime.toSeconds()
        }
      }
      if (e.altKey && e.code == 'Digit0') {
        preventAll(e)
        // reach the video to startTime of current cue
        const timecode = this.textareaElement.getCurrentTimeCode()
        if (timecode && timecode.endTime) {
          this.videoElement.currentTime = timecode.endTime.toSeconds()
        }
      }


      if ((e.shiftKey && (e.code == 'KeyI' || e.code == 'Enter')) || (e.altKey && e.code == 'Enter')) {
        const currentTime = this.videoElement.currentTime
        this.textareaElement.insertNewCue(currentTime, currentTime + 2)
      }


      if (e.code == 'F3' || (e.altKey && e.code == 'KeyI') || (e.shiftKey && e.code == 'Space') || e.code == 'Numpad0') {
        preventAll(e)
        this.playInterval()
      }
      if (e.code == 'F1' || (e.shiftKey && e.code == 'KeyH')) {
        preventAll(e)
        const cue = this.textareaElement.moveCurrentCueStartTimeToLeft(0.1)
        // if (cue) {
        //   // this.videoElement.cancelPlayFroTo()
        //   const startTime = cue.startTime.toSeconds()
        //   const endTime = cue.endTime!.toSeconds()
        //   this.videoElement.playFroTo(startTime, endTime) //cue.endTime!.toSeconds())
        // }
        this.playInterval()
      }
      if (e.code == 'F2' || (e.shiftKey && e.code == 'KeyJ')) {
        preventAll(e)
        const cue = this.textareaElement.moveCurrentCueStartTimeToRight(0.1)
        // if (cue) {
        //   // this.videoElement.cancelPlayFroTo()
        //   const startTime = cue.startTime.toSeconds()
        //   const endTime = cue.endTime!.toSeconds()
        //   this.videoElement.playFroTo(startTime, endTime) //cue.endTime!.toSeconds())
        // }
        this.playInterval()
      }
      if (e.code == 'F11' || (e.shiftKey && e.code == 'KeyK')) {
        preventAll(e)
        const cue = this.textareaElement.moveCurrentCueEndTimeToLeft(0.1)
        if (cue) {
          // this.videoElement.cancelPlayFroTo()
          const endTime = cue.endTime!.toSeconds()
          this.videoElement.playFroTo(endTime - 1, endTime)
        }
      }
      if (e.code == 'F12' || (e.shiftKey && e.code == 'KeyL')) {
        preventAll(e)
        const cue = this.textareaElement.moveCurrentCueEndTimeToRight(0.1)
        if (cue) {
          // this.videoElement.cancelPlayFroTo()
          const endTime = cue.endTime!.toSeconds()
          this.videoElement.playFroTo(endTime - 1, endTime)
        }
      }

    })
  }

  playInterval() {
    const cue = this.textareaElement.getCurrentCue()
    if (cue) {
      // this.videoElement.cancelPlayFroTo()
      const startTime = cue.startTime.toSeconds()
      const endTime = cue.endTime!.toSeconds()
      this.videoElement.playFroTo(startTime, endTime) //cue.endTime!.toSeconds())
    }
  }

  protected createRenderRoot(): Element | ShadowRoot {
    return this;
  }
}