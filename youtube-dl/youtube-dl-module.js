import ydlwrap from 'youtube-dl-wrap'
import path from 'node:path'
import url from 'url'
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
/** YoutubeDL wrapper */
const ydl = new ydlwrap(path.join(__dirname, 'youtube-dl'));


export function downloadYoutubeVideo (url, quality = 'worst', output = 'output.mp4') {
  return new Promise((resolve, reject) => {
    ydl.exec([url, '--rm-cache-dir', '-f', quality, '-o', output])
      .on('progress', (progress) =>
        console.log(progress.percent, progress.totalSize, progress.currentSpeed, progress.eta))
      .on('youtubeDlEvent', (eventType, eventData) => console.log(eventType, eventData))
      .on('error', (error) => reject(error))
      .on('close', () => resolve());
  })
}


export function executeYoutubeDl (url, quality, output) {
  return ydl.exec([url, '--rm-cache-dir', '-f', quality, '-o', output])
}