
export async function getVideoName () {
  const r = await fetch('/api/get-video-name')
  return await r.text()
}