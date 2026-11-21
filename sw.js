/* 고센이엔지 통합근무시스템 — 휴대폰 알림(웹 푸시)
   서버는 내용 없이 '알림 있음' 신호만 보냄 → 여기서 서버에 내용을 물어보고 알림을 띄움 */
var CFG_CACHE = 'goshen-push';
function getCfg() {
  return caches.open(CFG_CACHE).then(function (c) { return c.match('cfg'); })
    .then(function (r) { return r ? r.json() : null; }).catch(function () { return null; });
}
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('push', function (e) {
  e.waitUntil(getCfg().then(function (cfg) {
    if (!cfg || !cfg.api || !cfg.k) return [];
    return fetch(cfg.api, { method: 'POST', redirect: 'follow', cache: 'no-store', credentials: 'omit',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ op: 'push_pull', p: { k: cfg.k } }) })
      .then(function (r) { return r.text(); }).then(function (t) { var o = JSON.parse(t); return (o && o.items) || []; })
      .catch(function () { return []; });
  }).then(function (items) {
    if (!items.length) return self.registration.showNotification('고센이엔지 통합근무시스템', { body: '새 알림이 있습니다. 눌러서 확인하세요.', icon: 'icon-192.png', badge: 'icon-192.png', tag: 'goshen' });
    if (items.length > 3) {
      return self.registration.showNotification('새 알림 ' + items.length + '건', { body: items.map(function (n) { return '· ' + n.t; }).join('\n'), icon: 'icon-192.png', badge: 'icon-192.png', tag: 'goshen-many' });
    }
    return Promise.all(items.map(function (n) {
      return self.registration.showNotification(n.t || '고센이엔지 통합근무시스템', { body: n.b || '', icon: 'icon-192.png', badge: 'icon-192.png', tag: n.tag || undefined, renotify: !!n.tag, data: { u: n.u || '' } });
    }));
  }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = self.registration.scope;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (L) {
    for (var i = 0; i < L.length; i++) { if (L[i].url.indexOf(url) === 0 && 'focus' in L[i]) return L[i].focus(); }
    return self.clients.openWindow ? self.clients.openWindow(url) : null;
  }));
});
