import { ReactNode, useState } from "react";
import { useParams } from "react-router-dom";
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
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <StudentSidebar studentId={studentId} open={open} setOpen={setOpen} />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
