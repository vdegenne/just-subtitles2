// import { TimeCodeSpanVTT } from './timecode.mjs'
import { SubtitlesFileVTT, SubtitlesFileSRT } from './subtitles-file.mjs'

export class Subtitle extends Array {
  nextOf(subtitle) {
    return this[this.indexOf(subtitle) + 1]
  }

  offsetAll(milliseconds) {
    for (let subtitle of this) {
      subtitle.offset(milliseconds)
    }
  }
}

export class SubtitlesVTT extends Subtitle {
  constructor(input, langs) {
    super()
    if (!input) {
      return
    }
    const file = new SubtitlesFileVTT(input, langs)
    this.concat(file.getSubtitles())
  }
}

export class SubtitlesSRT extends Subtitle {
  constructor(input, langs) {
    super()
    if (!input) {
      return
    }
    const file = new SubtitlesFileSRT(input, langs)
    this.concat(file.getSubtitles())
  }
}
