export interface CalendarEvent {
  title: string;
  start: Date;
  durationMinutes: number;
  description?: string;
  location?: string;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** UTC zaman damgası: YYYYMMDDTHHMMSSZ */
function toUtcStamp(date: Date) {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(
      date.getUTCDate()
    )}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(
      date.getUTCSeconds()
    )}Z`
  );
}

function escapeIcs(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function endDate(event: CalendarEvent) {
  return new Date(event.start.getTime() + event.durationMinutes * 60 * 1000);
}

/** İndirilebilir .ics içeriği üretir (iOS, Android, Outlook, Apple Takvim). */
export function buildIcs(event: CalendarEvent): string {
  const end = endDate(event);
  const uid = `${toUtcStamp(event.start)}-${Math.random()
    .toString(36)
    .slice(2)}@jfsmethod`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//JFS Method//Randevu//TR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toUtcStamp(new Date())}`,
    `DTSTART:${toUtcStamp(event.start)}`,
    `DTEND:${toUtcStamp(end)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    event.description ? `DESCRIPTION:${escapeIcs(event.description)}` : "",
    event.location ? `LOCATION:${escapeIcs(event.location)}` : "",
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcs(event.title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.join("\r\n");
}

/** .ics dosyasını tarayıcıdan indirir. */
export function downloadIcs(event: CalendarEvent, filename = "randevu.ics") {
  const blob = new Blob([buildIcs(event)], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** "Google Takvime Ekle" bağlantısı üretir. */
export function googleCalendarUrl(event: CalendarEvent): string {
  const end = endDate(event);
  const dates = `${toUtcStamp(event.start)}/${toUtcStamp(end)}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates,
  });
  if (event.description) params.set("details", event.description);
  if (event.location) params.set("location", event.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
