import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
  type Messaging,
  type MessagePayload,
} from "firebase/messaging";
import { firebaseConfig, vapidKey, isFirebaseConfigured } from "./config";

let appInstance: FirebaseApp | null = null;
let messagingInstance: Messaging | null = null;

function getApp(): FirebaseApp {
  if (appInstance) return appInstance;
  appInstance = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  return appInstance;
}

/**
 * Tarayıcı push bildirimlerini destekliyor mu ve Firebase yapılandırılmış mı?
 */
export async function pushSupported(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!isFirebaseConfigured()) return false;
  if (!("serviceWorker" in navigator) || !("Notification" in window)) {
    return false;
  }
  try {
    return await isSupported();
  } catch {
    return false;
  }
}

async function getMessagingInstance(): Promise<Messaging | null> {
  if (messagingInstance) return messagingInstance;
  if (!(await pushSupported())) return null;
  messagingInstance = getMessaging(getApp());
  return messagingInstance;
}

/**
 * Firebase messaging service worker'ını config'i query string olarak
 * geçirerek kaydeder (SW dosyası build-time env değişkenlerini göremez).
 */
async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;

  const params = new URLSearchParams({
    apiKey: firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId,
  });

  // Dar kapsam: ana SW'yi (kök kapsam) ezmemesi için. Push olayları kapsamdan
  // bağımsız olarak bu kayda teslim edilir.
  return navigator.serviceWorker.register(
    `/firebase-messaging-sw.js?${params.toString()}`,
    { scope: "/firebase-cloud-messaging-push-scope" }
  );
}

/**
 * İzin ister ve geçerli bir FCM token'ı döndürür. İzin reddedilirse veya
 * desteklenmiyorsa null döner.
 */
export async function requestPushToken(): Promise<string | null> {
  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  if (Notification.permission === "denied") return null;

  if (Notification.permission === "default") {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;
  }

  const registration = await registerServiceWorker();
  if (!registration) return null;

  try {
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });
    return token || null;
  } catch (error) {
    console.warn("FCM token alınamadı:", error);
    return null;
  }
}

/**
 * Uygulama ön plandayken gelen mesajlar için dinleyici kaydeder.
 * Geri dönüş fonksiyonu aboneliği iptal eder.
 */
export async function listenForegroundMessages(
  handler: (payload: MessagePayload) => void
): Promise<() => void> {
  const messaging = await getMessagingInstance();
  if (!messaging) return () => {};
  return onMessage(messaging, handler);
}

export { isFirebaseConfigured };
