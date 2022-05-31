import fs from 'fs';

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