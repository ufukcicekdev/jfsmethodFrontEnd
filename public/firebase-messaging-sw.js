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

  messaging.onBackgroundMessage((payload) => {
    const notification = payload.notification || {};
    const data = payload.data || {};
    const title = notification.title || "JFS Method";
    const options = {
      body: notification.body || "",
      icon: notification.icon || "/icon-192.png",
      badge: "/icon-192.png",
      data: { link: data.link || "/" },
    };
    self.registration.showNotification(title, options);
  });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || "/hesabim";
  const targetUrl = link.startsWith("http") ? link : self.location.origin + link;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Zaten açık pencere varsa navigate et ve öne getir
        for (const client of clientList) {
          if (client.url.startsWith(self.location.origin) && "focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // Açık pencere yoksa yeni aç
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
