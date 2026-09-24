/* 短答すきまトレーナー — オフライン用サービスワーカー
   電波の入らない電車内でも開けるように、アプリ本体を端末に取り置きます。
   教材（cards.json）はここでは扱いません。端末の中だけに保存されています。 */
var CACHE = 'tantou-app-v16';
var ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  './icon-kanri-180.png',
  './icon-kanri-192.png',
  './icon-kanri-512.png',
  './icon-kansa-180.png',
  './icon-kansa-192.png',
  './icon-kansa-512.png',
  './icon-kigyo-180.png',
  './icon-kigyo-192.png',
  './icon-kigyo-512.png',
  './icon-zaimu-180.png',
  './icon-zaimu-192.png',
  './icon-zaimu-512.png',
  './manifest-kanri.webmanifest',
  './manifest-kansa.webmanifest',
  './manifest-kigyo.webmanifest',
  './manifest-zaimu.webmanifest'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(ASSETS.map(function (u) {
        return c.add(u).catch(function () { /* 無いファイルは無視 */ });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  var isPage = req.mode === 'navigate' || /\.html?$/.test(url.pathname) || url.pathname.endsWith('/');
  if (isPage) {
    /* 本体は通信優先。更新があればすぐ反映し、圏外なら取り置きを返す */
    e.respondWith(
      fetch(req).then(function (r) {
        var copy = r.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return r;
      }).catch(function () {
        return caches.match(req).then(function (r) { return r || caches.match('./index.html'); });
      })
    );
    return;
  }
  /* アイコン等は取り置き優先 */
  e.respondWith(
    caches.match(req).then(function (r) {
      return r || fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      });
    })
  );
});
