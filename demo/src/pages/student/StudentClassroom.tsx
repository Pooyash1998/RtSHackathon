import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ChevronLeft, BookOpen, CheckCircle, Loader2 } from "lucide-react";
import { ClassPictureBanner } from "@/components/shared/ClassPictureBanner";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { Chapter } from "@/types/story";
import { formatGradeLevel } from "@/lib/utils";

type Classroom = Awaited<ReturnType<typeof api.classrooms.getById>>["classroom"];
type Student = Classroom["students"][number];

const StudentClassroom = () => {
  const { classroomId, studentId } = useParams();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const fetchClassroomData = async () => {
      if (!classroomId) return;

      setIsLoading(true);
      setLoadError(null);
      try {
        // Fetch classroom with students
        const classroomResponse = await api.classrooms.getById(classroomId);
        setClassroom(classroomResponse.classroom);
        setStudents(classroomResponse.classroom.students || []);

        // Fetch chapters (stories)
        const chaptersResponse = await api.classrooms.getChapters(classroomId);
        // Sort by created_at descending (newest first)
        const sortedChapters = (chaptersResponse.chapters || [])
          .filter(chapter => chapter.status === "ready")
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setChapters(sortedChapters);

      } catch {
        setLoadError("Failed to load classroom. Please try again.");
        toast.error("Failed to load classroom");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassroomData();
  }, [classroomId, reloadKey]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading classroom...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <p role="alert" className="text-destructive">{loadError}</p>
          <div className="flex justify-center gap-3">
            <Button onClick={() => setReloadKey((key) => key + 1)}>Retry</Button>
            <Button variant="outline" onClick={() => navigate(`/student/dashboard/${studentId}`)}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Classroom not found</p>
          <Button onClick={() => navigate(`/student/dashboard/${studentId}`)}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-6xl px-4 py-8 sm:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate(`/student/dashboard/${studentId}`)}
            className="mb-4"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
            <div>
              <p className="mb-2 font-mono text-xs font-bold tracking-wide text-primary">CLASSROOM LIBRARY</p>
              <h1 className="mb-3 font-serif text-4xl font-semibold tracking-tight text-foreground">
                {classroom.name}
              </h1>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">
                  {classroom.subject}
                </Badge>
                <Badge variant="outline">{formatGradeLevel(classroom.grade_level)}</Badge>
                <Badge variant="outline">{classroom.story_theme}</Badge>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Class Picture Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <ClassPictureBanner
            students={students.map(s => ({
              id: s.id,
              name: s.name,
              avatar_url: s.avatar_url,
              avatar_thumbnail_url: s.avatar_thumbnail_url,
            }))}
          />
        </motion.div>

        {/* Stories Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="mb-6 font-serif text-3xl font-semibold text-foreground">Stories</h2>

          {chapters.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <p className="text-muted-foreground">
                  No stories yet. Your teacher will create them soon!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {chapters.map((chapter, idx) => (
                <motion.div
                  key={chapter.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + idx * 0.1 }}
                  className="h-full"
                >
                  <Card className="flex h-full flex-col">
                    <CardContent className="flex h-full flex-col">
                      <div className="flex h-48 w-full flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-foreground/15 bg-muted">
                        {chapter.thumbnail_url ? (
                          <img
                            src={chapter.thumbnail_url}
                            alt={`${chapter.story_title} story preview`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <BookOpen className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                        )}
                      </div>

                      <div className="flex-1 flex flex-col justify-between mt-4">
                        <div>
                          <h3 className="mb-2 min-h-[3.5rem] font-serif text-xl font-semibold text-foreground">
                            {chapter.story_title || `Chapter ${chapter.index}`}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-3 min-h-[2.5rem]">
                            {chapter.story_description}
                          </p>
                          <p className="text-xs text-muted-foreground mb-3">
                            Created on {new Date(chapter.created_at).toLocaleDateString()}
                          </p>

                          <div className="flex gap-2 flex-wrap mb-4">
                            <Badge className="border-green-700 bg-green-700 text-white">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {chapter.status.replace(/_/g, " ")}
                            </Badge>
                            <Badge variant="outline">
                              {classroom.design_style}
                            </Badge>
                          </div>
                        </div>

                        <Button asChild className="w-full mt-auto">
                          <Link to={`/student/story/${chapter.id}/${studentId}`}>
                            <BookOpen className="w-4 h-4 mr-2" />
                            Read Story
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default StudentClassroom;
