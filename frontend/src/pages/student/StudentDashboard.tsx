import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { BookOpen, Users, Sparkles, Plus, Loader2 } from "lucide-react";
import { ClassPictureBanner } from "@/components/shared/ClassPictureBanner";
import { api } from "@/lib/api";
import { toast } from "sonner";

const StudentDashboard = () => {
  const { studentId } = useParams();
  const [student, setStudent] = useState<any>(null);
  const [newestStory, setNewestStory] = useState<any>(null);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!studentId) return;

      setIsLoading(true);
      try {
        // Fetch student data with their classrooms from API
        const response = await api.students.getById(studentId);

        console.log("Student data fetched:", response);

        setStudent(response.student);
        setClassrooms(response.classrooms || []);

        // Fetch the newest chapter across all classrooms
        try {
          const chaptersResponse = await api.students.getChapters(studentId);
          const allChapters = chaptersResponse.chapters || [];

          // Get the most recent chapter (already sorted by created_at desc from API)
          if (allChapters.length > 0) {
            setNewestStory(allChapters[0]);
          }
        } catch (chapterError) {
          console.error("Failed to fetch chapters:", chapterError);
          // Continue without newest story
        }

      } catch (error) {
        console.error("Failed to fetch student data:", error);
        toast.error("Failed to load student data");

        // Fallback for development
        setStudent({
          id: studentId,
          name: "Student",
          interests: "Learning",
          avatar_url: null,
          photo_url: null,
          created_at: new Date().toISOString()
        });
        setClassrooms([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentData();
  }, [studentId]);

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase();

  const subjectColors: Record<string, string> = {
    Physics: "bg-blue-500",
    Math: "bg-purple-500",
    History: "bg-amber-500",
    English: "bg-green-500",
    Chemistry: "bg-cyan-500",
    Biology: "bg-emerald-500"
  };

  if (isLoading || !student) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="w-24 h-24 border-4 border-primary/20">
              <AvatarImage src={student.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/20 text-2xl">
                {getInitials(student.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Welcome back, {student.name.split(' ')[0]}!
              </h1>
              <p className="text-muted-foreground">
                Ready to explore some amazing stories?
              </p>
            </div>
          </div>
        </motion.div>

        {/* Newest Story Section */}
        {newestStory && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-12"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Latest Chapter</h2>
            </div>
            <Card className="backdrop-blur-lg bg-card/70 border-border/50 hover:bg-card/80 transition-all hover:shadow-xl overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-48 h-48 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border-b md:border-b-0 md:border-r border-border/30 overflow-hidden">
                    {newestStory.thumbnail_url ? (
                      <img src={newestStory.thumbnail_url} alt="Story thumbnail" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-6xl">📚</span>
                    )}
                  </div>
                  <div className="flex-1 p-6 space-y-4">
                    <div>
                      <h3 className="text-2xl font-bold text-foreground mb-2">
                        {newestStory.story_title || `Chapter ${newestStory.index}`}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {newestStory.chapter_outline || newestStory.original_prompt}
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        <Badge className="bg-green-500/80 text-white backdrop-blur-sm">
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">My Classrooms</h2>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/student/join">
                <Plus className="w-4 h-4 mr-2" />
                Join Classroom
              </Link>
            </Button>
          </div>
        </div>

        {classrooms.length === 0 ? (
          <Card className="backdrop-blur-lg bg-card/70 border-border/50">
            <CardContent className="pt-12 pb-12 text-center space-y-4">
              <p className="text-muted-foreground mb-4">
                You're not enrolled in any classrooms yet.
              </p>
              <Button asChild size="lg">
                <Link to="/student/join">
                  <Users className="w-4 h-4 mr-2" />
                  Join a Classroom
                </Link>
              </Button>
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
                <Card className="backdrop-blur-lg bg-card/70 border-2 border-border/50 hover:bg-card/80 transition-all hover:shadow-xl hover:scale-[1.02]">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-foreground mb-2">
                          {classroom.name}
                        </h3>
                        <div className="flex gap-2 flex-wrap mb-3">
                          <Badge className={`${subjectColors[classroom.subject] || 'bg-gray-500'} text-white`}>
                            {classroom.subject}
                          </Badge>
                          <Badge variant="outline">Grade {classroom.grade_level}</Badge>
                        </div>
                      </div>
                    </div>

                    {/* Classroom Info */}
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        <strong>Theme:</strong> {classroom.story_theme}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Style:</strong> {classroom.design_style}
                      </p>
                    </div>

                    <Button asChild variant="default" className="w-full">
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
