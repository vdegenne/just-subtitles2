import {ensureZero} from './util'

// export interface TimeStamp {

// }

export class TimeStamp {
  protected static timeSeparator = ':'
  protected static milliSeparator = '.'

  protected raw: string|number;
  protected hours: number;
  protected minutes: number;
  protected seconds: number;
  protected milliseconds: number;


  constructor(input: string|number) {
    this.raw = input
    if (typeof input == 'string') {
      const parts = input.split((this.constructor as typeof TimeStamp).timeSeparator as string)
      this.hours = parseInt(parts[0])
      this.minutes = parseInt(parts[1])
      const secondParts = parts[2].split((this.constructor as typeof TimeStamp).milliSeparator as string)
      this.seconds = parseInt(secondParts[0])
      if (secondParts[1]) {
        this.milliseconds = parseInt(secondParts[1])
      } else {
        this.milliseconds = 0
      }
    }
    else if (typeof input == 'number') {
      this.hours = 0
      this.minutes = 0
      input = ''+input
      const parts = input.split('.')
      this.seconds = parseInt(parts[0])
      this.milliseconds = Math.trunc(parseFloat('0.' + (parts[1] || 0)) * 1000)
      if (this.seconds / 60 >= 1) {
        this.minutes = Math.floor(this.seconds / 60)
        this.seconds -= this.minutes * 60

        if (this.minutes / 60 >= 1) {
          this.hours = Math.floor(this.minutes / 60)
          this.minutes -= this.hours * 60
        }
      }
    }
    else {
      throw new Error('unknown type')
    }
  }

  equals (timestamp: TimeStamp) {
    return timestamp.hours == this.hours
      && timestamp.minutes == this.minutes
      && timestamp.seconds == this.seconds
      && timestamp.milliseconds == this.milliseconds;
  }

  /**
   * Add x milliseconds to the timecode
   * @param {number} x milliseconds
   */
  add(x) {
    this.milliseconds += x
    if (this.milliseconds >= 1000) {
      const seconds = Math.floor(this.milliseconds / 1000)
      this.milliseconds -= seconds * 1000
      this.seconds += seconds
      if (this.seconds >= 60) {
        const minutes = Math.floor(this.seconds / 60)
        this.seconds -= minutes * 60
        this.minutes += minutes
        if (this.minutes >= 60) {
          const hours = Math.floor(this.minutes / 60)
          this.minutes -= hours * 60
          this.hours += hours
        }
      }
    }
  }
  /**
   * Substract x milliseconds from the timecode
   * @param {number} x milliseconds
   */
  substract(x: number) {
    this.milliseconds -= x
    if (this.milliseconds < 0) {
      const seconds = Math.floor(Math.abs(this.milliseconds) / 1000)
      this.milliseconds = 1000 - Math.abs(this.milliseconds + seconds * 1000)
      this.seconds -= seconds + 1
      if (this.seconds < 0) {
        const minutes = Math.floor(Math.abs(this.seconds) / 60)
        this.seconds = 60 - Math.abs(this.seconds + minutes * 60)
        this.minutes -= minutes + 1
        if (this.minutes < 0) {
          const hours = Math.floor(Math.abs(this.minutes) / 60)
          this.minutes = 60 - Math.abs(this.minutes + hours * 60)
          this.hours -= hours + 1
          if (this.hours < 0) {
            this.hours = 0
            this.minutes = 0
            this.seconds = 0
            this.milliseconds = 0
          }
        }
      }
    }
  }

  toSeconds() {
    let milliseconds = this.milliseconds.toString()
    if (milliseconds.length === 1) {
      milliseconds = `00${milliseconds}`
    }
    if (milliseconds.length === 2) {
      milliseconds = `0${milliseconds}`
    }

    return parseFloat(
      `${this.hours * 60 * 60 +
        this.minutes * 60 +
        this.seconds}.${milliseconds}`
    )
  }

  toString() {
    let milliseconds = this.milliseconds.toString()
    if (milliseconds.length === 1) {
      milliseconds = `00${milliseconds}`
    }
    if (milliseconds.length === 2) {
      milliseconds = `0${milliseconds}`
    }
    return `${ensureZero(this.hours)}:${ensureZero(this.minutes)}:${ensureZero(
      this.seconds
    )}${(this.constructor as typeof TimeStamp).milliSeparator}${milliseconds}`
  }
}

export class VTTTimeStamp extends TimeStamp {
  static timeSeparator = ':'
  static milliSeparator = '.'
  // static get splitSymbol() {
  //   return ':'
  // }
  // static get splitSecondsSymbol() {
  //   return '.'
  // }
}

export class SRTTimeStamp extends TimeStamp {
  static timeSeparator = ':'
  static milliSeparator = ','
  // static get splitSymbol() {
  //   return ':'
  // }
  // static get splitSecondsSymbol() {
  //   return ','
  // }
}
