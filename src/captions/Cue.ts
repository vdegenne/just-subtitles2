import { TimeStamp, VTTTimeStamp } from './TimeStamp';
import { distributeLanguages } from './util'

export class Cue {
  protected cueName?: string;
  public startTime!: TimeStamp
  public endTime!: TimeStamp|null
  protected langs?: 'all'|string[]
  protected text?: {}|undefined;

  // constructor(raw) {
  //   this.raw = raw
  //   raw = this.constructor.regexp.exec(raw)
  //   this.start = new this.constructor.timeCodeClass(raw.groups.start)
  //   this.end = raw.groups.end
  //     ? new this.constructor.timeCodeClass(raw.groups.end)
  //     : null
  //   Object.assign(this, (({ start, end, ...o }) => ({ ...o }))(raw.groups))
  // }
  /*   toString() {
    return `${this.start.toString()}${this.constructor.separator}${this.end
      ? this.end.toString()
      : ''}`
  }
  static get regexp() {
    return /(?<start>\d{1,2}:\d{2}:\d{2}\.\d{3}) --> (?<end>\d{1,2}:\d{2}:\d{2}\.\d{3})/
  }
  static get separator() {
    return ' --> '
  } */

  public offset(milliseconds: number) {
    if (milliseconds < 0) {
      this.startTime.substract(Math.abs(milliseconds))
      if (this.endTime) {
        this.endTime.substract(Math.abs(milliseconds))
      }
    } else {
      this.startTime.add(milliseconds)
      if (this.endTime) {
        this.endTime.add(milliseconds)
      }
    }
  }
}

export class VTTCue extends Cue {
  public startTime!: VTTTimeStamp
  public endTime!: VTTTimeStamp|null
  static timeCodeRegexp = /(?<start>\d{1,2}:\d{2}:\d{2}\.\d{3}) --> ((?<end>\d{1,2}:\d{2}:\d{2}\.\d{3})( (?<meta>.+))?)?/
  static separator = ' --> '
  protected meta: string;

  constructor(input: string|string[], langs: string[] = ['any']) {
    super()

    let lines: string[] = (typeof input === 'string') ? input.split(/\n/g) : input;

    if (lines[0].match(VTTCue.timeCodeRegexp) == null) {
      this.cueName = lines.shift()
    }

    const timecode = VTTCue.timeCodeRegexp.exec(lines[0])
    if (!timecode) {
      throw new Error('Invalid Time Code')
    }
    this.startTime = new VTTTimeStamp(timecode.groups!.start)
    this.endTime = timecode.groups!.end
      ? new VTTTimeStamp(timecode.groups!.end)
      : null
    this.meta = timecode.groups!.meta
    if (lines.length > 1) {
      this.langs = langs
      // if (!(this.langs instanceof Array)) {
      //   this.langs = this.langs.split(',')
      // }
      this.text = distributeLanguages(lines.slice(1), this.langs)
    }
  }

  toString(langs = ['any']) {
    if (langs) {
      // if (!(langs instanceof Array)) {
      //   langs = langs.split(',')
      // }
    }
    let text
    if (this.text != undefined) {
      text = langs ? langs.map(l => this.text![l]) : Object.values(this.text)
    }

    return `${this.cueName
      ? `${this.cueName}\n`
      : ''}${this.startTime.toString()} --> ${this.endTime
      ? this.endTime.toString()
      : ''}${this.meta ? ` ${this.meta}` : ''}${this.text
      ? `\n${text.join('\n')}`
      : ''}`
  }
}

// export class SRTCue extends Cue {
//   constructor(raw, langs) {
//     super()
//     if (!raw) {
//       return
//     }
//     if (!(raw instanceof Array)) {
//       raw = raw.split(/\n/g)
//     }

//     if (!raw[0].match(this.constructor.regexp)) {
//       this.cueName = raw.shift()
//     }

//     const regexpResult = this.constructor.regexp.exec(raw[0])
//     this.start = new TimeCodeSRT(regexpResult.groups.start)
//     this.end = regexpResult.groups.end
//       ? new TimeCodeSRT(regexpResult.groups.end)
//       : null
//     if (raw.length > 1) {
//       this.langs = langs || 'all'
//       if (!(this.langs instanceof Array)) {
//         this.langs = this.langs.split(',')
//       }
//       this.text = distributeLanguages(raw, this.langs)
//     }
//   }

//   toString(langs) {
//     if (langs) {
//       if (!(langs instanceof Array)) {
//         langs = langs.split(',')
//       }
//     }
//     let text
//     if (this.text) {
//       text = langs ? langs.map(l => this.text[l]) : Object.values(this.text)
//     }

//     return `${this.cueName
//       ? `${this.cueName}\n`
//       : ''}${this.start.toString()} --> ${this.end
//       ? this.end.toString()
//       : ''}${text ? `\n${text.join('\n')}` : ''}`
//   }

//   static get separator() {
//     return ' --> '
//   }

//   static get regexp() {
//     return /(?<start>\d{1,2}:\d{2}:\d{2}\,\d{3}) --> ((?<end>\d{1,2}:\d{2}:\d{2}\,\d{3}))?/
//   }
// }