export async function getMetadata () {
  const r = await fetch('./meta.json')
  if (r.status !== 200) { throw new Error('File not found') }
  return await r.json()
}

export async function getVideoName () {
  const r = await fetch('/api/get-video-name')
  return await r.text()
}