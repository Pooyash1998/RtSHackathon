import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BackgroundComponent } from "@/components/ui/background-components";
import { TeacherLayout } from "./components/teacher/TeacherLayout";
import { StudentLayout } from "./components/student/StudentLayout";
import Landing from "./pages/shared/Landing";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import CreateClassroom from "./pages/teacher/CreateClassroom";
import ClassroomDetail from "./pages/teacher/ClassroomDetail";
import StoryGenerator from "./pages/teacher/StoryGenerator";
import StoryViewer from "./pages/teacher/StoryViewer";
import StudentSignup from "./pages/shared/StudentSignup";
import StudentLogin from "./pages/shared/StudentLogin";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentClassroom from "./pages/student/StudentClassroom";
import StudentStoryReader from "./pages/student/StudentStoryReader";
import StudentAllStories from "./pages/student/StudentAllStories";
import JoinClassroom from "./pages/student/JoinClassroom";
import CreateAvatar from "./pages/student/CreateAvatar";
import StudentProfile from "./pages/student/StudentProfile";
import NotFound from "./pages/shared/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BackgroundComponent>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />

            {/* Teacher routes with layout */}
            <Route path="/teacher/dashboard" element={<TeacherLayout><TeacherDashboard /></TeacherLayout>} />
            <Route path="/teacher/classroom/new" element={<TeacherLayout><CreateClassroom /></TeacherLayout>} />
            <Route path="/teacher/classroom/:id" element={<TeacherLayout><ClassroomDetail /></TeacherLayout>} />
            <Route path="/teacher/classroom/:classroomId/story/new" element={<TeacherLayout><StoryGenerator /></TeacherLayout>} />
            <Route path="/teacher/story/:id" element={<TeacherLayout><StoryViewer /></TeacherLayout>} />

            {/* Student routes */}
            <Route path="/student/signup" element={<StudentSignup />} />
            <Route path="/student/login" element={<StudentLogin />} />
            <Route path="/student/join" element={<JoinClassroom />} />
            <Route path="/student/join/:classroomCode" element={<JoinClassroom />} />
            <Route path="/student/create-avatar" element={<CreateAvatar />} />
            <Route path="/student/dashboard/:studentId" element={<StudentLayout><StudentDashboard /></StudentLayout>} />
            <Route path="/student/classroom/:classroomId/:studentId" element={<StudentLayout><StudentClassroom /></StudentLayout>} />
            <Route path="/student/stories/:studentId" element={<StudentLayout><StudentAllStories /></StudentLayout>} />
            <Route path="/student/profile/:studentId" element={<StudentLayout><StudentProfile /></StudentLayout>} />
            <Route path="/student/story/:chapterId/:studentId" element={<StudentStoryReader />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </BackgroundComponent>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
