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

const StudentClassroom = () => {
  const { classroomId, studentId } = useParams();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClassroomData = async () => {
      if (!classroomId) return;
      
      setIsLoading(true);
      try {
        // Fetch classroom with students
        const classroomResponse = await api.classrooms.getById(classroomId);
        console.log("Classroom data:", classroomResponse);
        setClassroom(classroomResponse.classroom);
        setStudents(classroomResponse.classroom.students || []);

        // Fetch chapters (stories)
        const chaptersResponse = await api.classrooms.getChapters(classroomId);
        console.log("Chapters data:", chaptersResponse);
        setChapters(chaptersResponse.chapters || []);
        
      } catch (error) {
        console.error("Failed to fetch classroom data:", error);
        toast.error("Failed to load classroom");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassroomData();
  }, [classroomId]);

  const subjectColors: Record<string, string> = {
    Physics: "bg-blue-500",
    Math: "bg-purple-500",
    History: "bg-amber-500",
    English: "bg-green-500",
    Chemistry: "bg-cyan-500",
    Biology: "bg-emerald-500"
  };

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
    <div className="min-h-screen bg-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
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
              <h1 className="text-4xl font-bold text-foreground mb-3">
                {classroom.name}
              </h1>
              <div className="flex gap-2 flex-wrap">
                <Badge className={`${subjectColors[classroom.subject] || 'bg-gray-500'} text-white`}>
                  {classroom.subject}
                </Badge>
                <Badge variant="outline">Grade {classroom.grade_level}</Badge>
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
              avatar_url: s.avatar_url
            }))}
          />
        </motion.div>

        {/* Stories Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-foreground mb-6">Stories</h2>

          {chapters.length === 0 ? (
            <Card className="backdrop-blur-lg bg-card/70 border-border/50">
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
                >
                  <Card className="backdrop-blur-lg bg-card/70 border-2 border-border/50 hover:bg-card/80 transition-all hover:shadow-xl hover:scale-[1.02]">
                    <CardContent className="pt-6 space-y-4">
                      <div className="w-full h-40 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center border border-border/30">
                        <span className="text-5xl">📚</span>
                      </div>

                      <div>
                        <h3 className="text-xl font-bold text-foreground mb-2">
                          Chapter {chapter.index}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {chapter.chapter_outline}
                        </p>
                        <p className="text-xs text-muted-foreground mb-3">
                          Created on {new Date(chapter.created_at).toLocaleDateString()}
                        </p>

                        <div className="flex gap-2 flex-wrap mb-4">
                          <Badge className="bg-green-500/80 text-white backdrop-blur-sm">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                          <Badge variant="outline">
                            {classroom.design_style}
                          </Badge>
                        </div>
                      </div>

                      <Button asChild className="w-full">
                        <Link to={`/student/story/${chapter.id}/${studentId}`}>
                          <BookOpen className="w-4 h-4 mr-2" />
                          Read Story
                        </Link>
                      </Button>
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
