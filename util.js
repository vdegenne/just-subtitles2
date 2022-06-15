import fs, { statSync } from 'fs';
import path, { join as pathJoin } from 'path';

export function localURI (pathname) {
  return `./docs/${pathname}`
}


export function projectExists (pathname) {
  return fs.existsSync(localURI(pathname))
}


export function writeFileStream(ctx, start, end, filePath, stat) {

  return new Promise((resolve, reject) => {
    let stream = void 0
    if (!this.isMedia(filePath)) {
      let err = new Error('This path is not a media')
      reject(err)
      return false
    }
    if (stat.isFile()) {
      stream = fs.createReadStream(filePath, { start: start, end: end })
      stream.on('open', length => {
        stream.pipe(ctx.res)
      })
      stream.on('error', err => {
        reject(err)
      })
      stream.on('end', () => {
        resolve('success')
      })
    } else {
      let err = new Error('This path is not a filepath')
      reject(err)
    }
  })
}

const sep = path.sep
export function getTree (path) {
  if (isProjectDirectory(path)) {
    return {
      type: 'project',
      path: path.split(sep).slice(1).join(sep).replace(/\\/g, '/'),
    }
  }
  else if (isPathDirectory(path)) {
    return {
      type: 'directory',
      path: path.split(sep).slice(1).join(sep).replace(/\\/g, '/'),
      child: getPathDirectories(path).map(directory => getTree(pathJoin(path, directory)))
    }
  }
}
export function getPathDirectories (path) {
  return fs.readdirSync(path).filter(file => {
    const stat = fs.statSync(pathJoin(path, file));
    return stat.isDirectory()
  })
}
export function isPathDirectory (path) {
  return !fs.existsSync(pathJoin(path, 'meta.json'))
}
export function isProjectDirectory (path) { return !isPathDirectory(path) }