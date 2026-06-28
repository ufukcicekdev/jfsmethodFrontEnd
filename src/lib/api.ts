const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

interface ApiOptions extends RequestInit {
  token?: string;
}

interface ApiErrorBody {
  detail?: string;
  [key: string]: unknown;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

function unwrapPaginatedList<T>(data: T[] | PaginatedResponse<T>): T[] {
  if (Array.isArray(data)) return data;
  if (
    data &&
    typeof data === "object" &&
    "results" in data &&
    Array.isArray(data.results)
  ) {
    return data.results;
  }
  return [];
}

async function apiFetch<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { token, headers: customHeaders, ...rest } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, { headers, ...rest });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as ApiErrorBody;
    const firstFieldError = Object.values(error).find(
      (v) => Array.isArray(v) && typeof v[0] === "string"
    ) as string[] | undefined;
    throw new Error(
      firstFieldError?.[0] ?? error.detail ?? `API error: ${response.status}`
    );
  }

  return response.json();
}

async function apiUpload<T>(
  endpoint: string,
  formData: FormData,
  token: string,
  method: "POST" | "PATCH" = "POST"
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as ApiErrorBody;
    const firstFieldError = Object.values(error).find(
      (v) => Array.isArray(v) && typeof v[0] === "string"
    ) as string[] | undefined;
    throw new Error(
      firstFieldError?.[0] ?? error.detail ?? `API error: ${response.status}`
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export interface PatientProfile {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  height: number | null;
  weight: number | null;
  date_of_birth?: string | null;
  phone?: string;
  updated_at?: string;
}

export interface WeightEntry {
  id: number;
  weight: number;
  recorded_at: string;
}

export interface BodyMeasurement {
  id: number;
  date: string;
  label: string;
  weight: number | null;
  gogus: number | null;
  omuz: number | null;
  bel: number | null;
  gobek: number | null;
  alt_karin: number | null;
  kalca: number | null;
  basen: number | null;
  sag_bacak: number | null;
  sol_bacak: number | null;
  sag_kol: number | null;
  sol_kol: number | null;
  yag_orani: number | null;
  notes: string;
  created_at: string;
}

export interface Appointment {
  id: number;
  doctor: number;
  doctor_name: string;
  patient?: number;
  patient_id?: number;
  patient_name?: string;
  appointment_datetime: string;
  duration_minutes?: number;
  status:
    | "pending"
    | "approved"
    | "postponed"
    | "completed"
    | "cancelled"
    | "no_show";
  note: string;
  cancellation_reason?: string;
}

export interface PackagePlan {
  id: number;
  name: string;
  total_sessions: number;
  price: string;
  description: string;
  image_url?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface SessionPackage {
  id: number;
  plan: number | null;
  plan_name: string | null;
  name: string;
  total_sessions: number;
  price: string | null;
  is_paid: boolean;
  paid_at: string | null;
  purchased_at: string;
  note: string;
  is_active: boolean;
  used_sessions: number;
  no_show_count: number;
  scheduled_count: number;
  remaining_sessions: number;
  created_by_name: string | null;
  created_at: string;
}

export interface AttendanceRecord {
  id: number;
  appointment_datetime: string;
  status: Appointment["status"];
  doctor_name: string;
}

export interface PatientAttendance {
  completed: number;
  no_show: number;
  cancelled: number;
  upcoming: number;
  history: AttendanceRecord[];
}

export interface AvailableSlot {
  datetime: string;
  doctor_id: number;
  doctor_name: string;
  remaining?: number;
}

export interface Doctor {
  id: number;
  username: string;
  full_name: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  is_staff: boolean;
  is_superuser: boolean;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: AuthUser;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  kvkk_accepted: boolean;
  acik_riza_accepted: boolean;
}

export interface BookAppointmentPayload {
  doctor: number;
  appointment_datetime: string;
  kvkk_accepted: boolean;
  acik_riza_accepted: boolean;
}

export interface PostponePayload {
  appointment_datetime: string;
  note: string;
}

export interface AdminDashboard {
  patient_count: number;
  appointment_count: number;
  pending_appointments: number;
  today_appointments: number;
  active_packages: number;
}

export type PhotoCategory =
  | "posture_front"
  | "posture_side"
  | "posture_back"
  | "exercise"
  | "general"
  | "other";

export interface PatientProgressPhoto {
  id: number;
  image_url: string;
  category: PhotoCategory;
  category_label: string;
  title: string;
  note: string;
  taken_at: string | null;
  uploaded_by_name: string | null;
  created_at: string;
}

export interface PostureMetricRecord {
  key: string;
  label: string;
  value: number;
  unit: string;
  status: "normal" | "mild" | "warn";
  detail: string;
}

export interface PostureAssessment {
  id: number;
  view: "front" | "side" | "back";
  view_label: string;
  image_url: string | null;
  metrics: PostureMetricRecord[];
  summary: string;
  created_by_name: string | null;
  created_at: string;
}

export interface DietItem {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: string;
  is_active: boolean;
  created_at: string;
}

export interface DietPlanItem {
  id: number;
  diet_item: DietItem;
  diet_item_id?: number;
  quantity: number;
  note: string;
}

export interface DietPlan {
  id: number;
  patient: number;
  title: string;
  description: string;
  date: string;
  meal_type: string;
  meal_type_label: string;
  plan_items: DietPlanItem[];
  total_calories: number;
  assigned_by_name: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Faq {
  id: number;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface AdminPatient {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  height: number | null;
  weight: number | null;
  bmi: number | null;
  last_attended: string | null;
  remaining_sessions: number;
  no_show_count: number;
  came_count: number;
  today_attendance: { id: number; status: "came" | "no_show" } | null;
  phone?: string;
  date_of_birth?: string | null;
  admin_notes?: string;
  weight_history?: WeightEntry[];
  weight_stats?: WeightStats;
  progress_photos?: PatientProgressPhoto[];
  packages?: SessionPackage[];
  attendance?: PatientAttendance;
}

export interface WeightStats {
  current_weight: number | null;
  weight_change_week: number | null;
  weight_change_month: number | null;
  history: { weight: number; recorded_at: string }[];
}

export interface AdminPatientUpdatePayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  height?: number | null;
  weight?: number | null;
  date_of_birth?: string | null;
  phone?: string;
  admin_notes?: string;
}

export interface WorkingDaySchedule {
  day_of_week: number;
  day_label: string;
  is_working: boolean;
  start_time: string;
  end_time: string;
}

export interface ClinicHoliday {
  id: number;
  date: string;
  name: string;
  created_at: string;
}

export interface ClinicSchedule {
  slot_duration_minutes: number;
  slot_capacity: number;
  working_days: WorkingDaySchedule[];
  holidays: ClinicHoliday[];
}

export interface ClinicScheduleUpdatePayload {
  slot_duration_minutes: number;
  slot_capacity?: number;
  working_days: {
    day_of_week: number;
    is_working: boolean;
    start_time: string;
    end_time: string;
  }[];
}

export interface SiteSettings {
  clinic_name: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  working_hours: string;
  map_embed_url: string;
  instagram_url: string;
  facebook_url: string;
  x_url: string;
  youtube_url: string;
  linkedin_url: string;
  google_analytics_id: string;
  google_search_console_verification: string;
  registration_enabled: boolean;
  section_stats: boolean;
  section_marquee: boolean;
  section_about: boolean;
  section_services: boolean;
  section_digital_twin: boolean;
  section_treatments: boolean;
  section_how_it_works: boolean;
  section_why_us: boolean;
  section_testimonials: boolean;
  section_packages: boolean;
  section_cta: boolean;
  section_faq: boolean;
  expert_visible: boolean;
  expert_name: string;
  expert_title: string;
  expert_bio: string;
  expert_years: number;
  expert_patient_count: string;
  expert_rating: string;
  expert_badges: string;
}

export interface LandingService {
  id: number; icon: string; tag: string; title: string; description: string; sort_order: number; is_active: boolean;
}
export interface LandingTreatment {
  id: number; title: string; description: string; sort_order: number; is_active: boolean;
}
export interface LandingWhyUsItem {
  id: number; icon: string; title: string; description: string; sort_order: number; is_active: boolean;
}

export interface Testimonial {
  id: number;
  name: string;
  treatment: string;
  text: string;
  rating: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export type SiteSettingsUpdatePayload = Partial<SiteSettings>;

export interface ContactSubmitPayload {
  name: string;
  email?: string;
  phone?: string;
  subject?: string;
  message: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface DayCancellationPreview {
  date: string;
  appointment_count: number;
  patient_count: number;
  patients: {
    patient_id: number;
    patient_name: string;
    appointment_count: number;
  }[];
}

export interface DayCancellationResult {
  detail: string;
  cancelled_count: number;
  emails_scheduled: number;
  patient_count: number;
  day_cancellation_id: number;
}

export interface AdminNotification {
  id: number;
  notification_type: string;
  type_label: string;
  title: string;
  message: string;
  link: string;
  actor_name: string | null;
  is_read: boolean;
  created_at: string;
}

export interface PatientNotification {
  id: number;
  notification_type: string;
  type_label: string;
  title: string;
  message: string;
  link: string;
  is_read: boolean;
  created_at: string;
}

export type BodyRegion =
  | "neck"
  | "shoulder_left"
  | "shoulder_right"
  | "upper_back"
  | "lower_back"
  | "hip_left"
  | "hip_right"
  | "knee_left"
  | "knee_right";

export interface RegionPainLog {
  id: number;
  region: BodyRegion;
  region_label: string;
  pain_level: number;
  note: string;
  recorded_at: string;
}

export interface Exercise {
  id: number;
  title: string;
  description: string;
  image_url: string | null;
  instructions: string;
  target_region: BodyRegion | "";
  target_region_label: string;
  duration_minutes: number;
  sets: number;
  reps: number;
  difficulty: "easy" | "medium" | "hard";
  difficulty_label: string;
  is_active: boolean;
}

export interface ExerciseAssignment {
  id: number;
  exercise: Exercise;
  therapist_note: string;
  frequency: string;
  frequency_label: string;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  assigned_by_name: string | null;
  completions_this_week: number;
  last_completed_at: string | null;
  completed_today: boolean;
  created_at: string;
}

export interface WellnessStats {
  active_exercises: number;
  completions_this_week: number;
  average_pain: number | null;
  pain_change_week: number | null;
  weight_change_recent: number | null;
  progress_photo_count: number;
}

export interface WellnessDashboard {
  pain_map: RegionPainLog[];
  exercises: ExerciseAssignment[];
  weight_history: { weight: number; recorded_at: string }[];
  progress_photos: PatientProgressPhoto[];
  stats: WellnessStats;
}

export const api = {
  faqs: {
    list: () => apiFetch<Faq[]>("/faqs/"),
  },
  auth: {
    register: (data: RegisterPayload) =>
      apiFetch<AuthResponse>("/auth/register/", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    login: (data: { username: string; password: string }) =>
      apiFetch<AuthResponse>("/auth/login/", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    me: (token: string) => apiFetch<AuthUser>("/auth/me/", { token }),

    refresh: (refresh: string) =>
      apiFetch<{ access: string }>("/auth/refresh/", {
        method: "POST",
        body: JSON.stringify({ refresh }),
      }),

    changePassword: (
      token: string,
      data: { current_password: string; new_password: string }
    ) =>
      apiFetch<{ detail: string }>("/auth/change-password/", {
        method: "POST",
        body: JSON.stringify(data),
        token,
      }),

    forgotPassword: (email: string) =>
      apiFetch<{ detail: string }>("/auth/forgot-password/", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),

    resetPassword: (data: {
      uid: string;
      token: string;
      new_password: string;
    }) =>
      apiFetch<{ detail: string }>("/auth/reset-password/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  packagePlans: {
    public: () => apiFetch<PackagePlan[]>("/package-plans/"),
  },

  notifications: {
    list: (token: string) =>
      apiFetch<{ unread_count: number; notifications: PatientNotification[] }>(
        "/notifications/",
        { token }
      ),

    markRead: (token: string, id: number) =>
      apiFetch<PatientNotification>(`/notifications/${id}/read/`, {
        method: "PATCH",
        token,
      }),

    markAllRead: (token: string) =>
      apiFetch<{ marked_read: number }>("/notifications/read-all/", {
        method: "POST",
        token,
      }),
  },

  profile: {
    get: (token: string) => apiFetch<PatientProfile>("/profile/", { token }),

    update: (token: string, data: Partial<PatientProfile>) =>
      apiFetch<PatientProfile>("/profile/", {
        method: "PATCH",
        body: JSON.stringify(data),
        token,
      }),
  },

  weight: {
    list: async (token: string) =>
      unwrapPaginatedList(
        await apiFetch<WeightEntry[] | PaginatedResponse<WeightEntry>>(
          "/weight-history/",
          { token }
        )
      ),

    create: (token: string, weight: number) =>
      apiFetch<WeightEntry>("/weight-history/", {
        method: "POST",
        body: JSON.stringify({ weight }),
        token,
      }),
  },

  appointments: {
    list: async (token: string) =>
      unwrapPaginatedList(
        await apiFetch<Appointment[] | PaginatedResponse<Appointment>>(
          "/appointments/",
          { token }
        )
      ),

    availableSlots: (token: string, date?: string) => {
      const params = date ? `?date=${date}` : "";
      return apiFetch<AvailableSlot[]>(
        `/appointments/available-slots${params}`,
        { token }
      );
    },

    book: (token: string, data: BookAppointmentPayload) =>
      apiFetch<Appointment>("/appointments/", {
        method: "POST",
        body: JSON.stringify(data),
        token,
      }),

    doctors: (token: string) =>
      apiFetch<Doctor[]>("/appointments/doctors/", { token }),

    postpone: (token: string, id: number, data: PostponePayload) =>
      apiFetch<Appointment>(`/appointments/${id}/postpone/`, {
        method: "POST",
        body: JSON.stringify(data),
        token,
      }),

    cancel: (token: string, id: number) =>
      apiFetch<Appointment>(`/appointments/${id}/cancel/`, {
        method: "POST",
        token,
      }),
  },

  packages: {
    me: (token: string) =>
      apiFetch<SessionPackage[]>("/packages/me/", { token }),
  },

  devices: {
    register: (token: string, fcmToken: string) =>
      apiFetch<{ detail: string }>("/devices/register/", {
        method: "POST",
        body: JSON.stringify({ token: fcmToken }),
        token,
      }),

    unregister: (token: string, fcmToken: string) =>
      apiFetch<void>("/devices/unregister/", {
        method: "POST",
        body: JSON.stringify({ token: fcmToken }),
        token,
      }),
  },

  wellness: {
    dashboard: (token: string) =>
      apiFetch<WellnessDashboard>("/wellness/dashboard/", { token }),

    updatePainMap: (
      token: string,
      entries: { region: BodyRegion; pain_level: number; note?: string }[]
    ) =>
      apiFetch<RegionPainLog[]>("/wellness/pain-map/", {
        method: "POST",
        body: JSON.stringify({ entries }),
        token,
      }),

    exercises: (token: string) =>
      apiFetch<ExerciseAssignment[]>("/wellness/exercises/", { token }),

    completeExercise: (
      token: string,
      assignmentId: number,
      data?: { pain_before?: number; pain_after?: number; note?: string }
    ) =>
      apiFetch<{ id: number; completed_at: string }>(
        `/wellness/exercises/${assignmentId}/complete/`,
        {
          method: "POST",
          body: JSON.stringify(data ?? {}),
          token,
        }
      ),

    progressPhotos: (token: string) =>
      apiFetch<PatientProgressPhoto[]>("/wellness/progress-photos/", { token }),
  },

  admin: {
    dashboard: (token: string) =>
      apiFetch<AdminDashboard>("/admin/dashboard/", { token }),

    patients: async (token: string, search?: string) => {
      const params = search ? `?search=${encodeURIComponent(search)}` : "";
      return unwrapPaginatedList(
        await apiFetch<AdminPatient[] | PaginatedResponse<AdminPatient>>(
          `/admin/patients/${params}`,
          { token }
        )
      );
    },

    patient: (token: string, id: number) =>
      apiFetch<AdminPatient>(`/admin/patients/${id}/`, { token }),

    updatePatient: (token: string, id: number, data: AdminPatientUpdatePayload) =>
      apiFetch<AdminPatient>(`/admin/patients/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data),
        token,
      }),

    addWeight: (token: string, id: number, weight: number) =>
      apiFetch<{ entry: WeightEntry; patient: AdminPatient }>(
        `/admin/patients/${id}/weight/`,
        {
          method: "POST",
          body: JSON.stringify({ weight }),
          token,
        }
      ),

    patientPackages: (token: string, patientId: number) =>
      apiFetch<SessionPackage[]>(
        `/admin/patients/${patientId}/packages/`,
        { token }
      ),

    createPackage: (
      token: string,
      patientId: number,
      data: {
        plan_id?: number;
        name?: string;
        total_sessions?: number;
        price?: string | number;
        purchased_at: string;
        note?: string;
        is_paid?: boolean;
      }
    ) =>
      apiFetch<SessionPackage>(`/admin/patients/${patientId}/packages/`, {
        method: "POST",
        body: JSON.stringify(data),
        token,
      }),

    updatePackage: (
      token: string,
      patientId: number,
      packageId: number,
      data: {
        is_active?: boolean;
        note?: string;
        total_sessions?: number;
        price?: string | number | null;
        is_paid?: boolean;
      }
    ) =>
      apiFetch<SessionPackage>(
        `/admin/patients/${patientId}/packages/${packageId}/`,
        {
          method: "PATCH",
          body: JSON.stringify(data),
          token,
        }
      ),

    deletePackage: async (
      token: string,
      patientId: number,
      packageId: number
    ) => {
      const response = await fetch(
        `${API_BASE}/admin/patients/${patientId}/packages/${packageId}/`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        const error = (await response.json().catch(() => ({}))) as ApiErrorBody;
        throw new Error(
          (error.detail as string | undefined) ?? "Paket silinemedi."
        );
      }
    },

    appointments: async (
      token: string,
      options?: { status?: string; dateFrom?: string; dateTo?: string }
    ) => {
      const search = new URLSearchParams();
      if (options?.status) search.set("status", options.status);
      if (options?.dateFrom) search.set("date_from", options.dateFrom);
      if (options?.dateTo) search.set("date_to", options.dateTo);
      const qs = search.toString();
      return unwrapPaginatedList(
        await apiFetch<Appointment[] | PaginatedResponse<Appointment>>(
          `/admin/appointments/${qs ? `?${qs}` : ""}`,
          { token }
        )
      );
    },

    createAppointment: (
      token: string,
      data: {
        patient_id: number;
        doctor: number;
        appointment_datetime: string;
        note?: string;
      }
    ) =>
      apiFetch<Appointment>("/admin/appointments/", {
        method: "POST",
        body: JSON.stringify(data),
        token,
      }),

    createPatient: (
      token: string,
      data: {
        first_name: string;
        last_name?: string;
        email?: string;
        phone?: string;
        password?: string;
      }
    ) =>
      apiFetch<{
        patient: AdminPatient;
        username: string;
        generated_password: string;
      }>("/admin/patients/", {
        method: "POST",
        body: JSON.stringify(data),
        token,
      }),

    updateAppointmentStatus: (
      token: string,
      id: number,
      data: { status: Appointment["status"]; note?: string }
    ) =>
      apiFetch<Appointment>(`/admin/appointments/${id}/status/`, {
        method: "PATCH",
        body: JSON.stringify(data),
        token,
      }),

    uploadPhoto: (
      token: string,
      patientId: number,
      data: {
        image: File;
        category: PhotoCategory;
        title?: string;
        note?: string;
        taken_at?: string;
      }
    ) => {
      const formData = new FormData();
      formData.append("image", data.image);
      formData.append("category", data.category);
      if (data.title) formData.append("title", data.title);
      if (data.note) formData.append("note", data.note);
      if (data.taken_at) formData.append("taken_at", data.taken_at);
      return apiUpload<PatientProgressPhoto>(
        `/admin/patients/${patientId}/photos/`,
        formData,
        token
      );
    },

    deletePhoto: async (token: string, patientId: number, photoId: number) => {
      const response = await fetch(
        `${API_BASE}/admin/patients/${patientId}/photos/${photoId}/`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        const error = (await response.json().catch(() => ({}))) as ApiErrorBody;
        throw new Error(
          (error.detail as string | undefined) ?? "Fotoğraf silinemedi."
        );
      }
    },

    postureAssessments: (token: string, patientId: number) =>
      apiFetch<PostureAssessment[]>(
        `/admin/patients/${patientId}/posture/`,
        { token }
      ),

    createPostureAssessment: (
      token: string,
      patientId: number,
      data: {
        image: Blob;
        view: "front" | "side" | "back";
        metrics: PostureMetricRecord[];
        summary: string;
      }
    ) => {
      const formData = new FormData();
      formData.append("image", data.image, "posture.png");
      formData.append("view", data.view);
      formData.append("metrics", JSON.stringify(data.metrics));
      formData.append("summary", data.summary);
      return apiUpload<PostureAssessment>(
        `/admin/patients/${patientId}/posture/`,
        formData,
        token
      );
    },

    deletePostureAssessment: async (
      token: string,
      patientId: number,
      assessmentId: number
    ) => {
      const response = await fetch(
        `${API_BASE}/admin/patients/${patientId}/posture/${assessmentId}/`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        const error = (await response.json().catch(() => ({}))) as ApiErrorBody;
        throw new Error(
          (error.detail as string | undefined) ?? "Analiz silinemedi."
        );
      }
    },

    getSchedule: (token: string) =>
      apiFetch<ClinicSchedule>("/admin/schedule/", { token }),

    updateSchedule: (token: string, data: ClinicScheduleUpdatePayload) =>
      apiFetch<ClinicSchedule>("/admin/schedule/", {
        method: "PUT",
        body: JSON.stringify(data),
        token,
      }),

    addHoliday: (token: string, data: { date: string; name?: string }) =>
      apiFetch<ClinicHoliday>("/admin/schedule/holidays/", {
        method: "POST",
        body: JSON.stringify(data),
        token,
      }),

    deleteHoliday: async (token: string, id: number) => {
      const response = await fetch(`${API_BASE}/admin/schedule/holidays/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const error = (await response.json().catch(() => ({}))) as ApiErrorBody;
        throw new Error(
          (error.detail as string | undefined) ?? "Tatil günü silinemedi."
        );
      }
    },

    previewCancelDay: (token: string, date: string) =>
      apiFetch<DayCancellationPreview>(
        `/admin/schedule/cancel-day/preview/?date=${encodeURIComponent(date)}`,
        { token }
      ),

    cancelDay: (
      token: string,
      data: { date: string; reason: string; add_holiday?: boolean }
    ) =>
      apiFetch<DayCancellationResult>("/admin/schedule/cancel-day/", {
        method: "POST",
        body: JSON.stringify(data),
        token,
      }),

    notifications: (token: string) =>
      apiFetch<{ unread_count: number; notifications: AdminNotification[] }>(
        "/admin/notifications/",
        { token }
      ),

    markNotificationRead: (token: string, id: number) =>
      apiFetch<AdminNotification>(`/admin/notifications/${id}/read/`, {
        method: "PATCH",
        token,
      }),

    markAllNotificationsRead: (token: string) =>
      apiFetch<{ marked_read: number }>("/admin/notifications/read-all/", {
        method: "POST",
        token,
      }),

    exerciseLibrary: (token: string) =>
      apiFetch<Exercise[]>("/admin/exercises/", { token }),

    createExercise: (
      token: string,
      data: {
        title: string;
        description?: string;
        instructions: string;
        target_region?: string;
        duration_minutes?: number;
        sets?: number;
        reps?: number;
        difficulty?: string;
        is_active?: boolean;
        image?: File | null;
      }
    ) => {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("instructions", data.instructions);
      if (data.description) formData.append("description", data.description);
      if (data.target_region)
        formData.append("target_region", data.target_region);
      if (data.duration_minutes != null)
        formData.append("duration_minutes", String(data.duration_minutes));
      if (data.sets != null) formData.append("sets", String(data.sets));
      if (data.reps != null) formData.append("reps", String(data.reps));
      if (data.difficulty) formData.append("difficulty", data.difficulty);
      if (data.is_active != null)
        formData.append("is_active", String(data.is_active));
      if (data.image) formData.append("image", data.image);
      return apiUpload<Exercise>("/admin/exercises/", formData, token);
    },

    updateExercise: (
      token: string,
      exerciseId: number,
      data: {
        title?: string;
        description?: string;
        instructions?: string;
        target_region?: string;
        duration_minutes?: number;
        sets?: number;
        reps?: number;
        difficulty?: string;
        is_active?: boolean;
        image?: File | null;
      }
    ) => {
      const formData = new FormData();
      if (data.title != null) formData.append("title", data.title);
      if (data.instructions != null)
        formData.append("instructions", data.instructions);
      if (data.description != null)
        formData.append("description", data.description);
      if (data.target_region != null)
        formData.append("target_region", data.target_region);
      if (data.duration_minutes != null)
        formData.append("duration_minutes", String(data.duration_minutes));
      if (data.sets != null) formData.append("sets", String(data.sets));
      if (data.reps != null) formData.append("reps", String(data.reps));
      if (data.difficulty != null)
        formData.append("difficulty", data.difficulty);
      if (data.is_active != null)
        formData.append("is_active", String(data.is_active));
      if (data.image) formData.append("image", data.image);
      return apiUpload<Exercise>(
        `/admin/exercises/${exerciseId}/`,
        formData,
        token,
        "PATCH"
      );
    },

    deleteExercise: async (token: string, exerciseId: number) => {
      const response = await fetch(`${API_BASE}/admin/exercises/${exerciseId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const error = (await response.json().catch(() => ({}))) as ApiErrorBody;
        throw new Error(
          (error.detail as string | undefined) ?? "Egzersiz silinemedi."
        );
      }
    },

    patientExercises: (token: string, patientId: number) =>
      apiFetch<ExerciseAssignment[]>(
        `/admin/patients/${patientId}/exercises/`,
        { token }
      ),

    assignExercise: (
      token: string,
      patientId: number,
      data: {
        exercise_id: number;
        therapist_note?: string;
        frequency?: string;
      }
    ) =>
      apiFetch<ExerciseAssignment>(
        `/admin/patients/${patientId}/exercises/`,
        {
          method: "POST",
          body: JSON.stringify(data),
          token,
        }
      ),

    deactivateExercise: (
      token: string,
      patientId: number,
      assignmentId: number
    ) =>
      apiFetch<ExerciseAssignment>(
        `/admin/patients/${patientId}/exercises/${assignmentId}/`,
        { method: "PATCH", token }
      ),

    packagePlans: (token: string) =>
      apiFetch<PackagePlan[]>("/admin/package-plans/", { token }),

    createPackagePlan: (
      token: string,
      payload: {
        name: string;
        total_sessions: number;
        price: number;
        description: string;
        image?: File | null;
        is_active?: boolean;
      }
    ) => {
      const fd = new FormData();
      fd.append("name", payload.name);
      fd.append("total_sessions", String(payload.total_sessions));
      fd.append("price", String(payload.price));
      fd.append("description", payload.description);
      if (payload.image) fd.append("image", payload.image);
      if (payload.is_active !== undefined) fd.append("is_active", String(payload.is_active));
      return apiUpload<PackagePlan>("/admin/package-plans/", fd, token);
    },

    updatePackagePlan: (
      token: string,
      planId: number,
      payload: Partial<{
        name: string;
        total_sessions: number;
        price: number;
        description: string;
        image?: File | null;
        is_active: boolean;
        sort_order: number;
      }>
    ) => {
      const fd = new FormData();
      if (payload.name !== undefined) fd.append("name", payload.name);
      if (payload.total_sessions !== undefined) fd.append("total_sessions", String(payload.total_sessions));
      if (payload.price !== undefined) fd.append("price", String(payload.price));
      if (payload.description !== undefined) fd.append("description", payload.description);
      if (payload.image !== undefined && payload.image !== null) fd.append("image", payload.image);
      if (payload.is_active !== undefined) fd.append("is_active", String(payload.is_active));
      if (payload.sort_order !== undefined) fd.append("sort_order", String(payload.sort_order));
      const url = `${API_BASE}/admin/package-plans/${planId}/`;
      return fetch(url, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      }).then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json() as Promise<PackagePlan>;
      });
    },

    deletePackagePlan: async (token: string, planId: number) => {
      const response = await fetch(`${API_BASE}/admin/package-plans/${planId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const error = (await response.json().catch(() => ({}))) as ApiErrorBody;
        throw new Error(
          (error.detail as string | undefined) ?? "Paket planı silinemedi."
        );
      }
    },

    siteSettings: (token: string) =>
      apiFetch<SiteSettings>("/admin/site-settings/", { token }),

    updateSiteSettings: (token: string, data: SiteSettingsUpdatePayload) =>
      apiFetch<SiteSettings>("/admin/site-settings/", {
        method: "PUT",
        body: JSON.stringify(data),
        token,
      }),

    contactMessages: (token: string) =>
      apiFetch<{ unread_count: number; messages: ContactMessage[] }>(
        "/admin/contact-messages/",
        { token }
      ),

    markMessageRead: (token: string, id: number, isRead = true) =>
      apiFetch<ContactMessage>(`/admin/contact-messages/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({ is_read: isRead }),
        token,
      }),

    deleteMessage: async (token: string, id: number) => {
      const response = await fetch(
        `${API_BASE}/admin/contact-messages/${id}/`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        const error = (await response.json().catch(() => ({}))) as ApiErrorBody;
        throw new Error(
          (error.detail as string | undefined) ?? "Mesaj silinemedi."
        );
      }
    },

    bodyMeasurements: (token: string, patientId: number) =>
      apiFetch<BodyMeasurement[]>(`/admin/patients/${patientId}/measurements/`, { token }),

    addBodyMeasurement: (
      token: string,
      patientId: number,
      data: Omit<BodyMeasurement, "id" | "created_at">
    ) =>
      apiFetch<BodyMeasurement>(`/admin/patients/${patientId}/measurements/`, {
        token,
        method: "POST",
        body: JSON.stringify(data),
      }),

    updateBodyMeasurement: (
      token: string,
      patientId: number,
      measurementId: number,
      data: Partial<Omit<BodyMeasurement, "id" | "created_at">>
    ) =>
      apiFetch<BodyMeasurement>(`/admin/patients/${patientId}/measurements/${measurementId}/`, {
        token,
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    deleteBodyMeasurement: (token: string, patientId: number, measurementId: number) =>
      fetch(`${API_BASE}/admin/patients/${patientId}/measurements/${measurementId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => { if (!r.ok) throw new Error("Silinemedi."); }),

    faqs: {
      list: (token: string) => apiFetch<Faq[]>("/admin/faqs/", { token }),
      create: (token: string, data: Omit<Faq, "id" | "created_at">) =>
        apiFetch<Faq>("/admin/faqs/", { token, method: "POST", body: JSON.stringify(data) }),
      update: (token: string, id: number, data: Partial<Omit<Faq, "id" | "created_at">>) =>
        apiFetch<Faq>(`/admin/faqs/${id}/`, { token, method: "PUT", body: JSON.stringify(data) }),
      delete: (token: string, id: number) =>
        fetch(`${API_BASE}/admin/faqs/${id}/`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => { if (!r.ok) throw new Error("Silinemedi."); }),
    },
    dietItems: {
      list: (token: string) => apiFetch<DietItem[]>("/admin/diet-items/", { token }),
      create: (token: string, data: Omit<DietItem, "id" | "created_at">) =>
        apiFetch<DietItem>("/admin/diet-items/", { token, method: "POST", body: JSON.stringify(data) }),
      update: (token: string, id: number, data: Partial<Omit<DietItem, "id" | "created_at">>) =>
        apiFetch<DietItem>(`/admin/diet-items/${id}/`, { token, method: "PUT", body: JSON.stringify(data) }),
      delete: (token: string, id: number) =>
        fetch(`${API_BASE}/admin/diet-items/${id}/`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => { if (!r.ok) throw new Error("Silinemedi."); }),
    },
    patientDiets: {
      list: (token: string, patientId: number) =>
        apiFetch<DietPlan[]>(`/admin/patients/${patientId}/diets/`, { token }),
      create: (token: string, patientId: number, data: object) =>
        apiFetch<DietPlan>(`/admin/patients/${patientId}/diets/`, { token, method: "POST", body: JSON.stringify(data) }),
      update: (token: string, patientId: number, planId: number, data: object) =>
        apiFetch<DietPlan>(`/admin/patients/${patientId}/diets/${planId}/`, { token, method: "PUT", body: JSON.stringify(data) }),
      delete: (token: string, patientId: number, planId: number) =>
        fetch(`${API_BASE}/admin/patients/${patientId}/diets/${planId}/`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => { if (!r.ok) throw new Error("Silinemedi."); }),
    },
    testimonials: {
      list: (token: string) => apiFetch<Testimonial[]>("/admin/testimonials/", { token }),
      create: (token: string, data: Partial<Testimonial>) =>
        apiFetch<Testimonial>("/admin/testimonials/", { token, method: "POST", body: JSON.stringify(data) }),
      update: (token: string, id: number, data: Partial<Testimonial>) =>
        apiFetch<Testimonial>(`/admin/testimonials/${id}/`, { token, method: "PUT", body: JSON.stringify(data) }),
      delete: (token: string, id: number) =>
        fetch(`${API_BASE}/admin/testimonials/${id}/`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } })
          .then((r) => { if (!r.ok) throw new Error("Silinemedi."); }),
    },
    landing: {
      services: { list: (t: string) => apiFetch<LandingService[]>("/admin/landing/services/", { token: t }), create: (t: string, d: Partial<LandingService>) => apiFetch<LandingService>("/admin/landing/services/", { token: t, method: "POST", body: JSON.stringify(d) }), update: (t: string, id: number, d: Partial<LandingService>) => apiFetch<LandingService>(`/admin/landing/services/${id}/`, { token: t, method: "PUT", body: JSON.stringify(d) }), delete: (t: string, id: number) => fetch(`${API_BASE}/admin/landing/services/${id}/`, { method: "DELETE", headers: { Authorization: `Bearer ${t}` } }).then(r => { if (!r.ok) throw new Error(); }) },
      treatments: { list: (t: string) => apiFetch<LandingTreatment[]>("/admin/landing/treatments/", { token: t }), create: (t: string, d: Partial<LandingTreatment>) => apiFetch<LandingTreatment>("/admin/landing/treatments/", { token: t, method: "POST", body: JSON.stringify(d) }), update: (t: string, id: number, d: Partial<LandingTreatment>) => apiFetch<LandingTreatment>(`/admin/landing/treatments/${id}/`, { token: t, method: "PUT", body: JSON.stringify(d) }), delete: (t: string, id: number) => fetch(`${API_BASE}/admin/landing/treatments/${id}/`, { method: "DELETE", headers: { Authorization: `Bearer ${t}` } }).then(r => { if (!r.ok) throw new Error(); }) },
      whyUs: { list: (t: string) => apiFetch<LandingWhyUsItem[]>("/admin/landing/why-us/", { token: t }), create: (t: string, d: Partial<LandingWhyUsItem>) => apiFetch<LandingWhyUsItem>("/admin/landing/why-us/", { token: t, method: "POST", body: JSON.stringify(d) }), update: (t: string, id: number, d: Partial<LandingWhyUsItem>) => apiFetch<LandingWhyUsItem>(`/admin/landing/why-us/${id}/`, { token: t, method: "PUT", body: JSON.stringify(d) }), delete: (t: string, id: number) => fetch(`${API_BASE}/admin/landing/why-us/${id}/`, { method: "DELETE", headers: { Authorization: `Bearer ${t}` } }).then(r => { if (!r.ok) throw new Error(); }) },
    },
    markAttendance: (token: string, patientId: number, attendanceStatus: "came" | "no_show", date?: string) =>
      apiFetch<{ id: number; status: "came" | "no_show"; date: string }>(
        `/admin/patients/${patientId}/attendance/`,
        { token, method: "POST", body: JSON.stringify({ status: attendanceStatus, date: date ?? new Date().toISOString().slice(0, 10) }) }
      ),
    removeAttendance: (token: string, patientId: number, date?: string) =>
      fetch(`${API_BASE}/admin/patients/${patientId}/attendance/?date=${date ?? new Date().toISOString().slice(0, 10)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }),
  },
  myDiets: {
    list: (token: string) => apiFetch<DietPlan[]>("/my-diets/", { token }),
  },

  testimonials: { list: () => apiFetch<Testimonial[]>("/testimonials/") },
  landing: {
    services: () => apiFetch<LandingService[]>("/landing/services/"),
    treatments: () => apiFetch<LandingTreatment[]>("/landing/treatments/"),
    whyUs: () => apiFetch<LandingWhyUsItem[]>("/landing/why-us/"),
  },

  site: {
    settings: () => apiFetch<SiteSettings>("/site-settings/"),

    contact: (data: ContactSubmitPayload) =>
      apiFetch<{ detail: string }>("/contact/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  kvkk: {
    saveCookieConsent: (data: {
      analytics: boolean;
      marketing: boolean;
    }) =>
      apiFetch<{ detail: string }>("/kvkk/cookie-consent/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
};
