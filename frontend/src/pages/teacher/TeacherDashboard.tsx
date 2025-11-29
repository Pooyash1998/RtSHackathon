import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Users, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface Classroom {
  id: string;
  name: string;
  subject: string;
  grade_level: string;
  student_count: number;
  story_count: number;
}

const subjectColors: Record<string, string> = {
  Physics: "bg-blue-500",
  Math: "bg-purple-500",
  History: "bg-amber-500",
  English: "bg-green-500",
  Chemistry: "bg-cyan-500",
  Biology: "bg-emerald-500",
  Science: "bg-teal-500",
};

const TeacherDashboard = () => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        setIsLoading(true);
        const response = await api.classrooms.getAll();
        setClassrooms(response.classrooms);
      } catch (error) {
        console.error("Failed to fetch classrooms:", error);
        toast.error("Failed to load classrooms");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassrooms();
  }, []);

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {isLoading ? (
          /* Loading State */
          <div className="flex flex-col items-center justify-center py-24 space-y-6">
            <Loader2 className="w-16 h-16 text-primary animate-spin" />
            <p className="text-muted-foreground">Loading classrooms...</p>
          </div>
        ) : classrooms.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-24 space-y-6">
            <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">No classrooms yet</h2>
            <Button asChild size="lg">
              <Link to="/teacher/classroom/new">
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Classroom
              </Link>
            </Button>
          </div>
        ) : (
          /* Classroom Grid */
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">My Classrooms</h1>
              <p className="text-muted-foreground mt-1">Manage your classes and generate stories</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classrooms.map((classroom) => (
                <Card 
                  key={classroom.id} 
                  className="hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer border-2"
                >
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-foreground">
                        {classroom.name}
                      </h3>
                      <div className="flex gap-2 items-center flex-wrap">
                        <Badge className={`${subjectColors[classroom.subject] || 'bg-gray-500'} text-white`}>
                          {classroom.subject}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Grade {classroom.grade_level}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{classroom.student_count} students</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{classroom.story_count} stories</span>
                      </div>
                    </div>

                    <Button asChild className="w-full">
                      <Link to={`/teacher/classroom/${classroom.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Floating Add Button */}
      {classrooms.length > 0 && (
        <Button
          asChild
          size="lg"
          className="fixed bottom-8 right-8 w-14 h-14 rounded-full shadow-lg z-50"
        >
          <Link to="/teacher/classroom/new">
            <Plus className="w-6 h-6" />
          </Link>
        </Button>
      )}
    </div>
  );
};

export default TeacherDashboard;
