import { Link } from "react-router-dom";
import { LayoutDashboard, Users, BookOpen, User, LogOut, ChevronDown, ChevronRight } from "lucide-react";
import { Sidebar, SidebarBody } from "@/components/ui/animated-sidebar";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { getClassroomsByStudentId } from "@/lib/mockData";
import { cn } from "@/lib/utils";

interface StudentSidebarProps {
  studentId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function StudentSidebar({ studentId, open, setOpen }: StudentSidebarProps) {
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [classroomsExpanded, setClassroomsExpanded] = useState(false);

  useEffect(() => {
    if (studentId) {
      const classroomData = getClassroomsByStudentId(studentId);
      setClassrooms(classroomData);
    }
  }, [studentId]);

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Logo open={open} />
          <div className="mt-8 space-y-1">
            {/* Dashboard */}
            <Link
              to={`/student/dashboard/${studentId}`}
              className="flex items-center justify-start gap-2 group/sidebar py-2 px-2 rounded-md hover:bg-accent transition-colors"
            >
              <LayoutDashboard className="text-foreground h-5 w-5 flex-shrink-0" />
              <motion.span
                animate={{
                  display: open ? "inline-block" : "none",
                  opacity: open ? 1 : 0,
                }}
                className="text-foreground text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
              >
                Dashboard
              </motion.span>
            </Link>

            {/* My Classrooms - Expandable */}
            <div>
              <button
                onClick={() => setClassroomsExpanded(!classroomsExpanded)}
                className="w-full flex items-center justify-start gap-2 group/sidebar py-2 px-2 rounded-md hover:bg-accent transition-colors"
              >
                <Users className="text-foreground h-5 w-5 flex-shrink-0" />
                <motion.span
                  animate={{
                    display: open ? "inline-block" : "none",
                    opacity: open ? 1 : 0,
                  }}
                  className="text-foreground text-sm flex-1 text-left whitespace-pre inline-block !p-0 !m-0"
                >
                  My Classrooms
                </motion.span>
                {open && (
                  <motion.div
                    animate={{
                      rotate: classroomsExpanded ? 180 : 0,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-4 w-4 text-foreground" />
                  </motion.div>
                )}
              </button>

              {/* Classroom List */}
              {open && classroomsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="ml-7 mt-1 space-y-1 overflow-hidden"
                >
                  {classrooms.map((classroom) => (
                    <Link
                      key={classroom.id}
                      to={`/student/classroom/${classroom.id}/${studentId}`}
                      className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-accent/50 transition-colors text-sm text-muted-foreground hover:text-foreground"
                    >
                      <ChevronRight className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{classroom.name}</span>
                    </Link>
                  ))}
                </motion.div>
              )}
            </div>

            {/* All Stories */}
            <Link
              to={`/student/stories/${studentId}`}
              className="flex items-center justify-start gap-2 group/sidebar py-2 px-2 rounded-md hover:bg-accent transition-colors"
            >
              <BookOpen className="text-foreground h-5 w-5 flex-shrink-0" />
              <motion.span
                animate={{
                  display: open ? "inline-block" : "none",
                  opacity: open ? 1 : 0,
                }}
                className="text-foreground text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
              >
                All Stories
              </motion.span>
            </Link>

            {/* Profile */}
            <Link
              to={`/student/profile/${studentId}`}
              className="flex items-center justify-start gap-2 group/sidebar py-2 px-2 rounded-md hover:bg-accent transition-colors"
            >
              <User className="text-foreground h-5 w-5 flex-shrink-0" />
              <motion.span
                animate={{
                  display: open ? "inline-block" : "none",
                  opacity: open ? 1 : 0,
                }}
                className="text-foreground text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
              >
                Profile
              </motion.span>
            </Link>

            {/* Logout */}
            <Link
              to="/"
              className="flex items-center justify-start gap-2 group/sidebar py-2 px-2 rounded-md hover:bg-accent transition-colors"
            >
              <LogOut className="text-foreground h-5 w-5 flex-shrink-0" />
              <motion.span
                animate={{
                  display: open ? "inline-block" : "none",
                  opacity: open ? 1 : 0,
                }}
                className="text-foreground text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
              >
                Logout
              </motion.span>
            </Link>
          </div>
        </div>
      </SidebarBody>
    </Sidebar>
  );
}

const Logo = ({ open }: { open: boolean }) => {
  return (
    <Link
      to="/"
      className="font-normal flex space-x-2 items-center text-sm py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-primary rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: open ? 1 : 0 }}
        className="font-medium text-foreground whitespace-pre"
      >
        StoryClass Student
      </motion.span>
    </Link>
  );
};
