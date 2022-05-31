import { VTTTimeStamp } from './TimeStamp';

export class TimeCode<T> {
  public startTime!: T;
  public endTime!: T;
}


export class VTTTimeCode extends TimeCode<VTTTimeStamp> {
  static separator = ' --> '

  constructor (startTime: VTTTimeStamp|number, endTime: VTTTimeStamp|number) {
    super()
    if (startTime instanceof VTTTimeStamp) {
      this.startTime = startTime
    }
    else {
      this.startTime = new VTTTimeStamp(startTime)
    }
    if (endTime instanceof VTTTimeStamp) {
      this.endTime = endTime
    }
    else {
      this.endTime = new VTTTimeStamp(endTime)
    }
  }
}