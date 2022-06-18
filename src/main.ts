import { LitElement, html, css, nothing } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { createDirectory } from './util'

type ProjectLeaf = { type: 'project', path: string, name: string }
type DirectoryLeaf = { type: 'directory', path: string, child: Tree, name: string }
type Leaf = ProjectLeaf | DirectoryLeaf
type Root = Leaf
type Tree = Leaf[]

@customElement('app-container')
export class AppContainer extends LitElement {
  @state() tree!: Root;
  @state() path: string = 'files';

  constructor () {
    super()
    this.refreshTree()
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

  refreshTree () {
    fetch('/api/get-tree').then(async response => {
      this.tree = await response.json()
    })
  }

  cwd () {
    return getLeaf(this.tree, this.path)!
  }

  render () {
    if (!this.tree) return nothing

    const directory = this.cwd()

    return html`
    <h2 style="padding-left:24px">${directory.path}</h2>
    <div id=child>
      <div class=directory @click=${()=>{this.path = this.path.split('/').slice(0, -1).join('/')}} ?hide=${this.path == 'files'}>..</div>
      ${(directory as DirectoryLeaf).child.map(c => html`
      <div class=directory @click=${() => {
        if (c.type == 'directory') { this.path = c.path }
        else if (c.type == 'project') { window.location.pathname = `${c.path}/` }
      }}>
        <mwc-icon style="color:red">${c.type == 'directory' ? 'folder' : 'video_stable'}</mwc-icon><span>${c.path.split('/').pop()}</span>
      </div>
      `)}
    </div>

    <div style="text-align:center">
      <mwc-button unelevated icon=folder
          style="--mdc-theme-primary:#fb8c00;--mdc-theme-on-primary:white;"
          @click=${()=>{this.onNewFolderClick()}}>new folder</mwc-button>
    </div>
    `
  }

  onNewFolderClick() {
    const name = prompt('Folder name')
    if (name) {
      const cwd = this.cwd() as DirectoryLeaf
      if (cwd.child.some(c=>c.name === name)) {
        window.toast('This directory already exists')
        return
      }
      createDirectory(this.path, name).then(() => {
        this.refreshTree()
      })
    }
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
