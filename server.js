import Koa from 'koa'
import Router from 'koa-router'
import statics from 'koa-static'
import fs from 'node:fs'
import koaBody from 'koa-body'
import path, { extname } from 'node:path'
import { localURI, projectExists } from './util.js'
import {promisify} from 'util'
const glob = promisify((await import('glob')).default)

const port = 33771
const app = new Koa
const router = new Router

app.use(koaBody())
app.use(mp4Middleware())

app.use(statics('docs'))

router.get('/ping', function (ctx) {
  return ctx.body = 'pong'
})

router.get('/api/get-video-name', async ctx => {
  const url = new URL(ctx.request.header['referer'])
  const refererPathName = decodeURIComponent(url.pathname.slice(1))
  if (projectExists(refererPathName)) {
    const filepaths = await glob(`${localURI(refererPathName)}/*.mp4`)
    if (filepaths.length > 0) {
      const filepath = filepaths[0]
      return ctx.body = (filepath.split('/')).pop()
    }
  }
})

router.post('/api/save-captions', async ctx => {
  const url = new URL(ctx.request.header['referer'])
  const refererPathName = decodeURIComponent(url.pathname.slice(1))
  if (projectExists(refererPathName)) {
    fs.writeFile(path.join(localURI(refererPathName), 'captions.vtt'), ctx.request.body, ()=>{})
    return ctx.body = ''
  }
})

router.get('/api/get-captions', async ctx => {
  const url = new URL(ctx.request.header['referer'])
  const refererPathName = decodeURIComponent(url.pathname.slice(1))
  let captions
  if (projectExists(refererPathName)) {
    try {
      captions = fs.readFileSync(path.join(localURI(refererPathName), 'captions.vtt'),)
    } catch (e) {
      captions = ''
    }
    return ctx.body = captions
  }
})


app.use(router.routes()).use(router.allowedMethods())

app.use(async ctx => {
  const pathname = decodeURIComponent(ctx.url.slice(1))
  if (fs.existsSync(path.join(localURI(pathname), 'meta.json'))) {
    ctx.set('content-type', 'text/html; charset=utf-8')
    ctx.body = fs.readFileSync(`docs/editor.html`)
  }
})


app.listen(port, function () {
  console.log(`http://localhost:${port}/`)
})


function mp4Middleware () {
  return async function (ctx, next) {
    const url = decodeURIComponent(ctx.request.url)
    const extension  = extname(url).slice(1)

    if (extension == 'mp4') {
      const filepath = path.join(localURI(url))
      const stat = fs.statSync(filepath)
      const range = ctx.request.header['range'] || 'bytes=0-'
      const bytes = range.split('=').pop().split('-')
      const fileStart = Number(bytes[0])
      const fileEnd = Number(bytes[1]) || stat.size - 1
      ctx.type = 'video/mp4'
      ctx.set('Accept-Ranges', 'bytes')
      if (fileEnd > stat.size - 1 || fileStart > stat.size - 1) {
        ctx.status = 416
        ctx.set('Content-Range', `bytes ${stat.size}`)
        ctx.body = 'Requested Range Not Satisfiable'
      }
      else {
        ctx.status = 206
        ctx.set('Content-Range', `bytes ${fileStart}-${fileEnd}/${stat.size}`)
        const readStream = fs.createReadStream(filepath, { start: fileStart, end: fileEnd })
        return ctx.body = readStream;
        // try {
        //   await writeFileStream(ctx, fileStart, fileEnd, absolutePath, stat)
        // } catch (e) {
        //   throw new Error(e)
        // }
      }
    }

    return next()
  }
}