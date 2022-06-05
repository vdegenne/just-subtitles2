import { CaptionsSuperStructure } from './CaptionsSuperStructure';
import { Cue } from './Cue'

export interface Block {
  content: string[]
  get height (): number;
  get line (): number;
}

export class BlockBase implements Block {
  context: CaptionsSuperStructure;
  content: string[]

  constructor (context: CaptionsSuperStructure, content: any[]) {
    this.context = context;
    this.content = content;
  }

  get height () {
    return this.content.length;
  }

  get line () {
    const previousBlocks = this.context.blocks.slice(0, this.context.getBlockIndex(this))
    const height = previousBlocks.reduce((acc, block) => acc + (block.height || 0), 0)
    return height + 1
  }
}

export class HeaderBlock extends BlockBase {}
export class StyleBlock extends BlockBase {}
export class NoteBlock extends BlockBase {}
export class CueBlock extends BlockBase {
  cue: Cue
  constructor (context: CaptionsSuperStructure, cue: Cue) {
    super(context, cue.source)
    this.cue = cue
  }
}
export class LineBlock extends BlockBase {}
export class UndefinedBlock extends BlockBase {}

export function isLine(block: Block) { return block instanceof LineBlock }
export function isCue(block: Block) { return block instanceof CueBlock }