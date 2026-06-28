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
export type MetricStatus = "normal" | "mild" | "warn";

export interface PostureMetric {
  key: string;
  label: string;
  value: number;
  unit: string;
  status: MetricStatus;
  detail: string;
}

export interface PostureResult {
  landmarks: NormalizedLandmark[];
  metrics: PostureMetric[];
  /** Vurgulanacak ölçüm çizgileri (nokta indeks çiftleri). */
  highlights: [number, number][];
  summary: string;
}

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

  const metrics: PostureMetric[] = [
    {
      key: "shoulder_tilt",
      label: "Omuz Dengesi",
      value: round(shoulderTilt),
      unit: "°",
      status: classify(shoulderTilt, 2, 4),
      detail: shoulderSide,
    },
    {
      key: "hip_tilt",
      label: "Kalça (Pelvis) Dengesi",
      value: round(hipTilt),
      unit: "°",
      status: classify(hipTilt, 2, 4),
      detail: hipSide,
    },
    {
      key: "head_tilt",
      label: "Baş Eğimi",
      value: round(headTilt),
      unit: "°",
      status: classify(headTilt, 2, 4),
      detail: headSide,
    },
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
    {
      key: "forward_head",
      label: "İleri Baş Duruşu",
      value: round(forwardHead),
      unit: "°",
      status: classify(forwardHead, 5, 12),
      detail:
        forwardHead <= 5
          ? "Normal aralıkta"
          : "Baş omuz hizasının önünde",
    },
    {
      key: "trunk_lean",
      label: "Gövde Eğimi",
      value: round(trunkLean),
      unit: "°",
      status: classify(trunkLean, 5, 10),
      detail: trunkLean <= 5 ? "Dik duruş" : "Gövde öne/arkaya eğik",
    },
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
  const issues = metrics.filter((m) => m.status !== "normal");
  if (issues.length === 0) {
    return "Belirgin bir postür sapması saptanmadı.";
  }
  return issues
    .map((m) => `${m.label}: ${m.value}${m.unit} (${m.detail})`)
    .join("; ");
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
};
