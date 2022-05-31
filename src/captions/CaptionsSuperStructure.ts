import { VTTTrack } from './Track';
import { VTTCue, Cue } from './Cue'
import { TimeStamp } from './TimeStamp'

export type Block = {
  type: 'header'|'cue'|'line'|'style'|'note'|'other';
  block: string[]|VTTCue;
}

export class CaptionsSuperStructure {
  protected source: string
  protected langs: 'any'|string[]
  protected blocks: Block[] = []
  protected styles: string[][] = []
  public cues: VTTTrack = new VTTTrack()

  constructor(input: string, langs = ['any']) {
    this.source = input
    // this.raw = this.raw.replace(/\r\n/g, '\n')
    // this.langs = langs.split(',')
    // this.langs = (langs instanceof Array) ? langs.split(',') : null
    this.langs = langs

    // @TODO: clean empty lines
    this.processBlocks(this.source.split(/\n/g), langs)
  }

  processBlocks(lines: string[], langs: string[]) {
    throw new Error('Method not implemented.')
  }

  // getSubtitles() {
  //   return this.cues
  //   // return this.blocks.filter(b => b.type === 'cue').map(b => b.block)
  // }

  findCueBlockWithTime (startTime: TimeStamp, endTime: TimeStamp) {
    return this.blocks.find(b => {
      return b.type === 'cue'
        && (b.block as Cue).startTime.equals(startTime)
        && ((b.block as Cue).endTime != null && (b.block as Cue).endTime!.equals(endTime))
    })
  }

  getBlockIndex(block:Block) {
    return this.blocks.indexOf(block)
  }
  getBlockIndexFromCue (cue: Cue) {
    return this.blocks.findIndex(b=>b.block==cue)
  }

  insertBlock (index: number, block: Block, spaceAround = true) {
    this.blocks.splice(index, 0, block)
    if (block.type != 'line' && this.blocks[index - 1].type != 'line') {
      // add a line between
      this.blocks.splice(index, 0, { type: 'line', block: [] })
    }
    this.updateCueList()
  }

  updateCueList () {
    this.cues = new VTTTrack();
    for (const block of this.blocks) {
      if (block.type == 'cue') {
        this.cues.push(block.block)
      }
    }
  }

  toString(langs = ['any']) {
    return this.blocks
            .map((b,i) => {
              if (b.type == 'cue') {
                return `${b.block.toString(langs)}${i==this.blocks.length - 1 ? '' : '\n'}`
              }
              else if (b.type == 'line') {
                return `${i!=this.blocks.length - 1 ? '\n' : ''}`
              }
              else {
                return `${(b.block as string[]).join('\n')}${i==this.blocks.length - 1 ? '' : '\n'}`
              }
            })
            .join('')
  }

  get blockSize () {
    return this.blocks.length
  }
}

/**
 * VTTTextTrack
 */
export class VTTCaptionsSuperStructure extends CaptionsSuperStructure {
  override processBlocks(lines: string[], langs: string[]) {
    this.blocks = []
    this.styles = []
    this.cues = new VTTTrack()

    function getEndOfBlockIndex (lines: string[]): number {
      const index = lines.findIndex(el => el.match(/^\s*$/))
      return index >= 0 ? index : lines.length
    }

    while (lines.length != 0) {

      /* EMPTY LINE */
      if (lines[0].match(/^\s*$/)) {
        this.blocks.push({
          type: 'line',
          block: [lines.shift()!]
        })
        continue
      }

      /* HEADER */
      if (lines[0].startsWith('WEBVTT')) {
        this.blocks.push({
          type: 'header',
          block: [lines.shift()!]
        })
        continue
      }

      /* NOTE */
      if (lines[0].startsWith('NOTE')) {
        this.blocks.push({
          type: 'note',
          block: lines.splice(0, getEndOfBlockIndex(lines))
        })
        continue
      }

      /* STYLE */
      if (lines[0] === 'STYLE') {
        /* should use the styles array ? */
        this.blocks.push({
          type: 'style',
          block: lines.splice(0, getEndOfBlockIndex(lines))
        })
        // this.styles.push(line)
        continue
      }

      /* CUE */
      if (lines[0].match(VTTCue.timeCodeRegexp) || (lines[1] && lines[1].match(VTTCue.timeCodeRegexp))) {
        const cue = new VTTCue(lines.splice(0, getEndOfBlockIndex(lines)), langs)
        this.blocks.push({
          type: 'cue',
          block: cue
        })
        // this.cues.push(cue)
        continue
      }

      /* OTHER */
      this.blocks.push({
        type: 'other',
        block: lines.splice(0, getEndOfBlockIndex(lines))
      })
    }

    this.updateCueList()
  }

  // toSubtitlesFileSRT() {
  //   const srt = Object.assign(new SubtitlesFileSRT(), this)
  //   srt.blocks = srt.blocks.filter(b => b.type === 'cue')
  //   srt.cues = new SubtitlesSRT()
  //   for (let block of srt.blocks) {
  //     block.block = Object.assign(new TimeCodeSpanSRT(), block.block)
  //     block.block.start = Object.assign(new TimeCodeSRT(), block.block.start)
  //     if (block.block.end) {
  //       block.block.end = Object.assign(new TimeCodeSRT(), block.block.end)
  //     }
  //     srt.cues.push(block.block)
  //   }
  //   return srt
  // }
}

// export class SubtitlesFileSRT extends CaptionsFile {
//   processBlocks(blocks, langs) {
//     this.blocks = []
//     this.cues = new SubtitlesSRT()
//     for (let block of blocks) {
//       /* CUE */
//       if (
//         block[0].match(TimeCodeSpanSRT.regexp) ||
//         (block[1] && block[1].match(TimeCodeSpanSRT.regexp))
//       ) {
//         const timecodespan = new TimeCodeSpanSRT(block, langs)
//         this.blocks.push({
//           type: 'cue',
//           block: timecodespan
//         })
//         this.cues.push(timecodespan)
//         continue
//       }

//       /* OTHER */
//       this.blocks.push({
//         type: 'other',
//         block
//       })
//     }
//   }

//   toString(langs) {
//     return this.blocks
//       .map(b => {
//         if (b.type === 'cue') {
//           return b.block.toString(langs)
//         }
//       })
//       .join('\n\n')
//   }
// }
