import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { BookOpen, Users, Sparkles, Plus, Loader2 } from "lucide-react";
import { ClassPictureBanner } from "@/components/shared/ClassPictureBanner";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { formatGradeLevel } from "@/lib/utils";
import { isDemoMode } from "@/lib/runtime";

type StudentResponse = Awaited<ReturnType<typeof api.students.getById>>;
type ChapterResponse = Awaited<ReturnType<typeof api.students.getChapters>>;

const StudentDashboard = () => {
  const { studentId } = useParams();
  const [student, setStudent] = useState<StudentResponse["student"] | null>(null);
  const [newestStory, setNewestStory] = useState<ChapterResponse["chapters"][number] | null>(null);
  const [classrooms, setClassrooms] = useState<StudentResponse["classrooms"]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [storiesError, setStoriesError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!studentId) return;

      setIsLoading(true);
      setLoadError(null);
      setStoriesError(null);
      try {
        // Fetch student data with their classrooms from API
        const response = await api.students.getById(studentId);

        setStudent(response.student);
        setClassrooms(response.classrooms || []);

        // Fetch the newest chapter across all classrooms
        try {
          const chaptersResponse = await api.students.getChapters(studentId);
          const allChapters = chaptersResponse.chapters || [];

          // Chapters are already sorted by created_at desc from the API.
          setNewestStory(allChapters.find(chapter => chapter.status === "ready") || null);
        } catch {
          setStoriesError("Your latest story could not be loaded.");
        }

      } catch {
        toast.error("Failed to load student data");
        setLoadError("Failed to load your dashboard. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentData();
  }, [studentId]);

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (loadError || !student) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p role="alert" className="text-destructive">{loadError || "Student not found"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-6xl px-4 py-8 sm:py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="mb-6 flex items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-primary/20">
              {student.avatar_thumbnail_url || student.avatar_url ? (
                <img
                  src={student.avatar_thumbnail_url || student.avatar_url || undefined}
                  alt={`${student.name} avatar`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <AvatarFallback className="bg-primary/20 text-2xl">
                  {getInitials(student.name)}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <p className="mb-1 font-mono text-xs font-bold tracking-wide text-primary">STUDENT LIBRARY</p>
              <h1 className="mb-2 font-serif text-4xl font-semibold tracking-tight text-foreground">
                Welcome back, {student.name.split(' ')[0]}!
              </h1>
              <p className="text-muted-foreground">
                Ready to explore some amazing stories?
              </p>
            </div>
          </div>
        </motion.div>

        {/* Newest Story Section */}
        {storiesError && <p role="alert" className="mb-8 text-sm text-destructive">{storiesError}</p>}
        {newestStory && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-12"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="font-serif text-3xl font-semibold text-foreground">Latest Chapter</h2>
            </div>
            <Card className="overflow-hidden">
              <CardContent className="p-0 sm:p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="flex h-56 w-full items-center justify-center overflow-hidden border-b-2 border-foreground/15 bg-muted md:h-auto md:w-64 md:border-b-0 md:border-r-2">
                    {newestStory.thumbnail_url ? (
                      <img
                        src={newestStory.thumbnail_url}
                        alt={`${newestStory.story_title} story preview`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BookOpen className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
                    )}
                  </div>
                  <div className="flex-1 p-6 space-y-4">
                    <div>
                      <h3 className="mb-2 font-serif text-2xl font-semibold text-foreground">
                        {newestStory.story_title || `Chapter ${newestStory.index}`}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {newestStory.story_description}
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        <Badge className="border-yellow-300 bg-story-spark text-foreground">
                          New
                        </Badge>
                        {newestStory.classroom_name && (
                          <Badge variant="outline">
                            {newestStory.classroom_name}
                          </Badge>
                        )}
                        <Badge variant="outline">
                          {new Date(newestStory.created_at).toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>
                    <Button asChild size="lg" className="w-full md:w-auto">
                      <Link to={`/student/story/${newestStory.id}/${studentId}`}>
                        <BookOpen className="w-4 h-4 mr-2" />
                        Read Now
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* My Classrooms Section */}
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="whitespace-nowrap font-serif text-2xl font-semibold text-foreground sm:text-3xl">My Classrooms</h2>
            </div>
            {!isDemoMode && <Button asChild variant="outline" size="sm">
              <Link to="/student/join">
                <Plus className="w-4 h-4 mr-2" />
                Join Classroom
              </Link>
            </Button>}
          </div>
        </div>

        {classrooms.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center space-y-4">
              <p className="text-muted-foreground mb-4">
                You're not enrolled in any classrooms yet.
              </p>
              {!isDemoMode && <Button asChild size="lg">
                <Link to="/student/join">
                  <Users className="w-4 h-4 mr-2" />
                  Join a Classroom
                </Link>
              </Button>}
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classrooms.map((classroom, idx) => (
              <motion.div
                key={classroom.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 + idx * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="flex h-full flex-col space-y-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="mb-2 text-xl font-semibold text-foreground">
                          {classroom.name}
                        </h3>
                        <div className="flex gap-2 flex-wrap mb-3">
                          <Badge variant="outline">
                            {classroom.subject}
                          </Badge>
                          <Badge variant="outline">{formatGradeLevel(classroom.grade_level)}</Badge>
                        </div>
                      </div>
                    </div>

                    {/* Classroom Info */}
                    <div className="space-y-2 border-y py-3">
                      <p className="text-sm text-muted-foreground">
                        <strong>Theme:</strong> {classroom.story_theme}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Style:</strong> {classroom.design_style}
                      </p>
                    </div>

                    <Button asChild className="mt-auto w-full">
                      <Link to={`/student/classroom/${classroom.id}/${studentId}`}>
                        View Classroom
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
