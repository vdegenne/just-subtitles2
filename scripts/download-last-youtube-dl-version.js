const ydl = require('youtube-dl-wrap');
const path = require('node:path')
const fs = require('fs')

;(async function () {
  const releases = await ydl.getGithubReleases(1, 1)
  const version = releases[0].tag_name

  // download
  await ydl.downloadFromGithub(path.join(__dirname, 'youtube-dl'), version);

  // save version number
  fs.writeFileSync(path.join(__dirname, 'ydl-version.txt'), version);
})();