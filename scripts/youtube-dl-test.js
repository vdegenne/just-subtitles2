import ydlwrap from 'youtube-dl-wrap'
import path from 'node:path'
import url from 'url'
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const ydl = new ydlwrap(path.join(__dirname, 'youtube-dl'));

ydl.exec(['https://www.youtube.com/watch?v=5WFjM0YOTCE',
  '--rm-cache-dir', '-f', 'worst', '-o', 'output.mp4'])
  .on('progress', (progress) =>
    console.log(progress.percent, progress.totalSize, progress.currentSpeed, progress.eta))
  .on('youtubeDlEvent', (eventType, eventData) => console.log(eventType, eventData))
  .on('error', (error) => console.error(error))
  .on('close', () => console.log('all done'));