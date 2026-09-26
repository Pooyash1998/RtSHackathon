import { lazy, Suspense } from "react";
import { Toaster } from "sonner";
import { BrowserRouter, HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { MotionConfig } from "framer-motion";

import { BackgroundComponent } from "@/components/ui/background-components";
import ClassicLoader from "@/components/ui/loader";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StudentLayout } from "./components/student/StudentLayout";
import { TeacherLayout } from "./components/teacher/TeacherLayout";
import { isDemoMode } from "@/lib/runtime";

const Landing = lazy(() => import("./pages/shared/Landing"));
const NotFound = lazy(() => import("./pages/shared/NotFound"));
const StudentProfilePicker = lazy(() => import("./pages/shared/StudentLogin"));
const StudentSignup = lazy(() => import("./pages/shared/StudentSignup"));
const JoinClassroom = lazy(() => import("./pages/student/JoinClassroom"));
const StudentAllStories = lazy(() => import("./pages/student/StudentAllStories"));
const StudentClassroom = lazy(() => import("./pages/student/StudentClassroom"));
const StudentDashboard = lazy(() => import("./pages/student/StudentDashboard"));
const StudentProfile = lazy(() => import("./pages/student/StudentProfile"));
const StudentStoryReader = lazy(() => import("./pages/student/StudentStoryReader"));
const ClassroomDetail = lazy(() => import("./pages/teacher/ClassroomDetail"));
const CreateClassroom = lazy(() => import("./pages/teacher/CreateClassroom"));
const StoryGenerator = lazy(() => import("./pages/teacher/StoryGenerator"));
const StoryViewer = lazy(() => import("./pages/teacher/StoryViewer"));
const TeacherDashboard = lazy(() => import("./pages/teacher/TeacherDashboard"));
const Settings = lazy(() => import("./pages/teacher/Settings"));

const loadingPage = (
  <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Loading page">
    <ClassicLoader />
  </div>
);

const Router = isDemoMode ? HashRouter : BrowserRouter;

const App = () => (
  <MotionConfig reducedMotion="user">
    <TooltipProvider>
      <BackgroundComponent>
        <Toaster />
        <Router>
          <Suspense fallback={loadingPage}>
            <Routes>
            <Route path="/" element={<Landing />} />

            <Route path="/teacher/dashboard" element={<TeacherLayout><TeacherDashboard /></TeacherLayout>} />
            <Route path="/teacher/settings" element={isDemoMode ? <Navigate to="/teacher/dashboard" replace /> : <TeacherLayout><Settings /></TeacherLayout>} />
            <Route path="/teacher/classroom/new" element={isDemoMode ? <Navigate to="/teacher/dashboard" replace /> : <TeacherLayout><CreateClassroom /></TeacherLayout>} />
            <Route path="/teacher/classroom/:id" element={<TeacherLayout><ClassroomDetail /></TeacherLayout>} />
            <Route path="/teacher/classroom/:classroomId/story/new" element={isDemoMode ? <Navigate to="/teacher/dashboard" replace /> : <TeacherLayout><StoryGenerator /></TeacherLayout>} />
            <Route path="/teacher/story/:id" element={<TeacherLayout><StoryViewer /></TeacherLayout>} />

            <Route path="/student/signup" element={isDemoMode ? <Navigate to="/student/select" replace /> : <StudentSignup />} />
            <Route path="/student/select" element={<StudentProfilePicker />} />
            <Route path="/student/join" element={isDemoMode ? <Navigate to="/student/select" replace /> : <JoinClassroom />} />
            <Route path="/student/join/:classroomCode" element={isDemoMode ? <Navigate to="/student/select" replace /> : <JoinClassroom />} />
            <Route path="/student/dashboard/:studentId" element={<StudentLayout><StudentDashboard /></StudentLayout>} />
            <Route path="/student/classroom/:classroomId/:studentId" element={<StudentLayout><StudentClassroom /></StudentLayout>} />
            <Route path="/student/stories/:studentId" element={<StudentLayout><StudentAllStories /></StudentLayout>} />
            <Route path="/student/profile/:studentId" element={<StudentLayout><StudentProfile /></StudentLayout>} />
            <Route path="/student/story/:chapterId/:studentId" element={<StudentStoryReader />} />

            <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Router>
      </BackgroundComponent>
    </TooltipProvider>
  </MotionConfig>
);

export default App;
