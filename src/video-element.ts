import { css, html, LitElement, nothing, PropertyValueMap } from 'lit'
import { customElement, query, state } from 'lit/decorators.js'

@customElement('video-element')
export class VideoElement extends LitElement {
  @query('video') videoElement!: HTMLVideoElement;

  @state() source?: string;
  // @state() captionsSource?: string;
  @state() updateTime = Date.now();

  @state() playing = false

  static styles = css`
  video {
    display: block;
    width: 100%;
  }
  video::-webkit-media-controls-panel {
   opacity: 1 !important;
  }
  `

  render() {
    return html`
    <video controls>
    ${this.source ? html`
      <source src="./${this.source}">
    `: nothing}
      <track src="./captions.vtt?${this.updateTime}" default>
    </video>
    `
  }

  protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    // @ts-ignore
    // this.videoElement.ontimeupdate = async () => {
    //   this.videoElement.removeAttribute('controls')
    //   // await new Promise((resolve) => { setTimeout(resolve, 0)})
    //   this.videoElement.setAttribute('controls', 'controls')
    // }
  }

  togglePlay() {
    if (this.playing == false) {
      this.videoElement.play()
      this.playing = true
    }
    else {
      this.videoElement.pause()
      this.playing = false
    }
  }


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
  playFroTo (fro: number, to: number) {
    this.clearPlayFroTo()
    this.videoElement.currentTime = fro
    new Promise((resolve, reject) => {
      this._seekForEndResolve = resolve
      this._seekForEndReject = reject
    })
    if (!this.playing) {
      this.togglePlay()
    }
    // interval
    this._seekForEndInterval = setInterval(() => {
      if (this.playing) {
        if (this.videoElement.currentTime >= to) {
          if (this._seekForEndResolve) {
            this.togglePlay()
            console.log(`stopped at ${this.videoElement.currentTime}`)
            this._seekForEndResolve!(null)
          }
          this.clearPlayFroTo()
        }
      }
    }, 10)
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