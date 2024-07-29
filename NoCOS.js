addEventListener('fetch', event => {
  if (event.request.headers.get('Upgrade') === 'websocket') {
    return event.respondWith(handleWebSocket(event));
  } else {
    return event.respondWith(handleRequest(event.request));
  }
});

async function handleWebSocket(event) {
  const url = new URL(event.request.url);
  let targetUrl = url.pathname.slice(1); // 移除开头的 '/'
  
  if (!targetUrl.startsWith('ws://') && !targetUrl.startsWith('wss://')) {
    targetUrl = 'wss://' + targetUrl;
  }

  const pair = new WebSocketPair();
  const [client, server] = Object.values(pair);

  server.accept();

  const targetWs = new WebSocket(targetUrl);

  targetWs.addEventListener('open', () => {
    server.send('Connected to target WebSocket');
  });

  targetWs.addEventListener('message', event => {
    server.send(event.data);
  });

  server.addEventListener('message', event => {
    targetWs.send(event.data);
  });

  server.addEventListener('close', () => {
    targetWs.close();
  });

  targetWs.addEventListener('close', () => {
    server.close();
  });

  return new Response(null, {
    status: 101,
    webSocket: client,
  });
}

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
    modifiedResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    modifiedResponse.headers.set('Access-Control-Allow-Headers', '*')
    
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
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #fff;
            border-radius: 5px;
            padding: 20px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            text-align: center;
        }
        input[type="text"] {
            width: 100%;
            padding: 10px;
            margin-bottom: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
        }
        button {
            display: block;
            width: 100%;
            padding: 10px;
            background-color: #3498db;
            color: #fff;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover {
            background-color: #2980b9;
        }
        .author {
            margin-top: 20px;
            text-align: center;
            font-size: 14px;
            color: #7f8c8d;
        }
        .author a {
            color: #3498db;
            text-decoration: none;
        }
        .author a:hover {
            text-decoration: underline;
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
