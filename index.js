const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = 8080
const fetch = require('node-fetch')

const forbiddenHeaders = ['transfer-encoding', 'content-encoding']
const cache = {}

app.use(bodyParser.raw())

app.all('*', async (req, res, next) => {
  try {
    const url = `https:/${req.path}`

    let remoteHeaders, remoteBody, remoteStatus

    if (req.method === 'GET' && cache[url]) {
      remoteStatus = cache[url][0]
      remoteHeaders = cache[url][1]
      remoteBody = cache[url][2]
    } else {
      console.log('DOWNLOADING ' + url)
      req.headers.host = req.path.split('/')[0]
      const remoteRes = await fetch(url, {
        method: req.method,
        headers: req.headers,
        body: req.method !== 'GET' ? req.body : null,
      })

      remoteStatus = remoteRes.status
      remoteHeaders = {}
      for (let [k, v] of remoteRes.headers) {
        if (!forbiddenHeaders.includes(k)) {
          remoteHeaders[k] = v
        }
      }
      remoteBody = await remoteRes.text()

      cache[url] = [remoteStatus, remoteHeaders, remoteBody]
    }

    res.status(remoteStatus)
    Object.keys(remoteHeaders).forEach(k => {
      res.setHeader(k, remoteHeaders[k])
    })
    res.send(remoteBody)
  } catch (e) {
    console.error(e.message)

    res.status(500)
    res.send(e.message)
  }
  res.end()
})

app.listen(port, () =>
  console.log(`Example app listening on port ${port}!`)
)
