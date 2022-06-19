import Koa from 'koa'
import Router from 'koa-router'
import statics from 'koa-static'
import mount from 'koa-mount'
import fs from 'node:fs'
import koaBody from 'koa-body'
import path, { extname, join as pathJoin } from 'node:path'
import open from 'open'
import { getTree, localURI, projectExists, createDirectory, isProjectDirectory, getMetaData, saveMeta } from './util.js'
import {promisify} from 'util'
const glob = promisify((await import('glob')).default)
import {WebSocketServer} from 'ws'
import { executeYoutubeDl } from './youtube-dl/youtube-dl-module.js'

const port = 33771
const app = new Koa
const router = new Router

app.use(koaBody())
app.use(mp4Middleware())

app.use(statics('docs'))
app.use(mount('/src', statics('src')))

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

router.post('/api/create-directory', async ctx => {
  try {
    const { path, name } = ctx.request.body
    if (path && name) {
      await createDirectory(pathJoin('docs', path, name))
      return ctx.body = ''
    } else {
      throw new Error;
    }
  } catch (e) {
    ctx.throw()
  }
})

router.post('/api/create-project', async ctx => {
  try {
    const { path, name, youtube } = ctx.request.body
    if (path && name && youtube) {
      const target = pathJoin('docs', path, name)
      await createDirectory(target)
      await saveMeta(target, {
        state: 'pending',
        youtube
      })
      return ctx.body = ''
    }
    else {
      throw new Error;
    }
  } catch (e) {
    ctx.throw()
  }
})

router.get('/api/get-tree', async ctx => {
  return ctx.body = getTree(`docs${path.sep}files`)
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
  const env = process.env.ENV
  if (env && env.toLocaleLowerCase() == 'prod') {
    open(`http://localhost:${port}/`)
  }
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


/**
 * WebSocket (for downloading video with progression feature)
 */
const wss = new WebSocketServer({port: 8080})
wss.on('connection', function connection (ws, req) {
  ws.send('hey')
  ws.on('message', async function message (load) {
    load = JSON.parse(load.toString())
    if (!('command' in load)) { ws.send('Not a command message'); return  }
    switch (load.command) {
      case 'youtube-dl':
        if (!('path' in load)) { ws.send('Path not provided'); return }
        const projectLocation = pathJoin('docs', load.path)
        if (isProjectDirectory(projectLocation)) {
          const quality = 'quality' in load ? load.quality : 'worst';
          // const meta = await import('file:///' + path.resolve(projectLocation, 'meta.json'), { assert: { type: 'json' }})
          const meta = await getMetaData(projectLocation)
          executeYoutubeDl(meta.youtube, quality, pathJoin(projectLocation, 'output.mp4'))
            .on('progress', (progress) => {
              ws.send(JSON.stringify(progress))
            })
            // .on('youtubeDlEvent', (eventType, eventData) => console.log(eventType, eventData))
            .on('error', err => { ws.send(`Smh went wrong... oops (${err})`); ws.close(); })
            .on('close', () => { ws.send('Video download complete'); ws.close(); })
        }
        else {
          ws.send('The path is not a valid project.')
        }
        break;
    }
  })
})
