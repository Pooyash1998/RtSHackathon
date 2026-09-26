import { Link, useLocation, useParams } from "react-router-dom";
import { 
  LayoutDashboard, 
  LogOut, 
  Users, 
  BookOpen, 
  ArrowLeft,
  Settings
} from "lucide-react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/animated-sidebar";
import { BrandMark, BrandWordmark } from "@/components/shared/Brand";
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { isDemoMode } from "@/lib/runtime";

interface TeacherSidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function TeacherSidebar({ open, setOpen }: TeacherSidebarProps) {
  const location = useLocation();
  const { id: classroomId } = useParams();
  const isClassroomPage = location.pathname.includes('/teacher/classroom/');
  const isStoryPage = location.pathname.includes('/teacher/story/');

  const mainLinks = [
    {
      label: "Dashboard",
      href: "/teacher/dashboard",
      icon: <LayoutDashboard className="text-foreground h-5 w-5 flex-shrink-0" />,
    },
    ...(!isDemoMode ? [{
      label: "Settings",
      href: "/teacher/settings",
      icon: <Settings className="text-foreground h-5 w-5 flex-shrink-0" />,
    }] : []),
    {
      label: "Exit Teacher View",
      href: "/",
      icon: <LogOut className="text-foreground h-5 w-5 flex-shrink-0" />,
    },
  ];

  const classroomLinks = classroomId ? [
    {
      label: "Students",
      href: `/teacher/classroom/${classroomId}?tab=students`,
      icon: <Users className="text-foreground h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Stories",
      href: `/teacher/classroom/${classroomId}?tab=stories`,
      icon: <BookOpen className="text-foreground h-5 w-5 flex-shrink-0" />,
    },
  ] : [];

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Logo open={open} />
          
          {/* Back to Dashboard - Only show on classroom/story pages */}
          {(isClassroomPage || isStoryPage) && (
            <>
              <div className="mt-8">
                <Link 
                  to="/teacher/dashboard"
                  aria-label="Back to Dashboard"
                  className="flex min-h-11 items-center gap-2 px-2 py-2 rounded-md hover:bg-accent transition-colors text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4 flex-shrink-0" />
                  {open && <span>Back to Dashboard</span>}
                </Link>
              </div>
              <Separator className="my-4" />
            </>
          )}

          {/* Classroom-specific section */}
          {isClassroomPage && classroomId && (
            <>
              <div className="space-y-2">
                {open && (
                  <div className="px-2 mb-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Classroom
                    </h3>
                  </div>
                )}
                {classroomLinks.map((link, idx) => (
                  <SidebarLink key={idx} link={link} />
                ))}
              </div>

              <Separator className="my-4" />
            </>
          )}

          {/* Main Navigation */}
          <div className={`space-y-2 ${!isClassroomPage && !isStoryPage ? 'mt-8' : ''}`}>
            {mainLinks.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}
          </div>
        </div>
      </SidebarBody>
    </Sidebar>
  );
}

const Logo = ({ open }: { open: boolean }) => {
  return (
    <Link
      to="/teacher/dashboard"
      aria-label="EduComic dashboard"
      className="relative z-20 flex min-h-11 items-center gap-2 py-1"
    >
      <BrandMark />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ display: open ? "inline-flex" : "none", opacity: open ? 1 : 0 }}
        className="whitespace-pre"
      >
        <BrandWordmark role="Teacher" />
      </motion.span>
    </Link>
  );
};
