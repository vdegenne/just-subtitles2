
type  Resolve = () => void;
/**
 * This element is not meant to be used as an html element!
 * It is a wrapper around the youtube Player class
 * to be used in the video element to seemingly switch between local video and youtube video.
 */
export class YoutubePlayerWrapper extends HTMLVideoElement {
  private _player: YT.Player;

  private _playResumePromise: Promise<void> = Promise.resolve();

  private _seekCompletePromise?: Promise<void> = undefined;
  private _seekCompleteResolve?: () => void;
  private _seekCompleteReject?: () => void;
  private _seekCompleteCheckInterval?: NodeJS.Timeout;

  constructor (player: YT.Player) {
    super()
    this._player = player;

    let playResumeResolve: Resolve|undefined = undefined;
    this._player.addEventListener('onStateChange', (e: YT.OnStateChangeEvent) => {
      if (e.data == YT.PlayerState.PAUSED || e.data == YT.PlayerState.UNSTARTED || e.data == YT.PlayerState.ENDED) {
        this._playResumePromise = new Promise((resolve: Resolve/*, reject*/) => {
          playResumeResolve = resolve
        })
      }
      if (e.data == YT.PlayerState.PLAYING && playResumeResolve) {
        playResumeResolve()
      }
    })


    this._player.addEventListener('onReady', ()=>{console.log('yep cock')})
  }

  get playResume () : Promise<void> { return this._playResumePromise }

  async play (): Promise<void> {
    this._player.playVideo()
  }

  async pause (): Promise<void> {
    this._player.pauseVideo()
  }

  set playbackRate (rate: number) {
    this._player.setPlaybackRate(rate)
  }

  get currentTime () {
    return this._player.getCurrentTime()
  }
  set currentTime (time: number) {
    this.clearSeekCompletePromise()
    this._player.seekTo(time, true)
    // here we need to initiate a seek complete promise
    // we wait 500ms max or else if we receive a buffer state change event
    this._seekCompletePromise = new Promise((resolve, reject) => {
      this._seekCompleteResolve = resolve
      this._seekCompleteReject = reject

      console.log(`seeking ${time}`)
      this._seekCompleteCheckInterval = setInterval(() => {
        if (this.currentTime >= time && this.currentTime <= time + 0.010) {
          console.log(`seek complete at ${this.currentTime}`)
          resolve()
          this.clearSeekCompleteCheckInterval()
        }
      }, 10)
    })
  }
  private clearSeekCompletePromise () {
    if (this._seekCompletePromise) {
      if (this._seekCompleteReject) {
        this._seekCompleteReject()
      }
      this._seekCompleteReject = undefined
      this._seekCompleteResolve = undefined
      this._seekCompleteResolve = undefined
      this.clearSeekCompleteCheckInterval()
    }
  }
  private clearSeekCompleteCheckInterval () {
    if (this._seekCompleteCheckInterval) {
      clearTimeout(this._seekCompleteCheckInterval)
      this._seekCompleteCheckInterval = undefined
    }
  }

  get seekComplete () : Promise<void>|undefined { return this._seekCompletePromise }
}

// This registering is a little hack to be able to create a new instance of the HTMLVideoElement extended class above.
window.customElements.define('youtube-player-wrapper', YoutubePlayerWrapper, { extends: 'video' })