export function getProjectPath () {
  return window.location.pathname;
}

export async function getMetadata () {
  const r = await fetch('./meta.json')
  if (r.status !== 200) { throw new Error('File not found') }
  return await r.json()
}

export async function getVideoName () {
  const r = await fetch('/api/get-video-name')
  if (r.status !== 200) { throw new Error('Video not found') }
  return await r.text()
}


export function getIdFromYoutubeUrl (url) {
  const urlObject = new URL(url)
  return urlObject.searchParams.get('v')
}