import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, KeyRound, Loader2, School } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { formatGradeLevel } from "@/lib/utils";

type Classroom = Awaited<ReturnType<typeof api.classrooms.getById>>["classroom"];

const JoinClassroom = () => {
    const navigate = useNavigate();
    const { classroomCode: urlClassroomCode } = useParams();
    const [classroomCode, setClassroomCode] = useState(urlClassroomCode || "");
    const [classroom, setClassroom] = useState<Classroom | null>(null);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [error, setError] = useState("");
    const [showClassroom, setShowClassroom] = useState(!!urlClassroomCode);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchClassroom = async () => {
            if (urlClassroomCode) {
                setIsLoading(true);
                try {
                    const response = await api.classrooms.getById(urlClassroomCode);
                    setClassroom(response.classroom);
                    setShowClassroom(true);
                } catch {
                    setError("Invalid classroom link. Please check with your teacher.");
                } finally {
                    setIsLoading(false);
                }
            }
        };
        
        fetchClassroom();
    }, [urlClassroomCode]);

    // Helper function to extract classroom ID from full URL or return the ID itself
    const extractClassroomId = (input: string): string => {
        const trimmedInput = input.trim();
        
        // Check if it's a full URL
        if (trimmedInput.startsWith('http://') || trimmedInput.startsWith('https://')) {
            try {
                const url = new URL(trimmedInput);
                // Extract the last part of the path (the classroom ID)
                const pathParts = url.pathname.split('/').filter(part => part.length > 0);
                return pathParts[pathParts.length - 1];
            } catch {
                return trimmedInput;
            }
        }
        
        // If it contains a slash, extract the last part
        if (trimmedInput.includes('/')) {
            const parts = trimmedInput.split('/').filter(part => part.length > 0);
            return parts[parts.length - 1];
        }
        
        // Otherwise, assume it's already just the classroom ID
        return trimmedInput;
    };

    const handleCodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!classroomCode.trim()) {
            setError("Please enter a classroom code");
            return;
        }

        // Extract classroom ID from full URL or use as-is
        const extractedId = extractClassroomId(classroomCode);

        setIsLoading(true);
        try {
            const response = await api.classrooms.getById(extractedId);
            setClassroom(response.classroom);
            setShowClassroom(true);
        } catch {
            setError("Invalid classroom code or link. Please check with your teacher.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoin = () => {
        if (!agreedToTerms) return;

        // Reuse the locally selected preview profile when present.
        const studentId = localStorage.getItem('studentId');
        
        if (studentId) {
            // A local profile is already selected, so join directly.
            joinClassroomDirectly(studentId);
        } else {
            // Store classroom ID in session storage and navigate to signup
            sessionStorage.setItem('pendingClassroomId', classroom.id);
            sessionStorage.setItem('pendingClassroomName', classroom.name);
            
            // Navigate to student signup with classroom context
            navigate('/student/signup');
        }
    };

    const joinClassroomDirectly = async (studentId: string) => {
        setIsLoading(true);
        try {
            await api.students.joinClassroom(studentId, classroom.id);
            toast.success(`Joined ${classroom.name}!`);
            navigate(`/student/dashboard/${studentId}`);
        } catch {
            toast.error("Failed to join classroom. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        if (showClassroom) {
            // If showing classroom details, go back to code entry
            setShowClassroom(false);
            setClassroom(null);
            setClassroomCode("");
            setError("");
        } else {
            // If on code entry, go back to wherever they came from
            navigate(-1);
        }
    };

    return (
        <div className="min-h-screen">
            <header className="bg-background border-b">
                <div className="container mx-auto px-4 py-4">
                    <Button variant="ghost" onClick={handleBack}>
                        <ChevronLeft className="w-5 h-5 mr-2" />
                        Back
                    </Button>
                </div>
            </header>

            <main className="container mx-auto max-w-2xl px-4 py-8 sm:py-12">
                {showClassroom && !classroom && isLoading ? (
                    <div
                        role="status"
                        aria-label="Loading classroom"
                        className="flex justify-center py-12"
                    >
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : !showClassroom || !classroom ? (
                    // Classroom Code Entry
                    <Card>
                        <CardContent className="space-y-6 py-8">
                            <div className="text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg border bg-card">
                                    <KeyRound className="w-10 h-10 text-primary" />
                                </div>
                                <h1 className="mb-2 font-serif text-3xl font-semibold text-foreground">Join a Classroom</h1>
                                <p className="text-muted-foreground">
                                    Paste the invite link or enter the classroom code
                                </p>
                            </div>

                            <form onSubmit={handleCodeSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="classroomCode">Classroom Link or Code</Label>
                                    <Input
                                        id="classroomCode"
                                        type="text"
                                        placeholder="Paste full link or enter code"
                                        value={classroomCode}
                                        onChange={(e) => {
                                            setClassroomCode(e.target.value);
                                            setError("");
                                        }}
                                        className={error ? "border-destructive" : ""}
                                        autoFocus
                                    />
                                    {error && (
                                        <p className="text-sm text-destructive">{error}</p>
                                    )}
                                </div>

                                <Button type="submit" className="w-full" size="lg">
                                    Continue
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                ) : (
                    // Classroom Preview & Join
                    <Card>
                        <CardContent className="space-y-6 py-8">
                            {/* Classroom Preview */}
                            <div className="text-center">
                                <School className="mx-auto mb-4 h-10 w-10 text-primary" aria-hidden="true" />
                                <h2 className="mb-3 font-serif text-3xl font-semibold text-foreground">
                                    Join {classroom.name}
                                </h2>
                                <p className="text-muted-foreground mb-6">
                                    You've been invited to join this classroom
                                </p>
                            </div>

                            {/* Classroom Details */}
                            <div className="space-y-4 py-6 border-y border-border/30">
                                <div className="flex gap-2 justify-center flex-wrap">
                                    <Badge variant="outline" className="px-4 py-1 text-base">
                                        {classroom.subject}
                                    </Badge>
                                    <Badge variant="outline" className="text-base px-4 py-1">
                                        {formatGradeLevel(classroom.grade_level)}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div className="border p-4">
                                        <p className="text-sm text-muted-foreground mb-1">Theme</p>
                                        <p className="font-semibold text-foreground">{classroom.story_theme}</p>
                                    </div>
                                    <div className="border p-4">
                                        <p className="text-sm text-muted-foreground mb-1">Style</p>
                                        <p className="font-semibold text-foreground capitalize">{classroom.design_style}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Terms Agreement */}
                            <div className="space-y-4">
                                <div className="flex items-start gap-3 border p-4">
                                    <Checkbox
                                        id="terms"
                                        checked={agreedToTerms}
                                        onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                                    />
                                    <div className="flex-1">
                                        <Label htmlFor="terms" className="text-sm font-normal cursor-pointer">
                                            I agree to join <strong>{classroom.name}</strong> and
                                            participate in the classroom activities and stories.
                                        </Label>
                                    </div>
                                </div>

                                {/* Join Button */}
                                <Button
                                    onClick={handleJoin}
                                    className="w-full"
                                    size="lg"
                                    disabled={!agreedToTerms}
                                >
                                    Accept & Join Classroom
                                </Button>

                                {!agreedToTerms && (
                                    <p className="text-sm text-center text-muted-foreground">
                                        Please agree to the terms to continue
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    );
};

export default JoinClassroom;
