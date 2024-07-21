// All-in-one代理
// 作者: https://github.com/XCQ0607

// 用于存储需要修改的内容类型
const CONTENT_TYPES = ['text/html', 'text/css', 'application/javascript', 'application/x-javascript', 'text/javascript'];

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname.slice(1); // 移除开头的 '/'

  if (path === '' || path === 'index.html') {
    return getIndexPage();
  }

  // 检查是否是对自身的请求
  if (url.hostname === new URL(request.url).hostname) {
    return new Response('错误：不能代理自身', { status: 400 });
  }

  let targetUrl = path;
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl;
  }

  return await fetchAndModify(targetUrl, request);
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
        作者: <a href="https://github.com/XCQ0607" target="_blank">XCQ0607</a>
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
  const response = await fetch(url, {
    method: request.method,
    headers: request.headers,
    body: request.body
  });

  const contentType = response.headers.get('Content-Type');
  if (contentType && CONTENT_TYPES.some(type => contentType.includes(type))) {
    let text = await response.text();
    text = modifyContent(text, new URL(url).origin, contentType);
    return new Response(text, {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers)
    });
  }

  return response;
}

function modifyContent(content, baseUrl, contentType) {
  const workerUrl = new URL(self.location.href).origin;

  if (contentType.includes('text/html')) {
    content = content.replace(/<head>/i, `<head><base href="${baseUrl}/">`);
  }

  // 修改 URL
  content = content.replace(
    /((?:href|src|url|action)\s*=\s*["'])((?!data:|#|javascript:)(?:\/[^"']*|https?:\/\/[^"']*))(["'])/gi,
    (match, attr, url, quote) => {
      if (url.startsWith('/')) {
        url = baseUrl + url;
      } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = baseUrl + '/' + url;
      }
      return `${attr}${workerUrl}/${url}${quote}`;
    }
  );

  // 修改 CSS 中的 URL
  if (contentType.includes('text/css')) {
    content = content.replace(
      /url\(["']?((?!data:)(?:\/[^)"']*|https?:\/\/[^)"']*))["']?\)/gi,
      (match, url) => {
        if (url.startsWith('/')) {
          url = baseUrl + url;
        } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = baseUrl + '/' + url;
        }
        return `url("${workerUrl}/${url}")`;
      }
    );
  }

  // 修改 JavaScript 中的 URL
  if (contentType.includes('javascript')) {
    content = content.replace(
      /((?:(?:let|const|var)\s+\w+\s*=\s*["']|\.(?:src|href)\s*=\s*["']|fetch\(["']))((?!data:|#|javascript:)(?:\/[^"']*|https?:\/\/[^"']*))(["'])/gi,
      (match, prefix, url, suffix) => {
        if (url.startsWith('/')) {
          url = baseUrl + url;
        } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = baseUrl + '/' + url;
        }
        return `${prefix}${workerUrl}/${url}${suffix}`;
      }
    );
  }

  return content;
}
