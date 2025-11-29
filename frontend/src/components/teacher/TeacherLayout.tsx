import { useState, ReactNode } from "react";
import { TeacherSidebar } from "./TeacherSidebar";

interface TeacherLayoutProps {
  children: ReactNode;
}

export function TeacherLayout({ children }: TeacherLayoutProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <TeacherSidebar open={open} setOpen={setOpen} />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
