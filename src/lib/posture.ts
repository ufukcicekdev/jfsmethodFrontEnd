/**
 * Tarayıcıda çalışan foto tabanlı postür analizi.
 * MediaPipe Pose (BlazePose) ile vücut anahtar noktalarını tespit eder,
 * bu noktalardan postür açılarını hesaplar. Tüm işlem cihazda yapılır;
 * fotoğraf sunucuya gönderilmez.
 */
import {
  FilesetResolver,
  PoseLandmarker,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";

const MP_VERSION = "0.10.35";

// BlazePose 33 nokta indeksleri
export const LM = {
  nose: 0,
  leftEar: 7,
  rightEar: 8,
  leftShoulder: 11,
  rightShoulder: 12,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
} as const;

export type PostureView = "front" | "side" | "back";
export type MetricStatus = "normal" | "mild" | "warn" | "unknown";

export interface PostureMetric {
  key: string;
  label: string;
  /** Ölçülemeyen (nokta görünmüyor) metriklerde null. */
  value: number | null;
  unit: string;
  status: MetricStatus;
  detail: string;
  /** false ise değer şüpheli (absürt açı / düşük görünürlük). */
  reliable?: boolean;
}

export interface PostureResult {
  landmarks: NormalizedLandmark[];
  metrics: PostureMetric[];
  /** Vurgulanacak ölçüm çizgileri (nokta indeks çiftleri). */
  highlights: [number, number][];
  summary: string;
  /** Foto/görünüm uyuşmazlığı vb. kullanıcıya gösterilecek uyarılar. */
  warnings: string[];
}

/** Metrik hesabında kullanılan noktalar için asgari güvenilirlik eşiği. */
const VISIBILITY_MIN = 0.5;

let landmarkerPromise: Promise<PoseLandmarker> | null = null;

async function getLandmarker(): Promise<PoseLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(
        `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/wasm`
      );
      return PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task",
          delegate: "GPU",
        },
        runningMode: "IMAGE",
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    })();
  }
  return landmarkerPromise;
}

/** Standart iskelet bağlantıları (çizim için). */
export function poseConnections(): { start: number; end: number }[] {
  return PoseLandmarker.POSE_CONNECTIONS as { start: number; end: number }[];
}

function degBetween(
  a: NormalizedLandmark,
  b: NormalizedLandmark
): number {
  // İki noktayı birleştiren çizginin yataya göre eğimi (mutlak derece).
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.abs((Math.atan2(dy, dx) * 180) / Math.PI);
}

function tiltFromHorizontal(
  left: NormalizedLandmark,
  right: NormalizedLandmark
): number {
  // 0° = tam yatay. Küçük sapma = dengeli.
  const raw = degBetween(left, right);
  return raw > 90 ? 180 - raw : raw;
}

function angleFromVertical(
  bottom: NormalizedLandmark,
  top: NormalizedLandmark
): number {
  // Dikey eksene göre sapma açısı (0° = tam dik).
  const dx = Math.abs(top.x - bottom.x);
  const dy = Math.abs(top.y - bottom.y);
  return (Math.atan2(dx, dy) * 180) / Math.PI;
}

function classify(
  value: number,
  normalMax: number,
  mildMax: number
): MetricStatus {
  if (value <= normalMax) return "normal";
  if (value <= mildMax) return "mild";
  return "warn";
}

function avgVisibility(...lms: NormalizedLandmark[]): number {
  const vals = lms.map((l) => l.visibility ?? 0);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/**
 * Görünürlük ve absürt-değer korumalarıyla bir metrik üretir.
 * - Noktalar yeterince görünmüyorsa: "ölçülemedi" (value null, status unknown).
 * - Değer `absurdMax` üstündeyse: değer gösterilir ama güvenilmez işaretlenir.
 */
function buildMetric(params: {
  key: string;
  label: string;
  value: number;
  unit: string;
  normalMax: number;
  mildMax: number;
  detail: string;
  visibility: number;
  absurdMax: number;
}): PostureMetric {
  const { key, label, value, unit, normalMax, mildMax, detail } = params;
  if (params.visibility < VISIBILITY_MIN) {
    return {
      key,
      label,
      value: null,
      unit,
      status: "unknown",
      detail: "Ölçülemedi — ilgili noktalar net görünmüyor",
      reliable: false,
    };
  }
  if (value > params.absurdMax) {
    return {
      key,
      label,
      value: round(value),
      unit,
      status: "unknown",
      detail: "Güvenilmez değer — fotoğrafı/görünümü kontrol edin",
      reliable: false,
    };
  }
  return {
    key,
    label,
    value: round(value),
    unit,
    status: classify(value, normalMax, mildMax),
    detail,
    reliable: true,
  };
}

function frontMetrics(lm: NormalizedLandmark[]): {
  metrics: PostureMetric[];
  highlights: [number, number][];
} {
  const ls = lm[LM.leftShoulder];
  const rs = lm[LM.rightShoulder];
  const lh = lm[LM.leftHip];
  const rh = lm[LM.rightHip];
  const le = lm[LM.leftEar];
  const re = lm[LM.rightEar];

  const shoulderTilt = tiltFromHorizontal(ls, rs);
  const hipTilt = tiltFromHorizontal(lh, rh);
  const headTilt = tiltFromHorizontal(le, re);

  // y küçük = daha yukarıda. (Ekran koordinatı: yukarı = küçük y)
  const shoulderSide =
    Math.abs(ls.y - rs.y) < 0.005
      ? "Dengeli"
      : ls.y < rs.y
        ? "Sol omuz daha yüksek"
        : "Sağ omuz daha yüksek";
  const hipSide =
    Math.abs(lh.y - rh.y) < 0.005
      ? "Dengeli"
      : lh.y < rh.y
        ? "Sol kalça daha yüksek"
        : "Sağ kalça daha yüksek";
  const headSide =
    Math.abs(le.y - re.y) < 0.005
      ? "Dengeli"
      : le.y < re.y
        ? "Baş sağa eğik"
        : "Baş sola eğik";

  // Simetri açıları 2D önden fotoda ~25°'yi aşmamalı; aşıyorsa foto/görünüm sorunu.
  const metrics: PostureMetric[] = [
    buildMetric({
      key: "shoulder_tilt",
      label: "Omuz Dengesi",
      value: shoulderTilt,
      unit: "°",
      normalMax: 2,
      mildMax: 4,
      detail: shoulderSide,
      visibility: avgVisibility(ls, rs),
      absurdMax: 25,
    }),
    buildMetric({
      key: "hip_tilt",
      label: "Kalça (Pelvis) Dengesi",
      value: hipTilt,
      unit: "°",
      normalMax: 2,
      mildMax: 4,
      detail: hipSide,
      visibility: avgVisibility(lh, rh),
      absurdMax: 25,
    }),
    buildMetric({
      key: "head_tilt",
      label: "Baş Eğimi",
      value: headTilt,
      unit: "°",
      normalMax: 2,
      mildMax: 4,
      detail: headSide,
      visibility: avgVisibility(le, re),
      absurdMax: 25,
    }),
  ];

  const highlights: [number, number][] = [
    [LM.leftShoulder, LM.rightShoulder],
    [LM.leftHip, LM.rightHip],
    [LM.leftEar, LM.rightEar],
  ];

  return { metrics, highlights };
}

function sideMetrics(lm: NormalizedLandmark[]): {
  metrics: PostureMetric[];
  highlights: [number, number][];
} {
  // Daha görünür olan tarafı seç.
  const leftVis = avgVisibility(
    lm[LM.leftEar],
    lm[LM.leftShoulder],
    lm[LM.leftHip]
  );
  const rightVis = avgVisibility(
    lm[LM.rightEar],
    lm[LM.rightShoulder],
    lm[LM.rightHip]
  );
  const useLeft = leftVis >= rightVis;

  const ear = lm[useLeft ? LM.leftEar : LM.rightEar];
  const shoulder = lm[useLeft ? LM.leftShoulder : LM.rightShoulder];
  const hip = lm[useLeft ? LM.leftHip : LM.rightHip];
  const knee = lm[useLeft ? LM.leftKnee : LM.rightKnee];

  const earIdx = useLeft ? LM.leftEar : LM.rightEar;
  const shoulderIdx = useLeft ? LM.leftShoulder : LM.rightShoulder;
  const hipIdx = useLeft ? LM.leftHip : LM.rightHip;
  const kneeIdx = useLeft ? LM.leftKnee : LM.rightKnee;

  // İleri baş: boyun segmentinin (omuz->kulak) dikeyden sapması.
  const forwardHead = angleFromVertical(shoulder, ear);
  // Gövde eğimi: kalça->omuz segmentinin dikeyden sapması.
  const trunkLean = angleFromVertical(hip, shoulder);

  const metrics: PostureMetric[] = [
    buildMetric({
      key: "forward_head",
      label: "İleri Baş Duruşu",
      value: forwardHead,
      unit: "°",
      normalMax: 5,
      mildMax: 12,
      detail: forwardHead <= 5 ? "Normal aralıkta" : "Baş omuz hizasının önünde",
      visibility: avgVisibility(ear, shoulder),
      absurdMax: 45,
    }),
    buildMetric({
      key: "trunk_lean",
      label: "Gövde Eğimi",
      value: trunkLean,
      unit: "°",
      normalMax: 5,
      mildMax: 10,
      detail: trunkLean <= 5 ? "Dik duruş" : "Gövde öne/arkaya eğik",
      visibility: avgVisibility(hip, shoulder),
      absurdMax: 45,
    }),
  ];

  const highlights: [number, number][] = [
    [earIdx, shoulderIdx],
    [shoulderIdx, hipIdx],
    [hipIdx, kneeIdx],
  ];

  void knee;
  return { metrics, highlights };
}

function round(v: number): number {
  return Math.round(v * 10) / 10;
}

function buildSummary(metrics: PostureMetric[]): string {
  const issues = metrics.filter(
    (m) => (m.status === "mild" || m.status === "warn") && m.value !== null
  );
  if (issues.length === 0) {
    return "Belirgin bir postür sapması saptanmadı.";
  }
  return issues
    .map((m) => `${m.label}: ${m.value}${m.unit} (${m.detail})`)
    .join("; ");
}

/** Foto/görünüm uyuşmazlığını omuzların yatay ayrımından tahmin eder. */
function viewWarnings(lm: NormalizedLandmark[], view: PostureView): string[] {
  const warnings: string[] = [];
  const ls = lm[LM.leftShoulder];
  const rs = lm[LM.rightShoulder];
  if (!ls || !rs) return warnings;
  const shoulderSep = Math.abs(ls.x - rs.x);
  if (view !== "side" && shoulderSep < 0.08) {
    warnings.push(
      "Görünüm 'Önden/Arkadan' seçili ama fotoğraf yandan çekilmiş görünüyor — ölçümler yanıltıcı olabilir. Doğru görünümü seçin."
    );
  }
  if (view === "side" && shoulderSep > 0.18) {
    warnings.push(
      "Görünüm 'Yandan' seçili ama fotoğraf önden/arkadan çekilmiş görünüyor — ölçümler yanıltıcı olabilir. Doğru görünümü seçin."
    );
  }
  return warnings;
}

/**
 * Bir görsel üzerinde postür analizi çalıştırır.
 * @throws Eğer poz tespit edilemezse.
 */
export async function analyzePosture(
  image: HTMLImageElement,
  view: PostureView
): Promise<PostureResult> {
  const landmarker = await getLandmarker();
  const result = landmarker.detect(image);

  if (!result.landmarks || result.landmarks.length === 0) {
    throw new Error(
      "Fotoğrafta vücut tespit edilemedi. Tüm vücudun göründüğü, net bir fotoğraf kullanın."
    );
  }

  const lm = result.landmarks[0];

  const { metrics, highlights } =
    view === "side" ? sideMetrics(lm) : frontMetrics(lm);

  return {
    landmarks: lm,
    metrics,
    highlights,
    summary: buildSummary(metrics),
    warnings: viewWarnings(lm, view),
  };
}

export const STATUS_STYLES: Record<
  MetricStatus,
  { label: string; text: string; dot: string }
> = {
  normal: {
    label: "Normal",
    text: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  mild: {
    label: "Hafif",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  warn: {
    label: "Belirgin",
    text: "text-rose-600 dark:text-rose-400",
    dot: "bg-rose-500",
  },
  unknown: {
    label: "Belirsiz",
    text: "text-slate-500 dark:text-slate-400",
    dot: "bg-slate-400",
  },
};
