import { ReactNode, useState } from "react";
import { useParams } from "react-router-dom";
import { DemoBanner } from "@/components/shared/DemoBanner";
import { StudentSidebar } from "./StudentSidebar";

interface StudentLayoutProps {
  children: ReactNode;
  studentId?: string;
}

export function StudentLayout({ children, studentId: propStudentId }: StudentLayoutProps) {
  const [open, setOpen] = useState(false);
  const params = useParams();

  // Get studentId from props or route params
  const studentId = propStudentId || params.studentId || "";

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <DemoBanner />
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <StudentSidebar studentId={studentId} open={open} setOpen={setOpen} />
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
