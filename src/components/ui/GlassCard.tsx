import { type ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export function GlassCard({ children, className = "", id }: GlassCardProps) {
  return (
    <div id={id} className={`glass rounded-3xl ${className}`}>
      {children}
    </div>
  );
}
