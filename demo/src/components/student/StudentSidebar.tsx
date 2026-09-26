import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, BookOpen, User, LogOut, ChevronDown, ChevronRight } from "lucide-react";
import { Sidebar, SidebarBody } from "@/components/ui/animated-sidebar";
import { BrandMark, BrandWordmark } from "@/components/shared/Brand";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

interface StudentSidebarProps {
  studentId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
}

type StudentClassroom = Awaited<ReturnType<typeof api.students.getClassrooms>>["classrooms"][number];

export function StudentSidebar({ studentId, open, setOpen }: StudentSidebarProps) {
  const location = useLocation();
  const [classrooms, setClassrooms] = useState<StudentClassroom[]>([]);
  const [classroomsExpanded, setClassroomsExpanded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const navigationAlignment = open
    ? "w-full justify-start gap-2 px-2"
    : "w-full justify-center px-0";

  useEffect(() => {
    const loadClassrooms = async () => {
      if (!studentId) return;

      setLoadError(null);
      try {
        const response = await api.students.getClassrooms(studentId);
        setClassrooms(response.classrooms || []);
      } catch {
        setClassrooms([]);
        setLoadError("Failed to load classrooms.");
      }
    };

    loadClassrooms();
  }, [studentId, reloadKey]);

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Logo open={open} />
          <div className="mt-8 space-y-1">
            {/* Dashboard */}
            <Link
              to={`/student/dashboard/${studentId}`}
              aria-label="Dashboard"
              aria-current={location.pathname === `/student/dashboard/${studentId}` ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center rounded-md py-2 hover:bg-accent transition-colors",
                navigationAlignment,
                location.pathname === `/student/dashboard/${studentId}` && "bg-accent font-medium",
              )}
            >
              <LayoutDashboard className="text-foreground h-5 w-5 flex-shrink-0" />
              <motion.span
                animate={{
                  display: open ? "inline-block" : "none",
                  opacity: open ? 1 : 0,
                }}
                className="text-foreground text-sm whitespace-pre inline-block !p-0 !m-0"
              >
                Dashboard
              </motion.span>
            </Link>

            {/* My Classrooms - Expandable */}
            <div>
              <button
                type="button"
                aria-label="My Classrooms"
                aria-expanded={classroomsExpanded}
                onClick={() => setClassroomsExpanded(!classroomsExpanded)}
                className={cn(
                  "flex min-h-11 w-full items-center rounded-md py-2 hover:bg-accent transition-colors",
                  navigationAlignment,
                )}
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
                  {loadError ? (
                    <div className="space-y-2 px-2 py-1">
                      <p role="alert" className="text-xs text-destructive">{loadError}</p>
                      <button
                        type="button"
                        aria-label="Retry classrooms"
                        onClick={() => setReloadKey((key) => key + 1)}
                        className="min-h-11 text-xs font-medium text-primary hover:underline"
                      >
                        Retry
                      </button>
                    </div>
                  ) : classrooms.map((classroom) => (
                    <Link
                      key={classroom.id}
                      to={`/student/classroom/${classroom.id}/${studentId}`}
                      aria-current={location.pathname === `/student/classroom/${classroom.id}/${studentId}` ? "page" : undefined}
                      className={cn(
                        "flex min-h-11 items-center gap-2 py-1.5 px-2 rounded-md hover:bg-accent/50 transition-colors text-sm text-muted-foreground hover:text-foreground",
                        location.pathname === `/student/classroom/${classroom.id}/${studentId}` && "bg-accent text-foreground font-medium",
                      )}
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
              aria-label="All Stories"
              aria-current={location.pathname === `/student/stories/${studentId}` ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center rounded-md py-2 hover:bg-accent transition-colors",
                navigationAlignment,
                location.pathname === `/student/stories/${studentId}` && "bg-accent font-medium",
              )}
            >
              <BookOpen className="text-foreground h-5 w-5 flex-shrink-0" />
              <motion.span
                animate={{
                  display: open ? "inline-block" : "none",
                  opacity: open ? 1 : 0,
                }}
                className="text-foreground text-sm whitespace-pre inline-block !p-0 !m-0"
              >
                All Stories
              </motion.span>
            </Link>

            {/* Profile */}
            <Link
              to={`/student/profile/${studentId}`}
              aria-label="Profile"
              aria-current={location.pathname === `/student/profile/${studentId}` ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center rounded-md py-2 hover:bg-accent transition-colors",
                navigationAlignment,
                location.pathname === `/student/profile/${studentId}` && "bg-accent font-medium",
              )}
            >
              <User className="text-foreground h-5 w-5 flex-shrink-0" />
              <motion.span
                animate={{
                  display: open ? "inline-block" : "none",
                  opacity: open ? 1 : 0,
                }}
                className="text-foreground text-sm whitespace-pre inline-block !p-0 !m-0"
              >
                Profile
              </motion.span>
            </Link>

            {/* Return to local role selection */}
            <Link
              to="/"
              aria-label="Exit Student View"
              className={cn(
                "flex min-h-11 items-center rounded-md py-2 hover:bg-accent transition-colors",
                navigationAlignment,
              )}
            >
              <LogOut className="text-foreground h-5 w-5 flex-shrink-0" />
              <motion.span
                animate={{
                  display: open ? "inline-block" : "none",
                  opacity: open ? 1 : 0,
                }}
                className="text-foreground text-sm whitespace-pre inline-block !p-0 !m-0"
              >
                Exit Student View
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
      aria-label="EduComic student home"
      className="relative z-20 flex min-h-11 items-center gap-2 py-1"
    >
      <BrandMark />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ display: open ? "inline-flex" : "none", opacity: open ? 1 : 0 }}
        className="whitespace-pre"
      >
        <BrandWordmark role="Student" />
      </motion.span>
    </Link>
  );
};
