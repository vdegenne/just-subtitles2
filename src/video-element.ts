import { css, html, LitElement, nothing, PropertyValueMap } from 'lit'
import { customElement, query, state } from 'lit/decorators.js'
import { TimeStampElement } from './timestamp-element';
import { timeToLiteralTimestamp } from './util';

@customElement('video-element')
export class VideoElement extends LitElement {

  @state() source?: string;
  // @state() captionsSource?: string;
  @state() updateTime = Date.now();

  @state() playing = false

  @state() controls = false
  @state() speed = 1;

  @query('video') videoElement!: HTMLVideoElement;
  @query('#currentTime') timestampElement!: TimeStampElement;

  static styles = css`
  :host {
    color: white;
  }
  video {
    display: block;
    width: 100%;
  }
  video::-webkit-media-controls-panel {
    opacity: 1 !important;
  }

  #info, #info > div {
    display: flex;
    align-items: center;
    color: #9e9e9e;
  }
  #info {
    justify-content: space-between;
    padding: 6px 12px;
    background-color: #212121;
  }
  #info > div > mwc-icon {
    margin-right: 5px;
  }
  `

  render() {
    return html`
    <video ?controls=${this.controls}>
    ${this.source ? html`
      <source src="./${this.source}">
    `: nothing}
      <track src="./captions.vtt?${this.updateTime}" default>
    </video>
    <div id=info>
      <div><mwc-icon>speed</mwc-icon><span style="min-width:50px">${this.speed}</span></div>
      <div>${this._seekForEndInterval ? html`<mwc-icon style="background-color:#ffc107;color:black;">hourglass_empty</mwc-icon>` : nothing}</div>
      <div><timestamp-element id=currentTime style="color:#9e9e9e" .colors=${undefined}></timestamp-element></div>
    </div>
    `
  }

  protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    // @ts-ignore
    // this.videoElement.ontimeupdate = async () => {
    //   this.videoElement.removeAttribute('controls')
    //   // await new Promise((resolve) => { setTimeout(resolve, 0)})
    //   this.videoElement.setAttribute('controls', 'controls')
    // }

    // const currentTimeStamp = new TimeStamp(this.videoElement.currentTime)
    this.videoElement.ontimeupdate = (e) => {
      const timestamp = timeToLiteralTimestamp((e.target as HTMLVideoElement).currentTime)
      this.timestampElement.timestamp =  timestamp
    }
  }

  togglePlay() {
    if (this.playing == false) {
      this.play()
      // this.videoElement.play()
      // this.playing = true
    }
    else {
      this.pause()
      // this.videoElement.pause()
      // this.playing = false
    }
  }
  play() {
    this.videoElement.play()
    this.playing = true
  }
  stop() {
    this.videoElement.pause()
    this.playing = false
  }
  pause() { this.stop() }


  loadVideo (source: string) {
    this.source = source
  }

  reloadCaptions () {
    this.updateTime = Date.now()
    // this.requestUpdate()
  }

  stepBack(seconds = 1) {
    this.videoElement.currentTime = this.videoElement.currentTime - seconds
  }
  stepForward(seconds = 1) {
    this.videoElement.currentTime = this.videoElement.currentTime + seconds
  }

  speedDown() {
    this.speed -= 0.125
    this.videoElement.playbackRate = this.speed
    // window.toast(''+this.speed, 1000)
  }
  speedUp() {
    this.speed += 0.125
    this.videoElement.playbackRate = this.speed
    // window.toast(''+this.speed, 1000)
  }


  @state()
  private _seekForEndInterval?: NodeJS.Timer
  private _seekForEndResolve?: (value: unknown) => void
  private _seekForEndReject?: (reason?: any) => void
  clearPlayFroTo () {
    if (this._seekForEndInterval) {
      clearInterval(this._seekForEndInterval)
      this._seekForEndInterval = undefined
    }
    this._seekForEndResolve = undefined
    this._seekForEndReject = undefined
  }
  playFroTo (fro: number, to: number, resetOnEnd = false) {
    this.clearPlayFroTo()
    this.videoElement.currentTime = fro
    return new Promise((resolve, reject) => {
      this._seekForEndResolve = resolve
      this._seekForEndReject = reject

      if (!this.playing) {
        this.togglePlay()
      }
      // interval
      this._seekForEndInterval = setInterval(() => {
        if (this.playing) {
          if (this.videoElement.currentTime >= to) {
            if (this._seekForEndResolve) {
              // this.togglePlay()
              this.stop()
              if (resetOnEnd) {
                this.videoElement.currentTime = fro
              }
              console.log(`stopped at ${this.videoElement.currentTime}`)
              this._seekForEndResolve!(null)
            }
            this.clearPlayFroTo()
          }
        }
      }, 10)
    })
  }
  cancelPlayFroTo () {
    if (this._seekForEndReject) {
      this._seekForEndReject()
    }
    this.clearPlayFroTo()
  }


  get currentTime () {
    return this.videoElement.currentTime
  }

  set currentTime (value: number) {
    this.videoElement.currentTime = value
  }
}
