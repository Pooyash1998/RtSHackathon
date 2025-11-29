import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClassroomDashboard } from "./components/teacher/ClassroomDashboard";
import { ClassroomForm } from "./components/teacher/ClassroomForm";

// Home page
const Home = () => (
  <div className="min-h-screen bg-gray-50 p-8">
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">EduComic - Classroom Story Platform</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/teacher/dashboard"
          className="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 transition"
        >
          <h2 className="text-2xl font-bold mb-2">Teacher Portal</h2>
          <p>Create classrooms and generate stories</p>
        </Link>
        <Link
          to="/student/join"
          className="bg-green-600 text-white p-6 rounded-lg hover:bg-green-700 transition"
        >
          <h2 className="text-2xl font-bold mb-2">Student Portal</h2>
          <p>Join classroom and create avatar</p>
        </Link>
      </div>
    </div>
  </div>
);

// Placeholder for student join
const StudentJoin = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold">Join Classroom</h1>
    <p className="mt-4">Student signup form will appear here</p>
  </div>
);

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />

          {/* Teacher routes */}
          <Route path="/teacher/dashboard" element={<ClassroomDashboard />} />
          <Route path="/teacher/classroom/new" element={<ClassroomForm />} />
          <Route path="/teacher/classroom/:id" element={<div>Classroom Detail</div>} />
          <Route path="/teacher/story/new" element={<div>Story Generator</div>} />
          <Route path="/teacher/story/:id" element={<div>Story Viewer</div>} />
          <Route path="/teacher/story/:id/export" element={<div>Export Story</div>} />

          {/* Student routes */}
          <Route path="/student/join" element={<StudentJoin />} />
          <Route path="/student/join/:classroomId" element={<div>Join Specific Classroom</div>} />
          <Route path="/student/avatar/create" element={<div>Avatar Creator</div>} />
          <Route path="/student/stories" element={<div>Story List</div>} />
          <Route path="/student/story/:id" element={<div>Story Reader</div>} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
