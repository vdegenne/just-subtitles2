import '@material/mwc-snackbar'
import '@material/mwc-button'
// import '@material/mwc-icon-button'
// import '@material/mwc-dialog'
// import '@material/mwc-textfield'
// import '@material/mwc-checkbox'

import './main'
import './editor-view'
import './video-element'
import './textarea-element'

import { AppContainer } from './main';



declare global {
  interface Window {
    app: AppContainer;
    toast: (labelText: string, timeoutMs?: number) => void;
  }
}