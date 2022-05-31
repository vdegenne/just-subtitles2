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

      if (e.ctrlKey) {
        if (e.code == 'Space') {
          this.videoElement.togglePlay()
        }

        if (e.code == 'KeyI') {
          const currentTime = this.videoElement.currentTime
          this.textareaElement.insertNewCue(currentTime, currentTime + 2)
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
          this.videoElement.stepBack(2)
        }
        if (e.code == 'KeyL') {
          preventAll(e)
          this.videoElement.stepForward(2)
        }
      }

      if (e.altKey) {
        if (e.code == 'Digit0') {
          preventAll(e)
          // reach the video to startTime of current cue
          const timecode = this.textareaElement.getCurrentTimeCode()
          if (timecode) {
            this.videoElement.currentTime = timecode.startTime.toSeconds()
          }
        }
      }

      if (e.shiftKey) {
        if (e.code == 'ArrowLeft' || e.code == 'KeyH') {
          preventAll(e)
          const cue = this.textareaElement.moveCurrentCueStartTimeToLeft(0.1)
          if (cue) {
            this.videoElement.cancelPlayFroTo()
            this.videoElement.playFroTo(cue.startTime.toSeconds(), cue.startTime.toSeconds() + 2) //cue.endTime!.toSeconds())
          }
        }
        if (e.code == 'ArrowLeft' || e.code == 'KeyJ') {
          preventAll(e)
          const cue = this.textareaElement.moveCurrentCueStartTimeToRight(0.1)
          if (cue) {
            this.videoElement.cancelPlayFroTo()
            this.videoElement.playFroTo(cue.startTime.toSeconds(), cue.startTime.toSeconds() + 2) //cue.endTime!.toSeconds())
          }
        }
        if (e.code == 'ArrowRight' || e.code == 'KeyK') {
          preventAll(e)
          const cue = this.textareaElement.moveCurrentCueEndTimeToLeft(0.1)
          if (cue) {
            this.videoElement.cancelPlayFroTo()
            this.videoElement.playFroTo(cue.startTime.toSeconds(), cue.endTime!.toSeconds())
          }
        }
        if (e.code == 'ArrowRight' || e.code == 'KeyL') {
          preventAll(e)
          const cue = this.textareaElement.moveCurrentCueEndTimeToRight(0.1)
          if (cue) {
            this.videoElement.cancelPlayFroTo()
            this.videoElement.playFroTo(cue.startTime.toSeconds(), cue.endTime!.toSeconds())
          }
        }
      }

    })
  }

  protected createRenderRoot(): Element | ShadowRoot {
    return this;
  }
}