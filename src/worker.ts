/**
 * C4-PlantUML to draw.io Converter - Cloudflare Worker
 *
 * Converts C4 PlantUML diagrams to draw.io XML format via HTTP API.
 * Includes a web UI for interactive conversion and download.
 */

import { Catalyst } from '@altbe/c4-puml-to-drawio'

interface Env {
  MAX_INPUT_SIZE?: string
  CORS_ORIGIN?: string
}

const MAX_INPUT_SIZE = 100 * 1024 // 100KB default
const VERSION = '1.0.0'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const corsOrigin = env.CORS_ORIGIN || '*'

    const corsHeaders = {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    // Route handling
    switch (url.pathname) {
      case '/':
        return new Response(getIndexHtml(), {
          headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' }
        })

      case '/health':
        return Response.json(
          { status: 'ok', version: VERSION },
          { headers: corsHeaders }
        )

      case '/convert':
        return handleConvert(request, url, env, corsHeaders)

      default:
        return new Response('Not Found', { status: 404, headers: corsHeaders })
    }
  }
}

async function handleConvert(
  request: Request,
  url: URL,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed. Use POST.', {
      status: 405,
      headers: corsHeaders
    })
  }

  const maxSize = parseInt(env.MAX_INPUT_SIZE || '') || MAX_INPUT_SIZE
  const contentLength = parseInt(request.headers.get('Content-Length') || '0')
  if (contentLength > maxSize) {
    return new Response(`Input too large. Maximum size: ${maxSize} bytes`, {
      status: 413,
      headers: corsHeaders
    })
  }

  try {
    const puml = await request.text()

    if (!puml.trim()) {
      return new Response('Empty input. Provide PlantUML content in request body.', {
        status: 400,
        headers: corsHeaders
      })
    }

    const options = {
      layoutDirection: (url.searchParams.get('direction') || 'TB') as 'TB' | 'BT' | 'LR' | 'RL',
      nodesep: parseInt(url.searchParams.get('nodesep') || '60'),
      ranksep: parseInt(url.searchParams.get('ranksep') || '80'),
      marginx: parseInt(url.searchParams.get('marginx') || '20'),
      marginy: parseInt(url.searchParams.get('marginy') || '20'),
    }

    const drawioXml = await Catalyst.convert(puml, options)

    return new Response(drawioXml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Content-Disposition': 'attachment; filename="diagram.drawio"'
      }
    })

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(`Conversion error: ${message}`, {
      status: 500,
      headers: corsHeaders
    })
  }
}

function getIndexHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>C4-PlantUML to draw.io Converter</title>
  <style>
    :root {
      --primary: #0067BA;
      --primary-dark: #005299;
      --bg: #f8f9fa;
      --card-bg: #ffffff;
      --border: #dee2e6;
      --text: #212529;
      --text-muted: #6c757d;
      --success: #198754;
      --error: #dc3545;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    header {
      text-align: center;
      margin-bottom: 30px;
    }
    h1 {
      font-size: 1.75rem;
      color: var(--primary);
      margin-bottom: 8px;
    }
    .subtitle {
      color: var(--text-muted);
      font-size: 0.95rem;
    }
    .main-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    @media (max-width: 900px) {
      .main-grid { grid-template-columns: 1fr; }
    }
    .card {
      background: var(--card-bg);
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      padding: 20px;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .card-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text);
    }
    textarea {
      width: 100%;
      height: 400px;
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
      font-size: 13px;
      padding: 12px;
      border: 1px solid var(--border);
      border-radius: 6px;
      resize: vertical;
      background: #fafafa;
    }
    textarea:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(0,103,186,0.1);
    }
    .output-area {
      width: 100%;
      height: 400px;
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
      font-size: 12px;
      padding: 12px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: #f5f5f5;
      overflow: auto;
      white-space: pre-wrap;
      word-break: break-all;
    }
    .controls {
      display: flex;
      gap: 12px;
      margin: 20px 0;
      flex-wrap: wrap;
      align-items: center;
    }
    .control-group {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .control-group label {
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    select, input[type="number"] {
      padding: 8px 12px;
      border: 1px solid var(--border);
      border-radius: 6px;
      font-size: 0.9rem;
      background: white;
    }
    input[type="number"] { width: 70px; }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-primary {
      background: var(--primary);
      color: white;
    }
    .btn-primary:hover { background: var(--primary-dark); }
    .btn-primary:disabled {
      background: #94a3b8;
      cursor: not-allowed;
    }
    .btn-secondary {
      background: white;
      color: var(--text);
      border: 1px solid var(--border);
    }
    .btn-secondary:hover { background: #f1f5f9; }
    .btn-success {
      background: var(--success);
      color: white;
    }
    .btn-success:hover { background: #157347; }
    .status {
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 0.9rem;
      margin-top: 16px;
    }
    .status.success {
      background: #d1e7dd;
      color: #0f5132;
      border: 1px solid #badbcc;
    }
    .status.error {
      background: #f8d7da;
      color: #842029;
      border: 1px solid #f5c2c7;
    }
    .status.info {
      background: #cff4fc;
      color: #055160;
      border: 1px solid #b6effb;
    }
    .hidden { display: none; }
    .actions {
      display: flex;
      gap: 10px;
      margin-top: 12px;
    }
    footer {
      text-align: center;
      margin-top: 40px;
      padding: 20px;
      color: var(--text-muted);
      font-size: 0.85rem;
    }
    footer a {
      color: var(--primary);
      text-decoration: none;
    }
    footer a:hover { text-decoration: underline; }
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top-color: currentColor;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>C4-PlantUML to draw.io</h1>
      <p class="subtitle">Convert C4 architecture diagrams to editable draw.io format</p>
    </header>

    <div class="controls">
      <div class="control-group">
        <label for="direction">Direction:</label>
        <select id="direction">
          <option value="TB" selected>Top to Bottom</option>
          <option value="LR">Left to Right</option>
          <option value="BT">Bottom to Top</option>
          <option value="RL">Right to Left</option>
        </select>
      </div>
      <div class="control-group">
        <label for="nodesep">Node Gap:</label>
        <input type="number" id="nodesep" value="60" min="20" max="200">
      </div>
      <div class="control-group">
        <label for="ranksep">Rank Gap:</label>
        <input type="number" id="ranksep" value="80" min="20" max="200">
      </div>
      <button id="convertBtn" class="btn btn-primary">
        <span id="btnText">Convert</span>
        <span id="btnSpinner" class="spinner hidden"></span>
      </button>
    </div>

    <div class="main-grid">
      <div class="card">
        <div class="card-header">
          <span class="card-title">PlantUML Input</span>
          <button id="loadExample" class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.8rem;">Load Example</button>
        </div>
        <textarea id="input" placeholder="Paste your C4 PlantUML diagram here..."></textarea>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">draw.io Output</span>
          <span id="outputSize" style="font-size: 0.8rem; color: var(--text-muted);"></span>
        </div>
        <div id="output" class="output-area">Output will appear here after conversion...</div>
        <div class="actions">
          <button id="downloadBtn" class="btn btn-success hidden">Download .drawio</button>
          <button id="copyBtn" class="btn btn-secondary hidden">Copy XML</button>
        </div>
      </div>
    </div>

    <div id="status" class="status hidden"></div>

    <footer>
      Powered by <a href="https://github.com/altbe/c4-puml-to-drawio" target="_blank">c4-puml-to-drawio</a>
      &middot; Open the downloaded file in <a href="https://app.diagrams.net" target="_blank">draw.io</a>
    </footer>
  </div>

  <script>
    const EXAMPLE = \`@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml

title Internet Banking System - Container Diagram

Person(customer, "Banking Customer", "A customer of the bank")

System_Boundary(banking, "Internet Banking System") {
    Container(spa, "Single-Page App", "JavaScript, React", "Provides banking functionality via browser")
    Container(mobile, "Mobile App", "React Native", "Provides banking functionality via mobile")
    Container(api, "API Gateway", "Node.js, Express", "Handles all API requests")
    ContainerDb(db, "Database", "PostgreSQL", "Stores user accounts, transactions")
    ContainerQueue(queue, "Message Queue", "RabbitMQ", "Async job processing")
}

System_Ext(email, "Email System", "Sends notification emails")
System_Ext(bank, "Core Banking", "Legacy banking system")

Rel(customer, spa, "Uses", "HTTPS")
Rel(customer, mobile, "Uses")
Rel(spa, api, "Calls", "REST/JSON")
Rel(mobile, api, "Calls", "REST/JSON")
Rel(api, db, "Reads/Writes", "SQL")
Rel(api, queue, "Publishes", "AMQP")
Rel(api, bank, "Uses", "SOAP/XML")
Rel(queue, email, "Sends via", "SMTP")
@enduml\`;

    let lastXml = '';

    const input = document.getElementById('input');
    const output = document.getElementById('output');
    const status = document.getElementById('status');
    const convertBtn = document.getElementById('convertBtn');
    const btnText = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');
    const downloadBtn = document.getElementById('downloadBtn');
    const copyBtn = document.getElementById('copyBtn');
    const outputSize = document.getElementById('outputSize');
    const loadExample = document.getElementById('loadExample');

    loadExample.addEventListener('click', () => {
      input.value = EXAMPLE;
      showStatus('Example loaded. Click Convert to generate draw.io output.', 'info');
    });

    convertBtn.addEventListener('click', async () => {
      const puml = input.value.trim();
      if (!puml) {
        showStatus('Please enter PlantUML content', 'error');
        return;
      }

      setLoading(true);
      hideStatus();

      try {
        const params = new URLSearchParams({
          direction: document.getElementById('direction').value,
          nodesep: document.getElementById('nodesep').value,
          ranksep: document.getElementById('ranksep').value,
        });

        const response = await fetch('/convert?' + params, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: puml
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        lastXml = await response.text();
        output.textContent = lastXml;
        outputSize.textContent = formatSize(lastXml.length);

        downloadBtn.classList.remove('hidden');
        copyBtn.classList.remove('hidden');

        showStatus('Conversion successful! Download the .drawio file and open in draw.io.', 'success');
      } catch (err) {
        showStatus('Error: ' + err.message, 'error');
        output.textContent = 'Conversion failed. Check input and try again.';
        downloadBtn.classList.add('hidden');
        copyBtn.classList.add('hidden');
      } finally {
        setLoading(false);
      }
    });

    downloadBtn.addEventListener('click', () => {
      if (!lastXml) return;
      const blob = new Blob([lastXml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'diagram.drawio';
      a.click();
      URL.revokeObjectURL(url);
    });

    copyBtn.addEventListener('click', async () => {
      if (!lastXml) return;
      await navigator.clipboard.writeText(lastXml);
      const originalText = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = originalText; }, 1500);
    });

    function setLoading(loading) {
      convertBtn.disabled = loading;
      btnText.textContent = loading ? 'Converting...' : 'Convert';
      btnSpinner.classList.toggle('hidden', !loading);
    }

    function showStatus(message, type) {
      status.textContent = message;
      status.className = 'status ' + type;
    }

    function hideStatus() {
      status.className = 'status hidden';
    }

    function formatSize(bytes) {
      if (bytes < 1024) return bytes + ' B';
      return (bytes / 1024).toFixed(1) + ' KB';
    }
  </script>
</body>
</html>`
}
