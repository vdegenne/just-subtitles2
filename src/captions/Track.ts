import { Cue } from './Cue'

export class Track extends Array<Cue> {
  nextOf(caption) {
    return this[this.indexOf(caption) + 1]
  }

  offsetAll(milliseconds) {
    for (const caption of this) {
      caption.offset(milliseconds)
    }
  }
}

export class VTTTrack extends Track {
  constructor(input?: string, langs?: string[]) {
    super()
    if (!input) {
      return
    }
    // const file = new SubtitlesFileVTT(input, langs)
    // this.concat(file.getSubtitles())
  }
}

export class SRTTrack extends Track {
  constructor(input, langs) {
    super()
    if (!input) {
      return
    }
    // const file = new SubtitlesFileSRT(input, langs)
    // this.concat(file.getSubtitles())
  }
}