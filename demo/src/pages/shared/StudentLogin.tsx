import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, User, Loader2, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DemoBanner } from "@/components/shared/DemoBanner";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { isDemoMode } from "@/lib/runtime";

interface Student {
    id: string;
    name: string;
    interests: string;
    avatar_url: string | null;
    avatar_thumbnail_url: string | null;
    created_at: string;
}

const StudentProfilePicker = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        fetchAllStudents();
    }, []);

    const fetchAllStudents = async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
            const response = await api.students.getAll();
            setStudents(response.students);
        } catch {
            setLoadError("Failed to load students. Please try again.");
            toast.error("Failed to load students. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleStudentClick = (studentId: string) => {
        // Remember the selected local preview profile on this device.
        localStorage.setItem('studentId', studentId);
        navigate(`/student/dashboard/${studentId}`);
    };

    return (
        <div className="flex h-screen flex-col overflow-hidden">
            <DemoBanner />
            <div className="min-h-0 flex-1 overflow-auto">
                <header className="bg-background border-b">
                    <div className="container mx-auto px-4 py-4">
                        <Button variant="ghost" onClick={() => navigate("/")}>
                            <ChevronLeft className="w-5 h-5 mr-2" />
                            Back to Home
                        </Button>
                    </div>
                </header>

            <main className="container mx-auto max-w-2xl px-4 py-8 sm:py-12">
                <Card>
                    <CardContent className="space-y-6 py-8">
                        <div className="text-center">
                            <GraduationCap className="mx-auto mb-4 h-10 w-10 text-primary" aria-hidden="true" />
                            <h1 className="font-serif text-3xl font-semibold text-foreground">Choose a Student Profile</h1>
                        </div>

                        <div className="space-y-3">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                                    <p className="text-muted-foreground">Loading students...</p>
                                </div>
                            ) : loadError ? (
                                <div className="flex flex-col items-center py-12 text-center">
                                    <p role="alert" className="mb-4 text-muted-foreground">{loadError}</p>
                                    <Button variant="outline" onClick={fetchAllStudents}>Retry</Button>
                                </div>
                            ) : students.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-muted-foreground mb-4">No student profiles found</p>
                                    <p className="text-sm text-muted-foreground">
                                        Create a local profile to get started
                                    </p>
                                </div>
                            ) : (
                                students.map((student) => (
                                    <button
                                        key={student.id}
                                        type="button"
                                        aria-label={`Continue as ${student.name}`}
                                        className="w-full rounded-lg border bg-card text-left text-card-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        onClick={() => handleStudentClick(student.id)}
                                    >
                                        <CardContent className="pt-4 pb-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    {student.avatar_thumbnail_url || student.avatar_url ? (
                                                        <img
                                                            src={student.avatar_thumbnail_url || student.avatar_url || undefined}
                                                            alt={student.name}
                                                            className="w-12 h-12 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                                                            <User className="w-6 h-6 text-primary" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h3 className="font-semibold text-foreground">{student.name}</h3>
                                                        <p className="text-sm text-muted-foreground">{student.interests}</p>
                                                    </div>
                                                </div>
                                                <Badge variant="outline">Student</Badge>
                                            </div>
                                        </CardContent>
                                    </button>
                                ))
                            )}
                        </div>

                        {!isDemoMode && <div className="pt-4 border-t border-border/30 text-center">
                            <p className="text-sm text-muted-foreground mb-3">
                                New to the platform?
                            </p>
                            <Button onClick={() => navigate("/student/signup")} variant="outline" size="sm">
                                Create Student Profile
                            </Button>
                        </div>}
                    </CardContent>
                </Card>
                </main>
            </div>
        </div>
    );
};

export default StudentProfilePicker;
