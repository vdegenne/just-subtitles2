import { css, html, LitElement, nothing, PropertyValueMap } from 'lit'
import { customElement, query, state } from 'lit/decorators.js'
import { getIdFromYoutubeUrl, getMetadata } from '../docs/util';
import { TimeStampElement } from './timestamp-element';
import { sleep, timeToLiteralTimestamp } from './util';
import { YoutubePlayerWrapper } from './YoutubePlayerWrapper';

declare global {
  interface Window {
    onYouTubeIframeAPIReady: Function;
  }
}

declare type Mode = 'local'|'youtube'

@customElement('video-element')
export class VideoElement extends LitElement {

  /**
   * State
   */
  @state() private mode: Mode = 'local';
  @state() source?: string;
  @state() updateTime = Date.now();
  @state() playing = false
  @state() controls = false
  @state() speed = 1;

  private youtubeScript?: HTMLScriptElement;
  private youtubePlayerWrapper?: YoutubePlayerWrapper;


  /**
   * Queries
   */
  get videoElement (): HTMLVideoElement {
    if (this.mode == 'local') {
      return this.shadowRoot!.querySelector('video')!
    }
    else {
      return this.youtubePlayerWrapper!
    }
  }
  // @query('video') videoElement!: HTMLVideoElement;
  @query('#youtubeElement') youtubeElement!: HTMLDivElement;
  @query('#currentTime') timestampElement!: TimeStampElement;

  static styles = css`
  :host {
    color: white;
  }
  .videoContainer {
    display: none;
  }
  .videoContainer[active] {
    display: block;
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

  /**
   * Render
   */
  render() {
    return html`
    <!-- local -->
    <div class="videoContainer" ?active=${this.mode == 'local'}>
      <video ?controls=${this.controls}>
      ${this.source ? html`
        <source src="./${this.source}">
      `: nothing}
        <track src="./captions.vtt?${this.updateTime}" default>
      </video>
    </div>
    <!-- youtube -->
    <div class="videoContainer" ?active=${this.mode == 'youtube'}>
      <div id="youtubeElement" style="display:block"></div>
    </div>
    <!-- video informations -->
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

    // bind class method to the API call
    window.onYouTubeIframeAPIReady = this.onYouTubeIframeAPIReady.bind(this)
  }

  onTimeUpdate (e) {
    console.log(e.target)
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
    // if (this.videoElement instanceof HTMLVideoElement) {
    //   this.videoElement.play()
    // }
    // else if (this.videoElement instanceof YT.Player) {
      this.videoElement.play()
    // }
    this.playing = true
  }
  stop(at?: number) {
    // if (this.videoElement instanceof HTMLVideoElement) {
    //   this.videoElement.pause()
    // }
    // else if (this.videoElement instanceof YT.Player) {
    if (at) {
      this.videoElement.currentTime = at
    }
      this.videoElement.pause()
    // }
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
  async playFroTo (fro: number, to: number, resetOnEnd = false) {
    this.clearPlayFroTo()
    this.videoElement.currentTime = fro
    // on "youtube" mode setting the currentTime is slower because the video is buffered from a remote server
    // then we wait for the chunk to finish loading
    if (this.mode == 'youtube') {
      // await (this.videoElement as YoutubePlayerWrapper).playResume
      // await sleep(200)
      const past = Date.now()
      await (this.videoElement as YoutubePlayerWrapper).seekComplete
      console.log(`seek complete after ${(Date.now() - past)} ms`)
    }

    if (!this.playing) {
      this.togglePlay()
    }


    return new Promise((resolve, reject) => {
      this._seekForEndResolve = resolve
      this._seekForEndReject = reject

      // interval
      this._seekForEndInterval = setInterval(() => {
        if (this.playing) {
          if (this.videoElement.currentTime >= to) {
            if (this._seekForEndResolve) {
              // this.togglePlay()
              this.stop(to)
              if (resetOnEnd) {
                this.videoElement.currentTime = fro
              }
              console.log(`stopped at ${this.videoElement.currentTime}`)
              this._seekForEndResolve!(null)
            }
            this.clearPlayFroTo()
          }
        }
      }, 5)
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


  /**
   * Youtube
   */

  switchMode () {
    if (this.mode == 'local') {
      this.mode = 'youtube'
      this.activateYouTube()
    }
    else {
      this.mode  = 'local'
    }
  }

  activateYouTube() {
    if (!this.youtubeScript) {
      this.youtubeScript = document.createElement('script');
      this.youtubeScript.src = "https://www.youtube.com/iframe_api";
      this.shadowRoot!.append(this.youtubeScript)
    }
  }

  async onYouTubeIframeAPIReady () {
    const {youtube: youtubeUrl} = await getMetadata()
    const videoId = getIdFromYoutubeUrl(youtubeUrl)!
    // this.player =
    const player = new window.YT.Player(this.youtubeElement, {
      // height: '195',
      // width: '320',
      videoId,
      playerVars: {
        'playsinline': 1,
      },
      events: {
        'onReady': (e) => {
          e.target.setVolume(50)
        },
        'onStateChange': e => { console.log(e) }
      }
    });

    this.youtubePlayerWrapper = new YoutubePlayerWrapper(player)
  }
}
