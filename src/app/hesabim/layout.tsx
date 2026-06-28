import { PatientShell } from "@/components/patient/PatientShell";

export default function HesabimLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PatientShell>{children}</PatientShell>;
}
