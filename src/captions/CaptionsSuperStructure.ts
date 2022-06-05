import { VTTTrack } from './Track';
import { Cue, VTTCue } from './Cue'
import { TimeStamp } from './TimeStamp'
import { Block, CueBlock, HeaderBlock, isCue, isLine, LineBlock, NoteBlock, StyleBlock, UndefinedBlock } from './Block';


export interface CaptionsSuperStructure {
  blocks: Block[];
  processBlocks(lines: string[], langs: string[]): void;
  getBlockIndex (block: Block): number;
}

export class CaptionsSuperStructureBase implements CaptionsSuperStructure {
  protected source: string
  protected langs: 'any'|string[]
  blocks: Block[] = []
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

  getCueBlockFromInterval (startTime: TimeStamp, endTime: TimeStamp) {
    return this.blocks.find(b => {
      return isCue(b)
        && (b as CueBlock).cue.startTime.equals(startTime)
        && ((b as CueBlock).cue.endTime != null && (b as CueBlock).cue.endTime!.equals(endTime))
    })
  }

  getCueBlockFromIndex (index: number) {
    return this.blocks.filter(b=>isCue(b))[index]
  }

  getBlockIndex(block:Block) {
    return this.blocks.indexOf(block)
  }
  getBlockIndexFromCue (cue: Cue) {
    return this.blocks.findIndex(b=>isCue(b) && (b as CueBlock).cue==cue)
  }

  insertBlock (index: number, block: Block, spaceAround = true) {
    this.blocks.splice(index, 0, block)
    if (!isLine(block) && !isLine(this.blocks[index - 1])) {
      // add a line between
      this.blocks.splice(index, 0, new LineBlock(this, ['']))
    }
    this.updateCueList()
  }

  updateCueList () {
    this.cues = new VTTTrack();
    for (const block of this.blocks) {
      if (isCue(block)) {
        this.cues.push((block as CueBlock).cue)
      }
    }
  }

  toString(langs = ['any']) {
    return this.blocks
            .map((b,i) => {
              if (isCue(b)) {
                return `${(b as CueBlock).cue.toString(langs)}${i==this.blocks.length - 1 ? '' : '\n'}`
              }
              else if (isLine(b)) {
                return `${i!=this.blocks.length - 1 ? '\n' : ''}`
              }
              else {
                return `${(b.content).join('\n')}${i==this.blocks.length - 1 ? '' : '\n'}`
              }
            })
            .join('')
  }

  get blockSize () {
    return this.blocks.length
  }
}

/**
 *
 */
export class VTTCaptionsSuperStructure extends CaptionsSuperStructureBase implements CaptionsSuperStructure {
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
        this.blocks.push(new LineBlock(this, [lines.shift()]))
        // this.blocks.push({
        //   type: 'line',
        //   block: [lines.shift()!]
        // })
        continue
      }

      /* HEADER */
      if (lines[0].startsWith('WEBVTT')) {
        this.blocks.push(new HeaderBlock(this, [lines.shift()]))
        // this.blocks.push({
        //   type: 'header',
        //   block: [lines.shift()!]
        // })
        continue
      }

      /* NOTE */
      if (lines[0].startsWith('NOTE')) {
        this.blocks.push(new NoteBlock(this, lines.splice(0, getEndOfBlockIndex(lines))))
        // this.blocks.push({
        //   type: 'note',
        //   block: lines.splice(0, getEndOfBlockIndex(lines))
        // })
        continue
      }

      /* STYLE */
      if (lines[0] === 'STYLE') {
        this.blocks.push(new StyleBlock(this, lines.splice(0, getEndOfBlockIndex(lines))))
        /* should use the styles array ? */
        // this.blocks.push({
        //   type: 'style',
        //   block: lines.splice(0, getEndOfBlockIndex(lines))
        // })
        // this.styles.push(line)
        continue
      }

      /* CUE */
      if (lines[0].match(VTTCue.timeCodeRegexp) || (lines[1] && lines[1].match(VTTCue.timeCodeRegexp))) {
        const cue = new VTTCue(lines.splice(0, getEndOfBlockIndex(lines)), langs)
        this.blocks.push(new CueBlock(this, cue))
        // this.blocks.push({
        //   type: 'cue',
        //   block: cue
        // })
        // this.cues.push(cue)
        continue
      }

      /* OTHER */
      this.blocks.push(new UndefinedBlock(this, lines.splice(0, getEndOfBlockIndex(lines))))
      // this.blocks.push({
      //   type: 'other',
      //   block: lines.splice(0, getEndOfBlockIndex(lines))
      // })
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
