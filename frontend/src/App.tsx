import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TeacherLayout } from "./components/teacher/TeacherLayout";
import Landing from "./pages/shared/Landing";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import CreateClassroom from "./pages/teacher/CreateClassroom";
import ClassroomDetail from "./pages/teacher/ClassroomDetail";
import StoryGenerator from "./pages/teacher/StoryGenerator";
import StoryViewer from "./pages/teacher/StoryViewer";
import StudentSignup from "./pages/shared/StudentSignup";
import NotFound from "./pages/shared/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          
          {/* Teacher routes with layout */}
          <Route path="/teacher/dashboard" element={<TeacherLayout><TeacherDashboard /></TeacherLayout>} />
          <Route path="/teacher/classroom/new" element={<TeacherLayout><CreateClassroom /></TeacherLayout>} />
          <Route path="/teacher/classroom/:id" element={<TeacherLayout><ClassroomDetail /></TeacherLayout>} />
          <Route path="/teacher/story/new" element={<TeacherLayout><StoryGenerator /></TeacherLayout>} />
          <Route path="/teacher/story/:id" element={<TeacherLayout><StoryViewer /></TeacherLayout>} />
          
          <Route path="/student/signup" element={<StudentSignup />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
