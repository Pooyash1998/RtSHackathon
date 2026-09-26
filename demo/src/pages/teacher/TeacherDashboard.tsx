import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Users, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { formatGradeLevel } from "@/lib/utils";
import { isDemoMode } from "@/lib/runtime";

interface Classroom {
  id: string;
  name: string;
  subject: string;
  grade_level: string;
  student_count: number;
  story_count: number;
}

const TeacherDashboard = () => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const response = await api.classrooms.getAll();
        setClassrooms(response.classrooms);
      } catch {
        toast.error("Failed to load classrooms");
        setLoadError("Failed to load classrooms. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassrooms();
  }, []);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-6xl px-4 py-8 sm:py-12">
        {isLoading ? (
          /* Loading State */
          <div className="flex flex-col items-center justify-center py-24 space-y-4" role="status">
            <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden="true" />
            <p className="text-muted-foreground">Loading classrooms...</p>
          </div>
        ) : loadError ? (
          <div className="flex items-center justify-center py-24">
            <p role="alert" className="text-destructive">{loadError}</p>
          </div>
        ) : classrooms.length === 0 ? (
          /* Empty State */
          <div className="mx-auto flex max-w-lg flex-col items-center justify-center py-24 text-center space-y-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border bg-card">
              <BookOpen className="h-8 w-8 text-primary" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <h1 className="font-serif text-3xl font-semibold text-foreground">Start your comic workshop</h1>
              <p className="text-muted-foreground">Create a classroom, invite students, and turn a lesson into a visual story.</p>
            </div>
            {!isDemoMode && <Button asChild size="lg">
              <Link to="/teacher/classroom/new">
                <Plus className="w-5 h-5 mr-2" />
                Create your first classroom
              </Link>
            </Button>}
          </div>
        ) : (
          /* Classroom Grid */
          <>
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="mb-2 font-mono text-xs font-bold tracking-wide text-primary">TEACHER WORKSPACE</p>
                <h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground">My Classrooms</h1>
                <p className="mt-2 text-muted-foreground">Manage students, lesson materials, and classroom stories.</p>
              </div>
              {!isDemoMode && <Button asChild>
                <Link to="/teacher/classroom/new">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Create classroom
                </Link>
              </Button>}
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classrooms.map((classroom) => (
                <Card key={classroom.id} className="border">
                  <CardContent className="flex h-full flex-col gap-5 pt-6">
                    <div className="space-y-2">
                      <h2 className="text-xl font-semibold text-foreground">
                        {classroom.name}
                      </h2>
                      <div className="flex gap-2 items-center flex-wrap">
                        <Badge variant="outline">
                          {classroom.subject}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatGradeLevel(classroom.grade_level)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 border-y py-3 font-mono text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{classroom.student_count} students</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{classroom.story_count} stories</span>
                      </div>
                    </div>

                    <Button asChild className="mt-auto w-full">
                      <Link to={`/teacher/classroom/${classroom.id}`} aria-label={`Open ${classroom.name}`}>
                        Open classroom
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

    </div>
  );
};

export default TeacherDashboard;
