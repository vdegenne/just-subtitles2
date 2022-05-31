const ydlwrap = require('youtube-dl-wrap');
const path = require('path');
const ydl = new ydlwrap(path.join(__dirname, 'youtube-dl'));

ydl.exec(['https://www.youtube.com/watch?v=p0JFc5giu9U',
  '--rm-cache-dir', '-f', 'worst', '-o', 'output.mp4'])
  .on('progress', (progress) =>
    console.log(progress.percent, progress.totalSize, progress.currentSpeed, progress.eta))
  .on('youtubeDlEvent', (eventType, eventData) => console.log(eventType, eventData))
  .on('error', (error) => console.error(error))
  .on('close', () => console.log('all done'));