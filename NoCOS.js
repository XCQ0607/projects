addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // 如果是根路径,返回前端页面
  if (url.pathname === '/' || url.pathname === '') {
    return new Response(generateFrontend(), {
      headers: { 'Content-Type': 'text/html' },
    })
  }
  
  // 处理代理请求
  let targetUrl = url.pathname.slice(1) // 移除开头的 '/'
  
  // 如果URL不包含协议，添加 'https://'
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl
  }
  
  try {
    const proxyResponse = await fetch(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body
    })
    
    const modifiedResponse = new Response(proxyResponse.body, proxyResponse)
    
    // 添加CORS头
    modifiedResponse.headers.set('Access-Control-Allow-Origin', '*')
    
    return modifiedResponse
  } catch (error) {
    return new Response('Error: ' + error.message, { status: 500 })
  }
}

function generateFrontend() {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NoCOS代理</title>
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
        <h1>NoCOS代理</h1>
        <input type="text" id="urlInput" placeholder="输入要代理的URL（例如：example.com）">
        <button onclick="proxyUrl()">代理</button>
        <div class="author">
            作者: <a href="https://github.com/XCQ0607" target="_blank">https://github.com/XCQ0607</a>
        </div>
    </div>
    <script>
        function proxyUrl() {
            const url = document.getElementById('urlInput').value;
            const proxyUrl = '/' + url;
            window.open(proxyUrl, '_blank');
        }
    </script>
</body>
</html>
  `
}
