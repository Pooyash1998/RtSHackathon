import { useState, ReactNode } from "react";
import { DemoBanner } from "@/components/shared/DemoBanner";
import { TeacherSidebar } from "./TeacherSidebar";

interface TeacherLayoutProps {
  children: ReactNode;
}

export function TeacherLayout({ children }: TeacherLayoutProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <DemoBanner />
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <TeacherSidebar open={open} setOpen={setOpen} />
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
