// All-in-one代理
// 作者: https://github.com/XCQ0607

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const path = url.pathname.slice(1) // Remove leading '/'

  if (path === '' || path === 'index.html') {
    return getIndexPage()
  }

  let targetUrl = path
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl
  }

  return await fetchAndModify(targetUrl, request)
}

function getIndexPage() {
  const html = `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>All-in-one代理</title>
    <style>
    body {
      font-family: Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background-color: #f0f0f0;
    }
    .container {
      text-align: center;
      background-color: white;
      padding: 2rem;
      border-radius: 10px;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    input[type="text"] {
      width: 300px;
      padding: 0.5rem;
      margin-right: 0.5rem;
    }
    button {
      padding: 0.5rem 1rem;
      background-color: #007bff;
      color: white;
      border: none;
      cursor: pointer;
    }
    .author {
      margin-top: 1rem;
      font-size: 0.8rem;
      color: #666;
    }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>All-in-one代理</h1>
      <form onsubmit="return false;">
        <input type="text" id="urlInput" placeholder="请输入要访问的网址">
        <button onclick="navigate()">访问</button>
      </form>
      <div class="author">
        作者: <a href="https://github.com/XCQ0607" target="_blank">https://github.com/XCQ0607</a>
      </div>
    </div>
    <script>
    function navigate() {
      const url = document.getElementById('urlInput').value;
      if (url) {
        window.location.href = '/' + url;
      }
    }
    </script>
  </body>
  </html>
  `;
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=UTF-8' }
  });
}

async function fetchAndModify(url, request) {
  // 检查是否是对自身的请求，如果是，直接返回错误
  if (url.includes(new URL(request.url).hostname)) {
    return new Response('Error: Cannot proxy to self', { status: 400 });
  }

  const response = await fetch(url, {
    method: request.method,
    headers: request.headers,
    body: request.body
  })

  const contentType = response.headers.get('Content-Type')
  if (contentType) {
    if (contentType.includes('text/html')) {
    let text = await response.text()
    text = modifyHtml(text, new URL(url).origin, request)
    return new Response(text, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers)
    })
    } else if (contentType.includes('text/css')) {
    let text = await response.text()
    text = modifyCss(text, new URL(url).origin, request)
    return new Response(text, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers)
    })
    } else if (contentType.includes('application/javascript') || contentType.includes('text/javascript')) {
    let text = await response.text()
    text = modifyJs(text, new URL(url).origin, request)
    return new Response(text, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers)
    })
    }
  }

  return response
}

function modifyHtml(html, baseUrl, request) {
  const workerUrl = new URL(request.url).origin
  return html.replace(/(href|src|action)=(["'])(\/[^"']*|https?:\/\/[^"']*)(["'])/g, (match, attr, quote, url, endQuote) => {
    if (url.startsWith('/')) {
    url = baseUrl + url
    }
    return `${attr}=${quote}${workerUrl}/${url}${endQuote}`
  })
}

function modifyCss(css, baseUrl, request) {
  const workerUrl = new URL(request.url).origin
  return css.replace(/url\((["']?)(\/[^"')]*|https?:\/\/[^"')]*)(["']?)\)/g, (match, quote, url, endQuote) => {
    if (url.startsWith('/')) {
    url = baseUrl + url
    }
    return `url(${quote}${workerUrl}/${url}${endQuote})`
  })
}

function modifyJs(js, baseUrl, request) {
  const workerUrl = new URL(request.url).origin
  // 这里的正则表达式可能需要根据具体情况进行调整
  return js.replace(/(["'])((https?:)?\/\/[^"']*)(["'])/g, (match, quote, url, protocol, endQuote) => {
    if (url.startsWith('//')) {
    url = 'https:' + url
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = baseUrl + url
    }
    return `${quote}${workerUrl}/${url}${endQuote}`
  })
}
