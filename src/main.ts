import { LitElement, html, css, nothing } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { createDirectory, createProject } from './util'

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
  .directory, .project {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 15px 12px;
    margin: 8px;
    border-radius: 12px;
  }
  .directory:hover, .project:hover {
    background-color: #eee;
  }
  .directory > mwc-icon, .project > mwc-icon {
    margin-right: 10px;
  }
  .project[state=pending] {
    color: red;
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
      ${(directory as DirectoryLeaf).child.map(c => {
        if (c.type == 'directory') {
          return html`
          <div class=directory @click=${() => { this.path = c.path }}>
            <mwc-icon>folder</mwc-icon><span>${c.path.split('/').pop()}</span>
          </div>
          `
        }
        else if (c.type == 'project') {
          return html`
          <div class=project state=${'pending'} @click=${() => { window.location.pathname = `${c.path}/` }}>
            <mwc-icon>video_stable</mwc-icon><span>${c.path.split('/').pop()}</span>
          </div>
          `
        }
      })}
    </div>

    <div style="text-align:center">
      <mwc-button unelevated icon=folder
          style="--mdc-theme-primary:#fb8c00;--mdc-theme-on-primary:white;"
          @click=${()=>{this.onNewFolderClick()}}>new folder</mwc-button>
      <mwc-button unelevated icon=video_stable
          style="--mdc-theme-primary:#673ab7;--mdc-theme-on-primary:white;"
          @click=${()=>{this.onNewProjectClick()}}>new project</mwc-button>
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

  onNewProjectClick() {
    const name = prompt('Project name')
    if (name) {
      const youtube = prompt('Youtube URL')
      if (youtube) {
        const cwd = this.cwd() as DirectoryLeaf
        if (cwd.child.some(c=>c.name === name)) {
          window.toast('This directory already exists')
          return
        }
        createProject(this.path, name, youtube).then(() => {
          this.refreshTree()
        })
      }
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
