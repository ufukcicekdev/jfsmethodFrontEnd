/* JFS Method — Firebase Cloud Messaging service worker.
 * Arka planda (uygulama kapalı/sekme pasifken) gelen push bildirimlerini
 * gösterir. Firebase yapılandırması, kayıt sırasında query string olarak
 * geçirilir (bkz. src/lib/firebase/messaging.ts).
 */
/* eslint-disable */
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js"
);

const params = new URLSearchParams(self.location.search);
const firebaseConfig = {
  apiKey: params.get("apiKey"),
  authDomain: params.get("authDomain"),
  projectId: params.get("projectId"),
  storageBucket: params.get("storageBucket"),
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId"),
};

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Data-only mesaj: bildirimi burada gösteriyoruz (title/body/link data'da).
  messaging.onBackgroundMessage((payload) => {
    const data = payload.data || {};
    const notification = payload.notification || {};
    const title = data.title || notification.title || "JFS Method";
    const options = {
      body: data.body || notification.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { link: data.link || "/" },
    };
    self.registration.showNotification(title, options);
  });
}

/**
 * Bildirim tıklandığında hedef linki bulur. FCM bildirimi kendisi gösterirse
 * orijinal payload'ı notification.data.FCM_MSG altında iç içe saklar; bu yüzden
 * linki birkaç olası konumdan ararız.
 */
function resolveLink(notification) {
  const nd = notification.data || {};
  const msg = nd.FCM_MSG || {};
  return (
    nd.link ||
    (msg.data && msg.data.link) ||
    (msg.notification && msg.notification.click_action) ||
    (msg.fcmOptions && msg.fcmOptions.link) ||
    (msg.webpush && msg.webpush.fcmOptions && msg.webpush.fcmOptions.link) ||
    "/hesabim"
  );
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = resolveLink(event.notification);
  const targetUrl = link.startsWith("http")
    ? link
    : self.location.origin + (link.startsWith("/") ? link : "/" + link);

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          let sameOrigin = false;
          try {
            sameOrigin = new URL(client.url).origin === self.location.origin;
          } catch (e) {}
          if (sameOrigin && "focus" in client) {
            // Önce odakla, sonra hedefe yönlendir
            return client.focus().then(() => {
              if (client.navigate) return client.navigate(targetUrl).catch(() => {});
            });
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
