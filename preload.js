const { contextBridge, shell, net } = require('electron');
const { URL } = require('url');

function normalizeBoxLink(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('box.com') && !parsed.searchParams.has('dl')) {
      parsed.searchParams.set('dl', '1');
    }
    return parsed.toString();
  } catch (error) {
    return url;
  }
}

function isBoxSharedLink(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes('box.com');
  } catch (error) {
    return false;
  }
}

function requestBuffer(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const request = net.request(url);
    Object.entries(headers).forEach(([key, value]) => request.setHeader(key, value));

    request.on('response', (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        const redirectUrl = new URL(response.headers.location, url).toString();
        return requestBuffer(redirectUrl, headers).then(resolve).catch(reject);
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
      });
      response.on('error', reject);
    });

    request.on('error', reject);
    request.end();
  });
}

function requestJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const request = net.request(url);
    Object.entries(headers).forEach(([key, value]) => request.setHeader(key, value));
    request.setHeader('Accept', 'application/json');

    request.on('response', (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      response.on('end', () => {
        try {
          const text = Buffer.concat(chunks).toString('utf8');
          const data = JSON.parse(text);
          resolve(data);
        } catch (error) {
          reject(error);
        }
      });
      response.on('error', reject);
    });

    request.on('error', reject);
    request.end();
  });
}

async function downloadBoxFile(sharedLink) {
  const normalizedLink = normalizeBoxLink(sharedLink);
  
  console.log('[Box] 尝试下载:', normalizedLink);
  const buffer = await requestBuffer(normalizedLink);
  console.log('[Box] 下载成功，文件大小:', buffer.byteLength);
  return buffer;
}

function downloadFile(url) {
  const normalizedUrl = normalizeBoxLink(url);
  if (isBoxSharedLink(normalizedUrl)) {
    return downloadBoxFile(normalizedUrl);
  }

  return requestBuffer(normalizedUrl);
}

contextBridge.exposeInMainWorld('electronAPI', {
  openExternal: (url) => shell.openExternal(url),
  downloadFile: (url) => downloadFile(url)
});
