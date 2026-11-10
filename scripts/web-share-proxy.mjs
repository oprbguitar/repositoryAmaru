import { createHash, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import { createServer, request as httpRequest } from "node:http";
import { connect } from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const loopback = "127.0.0.1";
const listenPort = 5175;
const upstreamPort = 5174;
const upstreamHost = `${loopback}:${upstreamPort}`;
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const credentialsPath = resolve(projectRoot, ".share.env");

function loadCredentials() {
  try {
    const lines = readFileSync(credentialsPath, "utf8").split(/\r?\n/);
    const values = Object.fromEntries(
      lines
        .filter((line) => line && !line.startsWith("#"))
        .map((line) => {
          const separator = line.indexOf("=");
          return separator > 0
            ? [line.slice(0, separator), line.slice(separator + 1)]
            : ["", ""];
        }),
    );
    if (
      values.USERNAME !== "amaru" ||
      !/^[A-Za-z0-9_-]{40,}$/.test(values.PASSWORD ?? "")
    ) {
      throw new Error("invalid credentials");
    }
    return Object.freeze({
      username: values.USERNAME,
      password: values.PASSWORD,
    });
  } catch {
    throw new Error("Unable to load local share credentials");
  }
}

const credentials = loadCredentials();
const challenge = 'Basic realm="AMARU AI Observatory", charset="UTF-8"';
const basicHash = (value) =>
  createHash("sha256").update(value, "utf8").digest();
const expectedCredentialHash = basicHash(
  `${credentials.username}:${credentials.password}`,
);

function isAuthorized(header) {
  if (typeof header !== "string" || !/^Basic /i.test(header)) return false;
  const token = header.slice(6);
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(token)) return false;
  let decoded;
  try {
    const bytes = Buffer.from(token, "base64");
    if (bytes.toString("base64") !== token) return false;
    decoded = bytes.toString("utf8");
  } catch {
    return false;
  }
  const suppliedHash = basicHash(decoded);
  return timingSafeEqual(expectedCredentialHash, suppliedHash);
}

function isAllowedPath(requestUrl) {
  if (
    typeof requestUrl !== "string" ||
    !requestUrl.startsWith("/") ||
    requestUrl.startsWith("//")
  )
    return false;
  if (requestUrl.includes("\\") || /[\r\n\0]/.test(requestUrl)) return false;
  try {
    const parsed = new URL(requestUrl, `http://${upstreamHost}`);
    return parsed.origin === `http://${upstreamHost}`;
  } catch {
    return false;
  }
}

// Local control endpoints (health/shutdown of the dev server) must never be
// reachable through the shared link: the proxy runs on loopback, so the dev
// server alone cannot tell a shared visitor from the local user.
function isControlPath(requestUrl) {
  try {
    const pathname = new URL(requestUrl, `http://${upstreamHost}`).pathname;
    return pathname.toLowerCase().startsWith("/__amaru");
  } catch {
    return true;
  }
}

function sendNotFound(response) {
  response.writeHead(404, {
    "Cache-Control": "no-store",
    "Content-Length": "0",
    Connection: "close",
  });
  response.end();
}

function sendUnauthorized(response) {
  response.writeHead(401, {
    "WWW-Authenticate": challenge,
    "Cache-Control": "no-store",
    "Content-Length": "0",
    Connection: "close",
  });
  response.end();
}

function sendSocketUnauthorized(socket) {
  socket.end(
    `HTTP/1.1 401 Unauthorized\r\nWWW-Authenticate: ${challenge}\r\nCache-Control: no-store\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`,
  );
}

function sendUnavailable(response) {
  if (response.headersSent) {
    response.destroy();
    return;
  }
  const body = "Servicio temporalmente no disponible";
  response.writeHead(502, {
    "Content-Type": "text/plain; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    Connection: "close",
  });
  response.end(body);
}

const hopByHop = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "proxy-connection",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

function getConnectionTokens(headers) {
  return new Set(
    String(headers.connection ?? "")
      .split(",")
      .map((name) => name.trim().toLowerCase())
      .filter(Boolean),
  );
}

function forwardedHeaders(request) {
  const connectionTokens = getConnectionTokens(request.headers);
  const headers = Object.create(null);
  for (const [name, value] of Object.entries(request.headers)) {
    const lowerName = name.toLowerCase();
    if (
      lowerName === "authorization" ||
      lowerName === "host" ||
      hopByHop.has(lowerName) ||
      connectionTokens.has(lowerName)
    ) {
      continue;
    }
    headers[lowerName] = value;
  }
  headers.host = upstreamHost;
  headers["x-amaru-via-share"] = "1";
  return headers;
}

function proxyHttpRequest(request, response, sendContinue = false) {
  if (!isAuthorized(request.headers.authorization)) {
    sendUnauthorized(response);
    return;
  }
  if (!isAllowedPath(request.url)) {
    response.writeHead(400, { "Content-Length": "0", Connection: "close" });
    response.end();
    return;
  }
  if (isControlPath(request.url)) {
    sendNotFound(response);
    return;
  }
  if (sendContinue) response.writeContinue();

  const upstreamRequest = createServerRequest(request, response);
  request.on("aborted", () => upstreamRequest.destroy());
  request.pipe(upstreamRequest);
}

function createServerRequest(request, response) {
  const upstreamRequest = httpRequest({
    host: loopback,
    port: upstreamPort,
    method: request.method,
    path: request.url,
    headers: forwardedHeaders(request),
    agent: false,
  });
  upstreamRequest.on("response", (upstreamResponse) => {
    response.writeHead(
      upstreamResponse.statusCode ?? 502,
      upstreamResponse.headers,
    );
    upstreamResponse.pipe(response);
  });
  upstreamRequest.on("error", () => sendUnavailable(response));
  response.on("close", () => upstreamRequest.destroy());
  return upstreamRequest;
}

function proxyUpgrade(request, clientSocket, head) {
  if (!isAuthorized(request.headers.authorization)) {
    sendSocketUnauthorized(clientSocket);
    return;
  }
  if (!isAllowedPath(request.url)) {
    clientSocket.end(
      "HTTP/1.1 400 Bad Request\r\nConnection: close\r\nContent-Length: 0\r\n\r\n",
    );
    return;
  }

  if (isControlPath(request.url)) {
    clientSocket.end(
      "HTTP/1.1 404 Not Found\r\nConnection: close\r\nContent-Length: 0\r\n\r\n",
    );
    return;
  }

  const upstreamSocket = connect(upstreamPort, loopback);
  let connected = false;
  const fail = () => {
    if (connected) {
      upstreamSocket.destroy();
      clientSocket.destroy();
      return;
    }
    clientSocket.end(
      "HTTP/1.1 502 Bad Gateway\r\nConnection: close\r\nContent-Length: 0\r\n\r\n",
    );
    upstreamSocket.destroy();
  };
  upstreamSocket.setTimeout(10000, fail);
  upstreamSocket.on("connect", () => {
    connected = true;
    upstreamSocket.setTimeout(0);
    const connectionTokens = getConnectionTokens(request.headers);
    const headers = [];
    for (let index = 0; index < request.rawHeaders.length; index += 2) {
      const name = request.rawHeaders[index];
      const lowerName = name.toLowerCase();
      if (
        lowerName === "authorization" ||
        lowerName === "host" ||
        hopByHop.has(lowerName) ||
        connectionTokens.has(lowerName)
      ) {
        continue;
      }
      headers.push(`${name}: ${request.rawHeaders[index + 1]}`);
    }
    headers.push(
      `Host: ${upstreamHost}`,
      "X-Amaru-Via-Share: 1",
      "Connection: Upgrade",
      `Upgrade: ${request.headers.upgrade ?? "websocket"}`,
    );
    const requestHead = `${request.method} ${request.url} HTTP/${request.httpVersion}\r\n${headers.join("\r\n")}\r\n\r\n`;
    upstreamSocket.write(requestHead);
    if (head.length > 0) upstreamSocket.write(head);
    upstreamSocket.pipe(clientSocket);
    clientSocket.pipe(upstreamSocket);
  });
  upstreamSocket.on("error", fail);
  upstreamSocket.on("close", () => clientSocket.destroy());
  clientSocket.on("error", () => upstreamSocket.destroy());
  clientSocket.on("close", () => upstreamSocket.destroy());
}

function rejectConnect(request, socket) {
  if (!isAuthorized(request.headers.authorization)) {
    sendSocketUnauthorized(socket);
    return;
  }
  socket.end(
    "HTTP/1.1 405 Method Not Allowed\r\nConnection: close\r\nContent-Length: 0\r\n\r\n",
  );
}

const server = createServer();
server.on("request", (request, response) =>
  proxyHttpRequest(request, response),
);
server.on("checkContinue", (request, response) =>
  proxyHttpRequest(request, response, true),
);
server.on("checkExpectation", (request, response) => {
  if (!isAuthorized(request.headers.authorization)) {
    sendUnauthorized(response);
    return;
  }
  response.writeHead(417, { "Content-Length": "0", Connection: "close" });
  response.end();
});
server.on("upgrade", proxyUpgrade);
server.on("connect", rejectConnect);
server.on("clientError", (_error, socket) => {
  socket.end(
    "HTTP/1.1 400 Bad Request\r\nConnection: close\r\nContent-Length: 0\r\n\r\n",
  );
});
server.on("error", () => process.exit(1));

server.listen(listenPort, loopback);
