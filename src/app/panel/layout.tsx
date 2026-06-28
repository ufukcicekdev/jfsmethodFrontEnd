import { PanelShell } from "@/components/admin/PanelShell";

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PanelShell>{children}</PanelShell>;
}
