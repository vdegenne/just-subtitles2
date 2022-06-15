import { LitElement, html, css, nothing } from 'lit'
import { customElement, state } from 'lit/decorators.js'

type ProjectLeaf = { type: 'project', path: string }
type DirectoryLeaf = { type: 'directory', path: string, child: Tree }
type Leaf = ProjectLeaf | DirectoryLeaf
type Root = Leaf
type Tree = Leaf[]

@customElement('app-container')
export class AppContainer extends LitElement {
  @state() tree!: Root;
  @state() path: string = 'files';

  constructor () {
    super()
    fetch('/api/get-tree').then(async response => {
      this.tree = await response.json()
    })
  }

  static styles = css`
  :host {
    display: block;
    max-width: 500px;
    margin: 0 auto;
  }
  .directory {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 15px 12px;
    margin: 8px;
    border-radius: 12px;
  }
  .directory:hover {
    background-color: #eee;
  }
  .directory > mwc-icon {
    margin-right: 10px;
  }
  [hide] {
    display: none;
  }
  `

  render () {
    if (!this.tree) return nothing

    const directory = getLeaf(this.tree, this.path)!

    return html`
    <h2 style="padding-left:24px">${directory.path}</h2>
    <div id=child>
      <div class=directory @click=${()=>{this.path = this.path.split('/').slice(0, -1).join('/')}} ?hide=${this.path == 'files'}>..</div>
      ${(directory as DirectoryLeaf).child.map(c => html`
      <div class=directory @click=${() => {
        if (c.type == 'directory') { this.path = c.path }
        else if (c.type == 'project') { window.location.pathname = `${c.path}/` }
      }}>
        <mwc-icon>${c.type == 'directory' ? 'folder' : 'video_stable'}</mwc-icon><span>${c.path.split('/').pop()}</span>
      </div>
      `)}
    </div>
    `
  }
}


function getLeaf (leaf: Root, path: string): Leaf|null {
  if (leaf.path == path) {
    return leaf
  }
  if (leaf.type == 'project' || (leaf.type == 'directory' && leaf.child.length == 0)) {
    return null
  }
  for (const dir of leaf.child) {
    const found = getLeaf(dir, path)
    if (found !== null) {
      return found
    }
  }
  return null
}
