import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { api } from "@/lib/api";

const JoinClassroom = () => {
    const navigate = useNavigate();
    const { classroomCode: urlClassroomCode } = useParams();
    const [classroomCode, setClassroomCode] = useState(urlClassroomCode || "");
    const [classroom, setClassroom] = useState<any>(null);
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
                } catch (error) {
                    console.error("Failed to fetch classroom:", error);
                    setError("Invalid classroom link. Please check with your teacher.");
                } finally {
                    setIsLoading(false);
                }
            }
        };
        
        fetchClassroom();
    }, [urlClassroomCode]);

    const handleCodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!classroomCode.trim()) {
            setError("Please enter a classroom code");
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.classrooms.getById(classroomCode);
            setClassroom(response.classroom);
            setShowClassroom(true);
        } catch (error) {
            console.error("Failed to fetch classroom:", error);
            setError("Invalid classroom code. Please check with your teacher.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoin = () => {
        if (!agreedToTerms) return;

        // Store classroom ID in session storage and navigate to signup
        sessionStorage.setItem('pendingClassroomId', classroom.id);
        sessionStorage.setItem('pendingClassroomName', classroom.name);
        
        // Navigate to student signup with classroom context
        navigate('/student/signup');
    };

    const subjectColors: Record<string, string> = {
        Physics: "bg-blue-500",
        Math: "bg-purple-500",
        History: "bg-amber-500",
        English: "bg-green-500",
        Chemistry: "bg-cyan-500",
        Biology: "bg-emerald-500"
    };

    return (
        <div className="min-h-screen bg-muted/20">
            <header className="bg-background border-b">
                <div className="container mx-auto px-4 py-4">
                    <Button variant="ghost" onClick={() => navigate(showClassroom ? "/student/join" : "/student/signup")}>
                        <ChevronLeft className="w-5 h-5 mr-2" />
                        Back
                    </Button>
                </div>
            </header>

            <div className="container mx-auto px-4 py-12 max-w-2xl">
                {!showClassroom ? (
                    // Classroom Code Entry
                    <Card className="backdrop-blur-lg bg-card/70 border-2 border-border/50">
                        <CardContent className="pt-8 pb-8 space-y-6">
                            <div className="text-center">
                                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                                    <KeyRound className="w-10 h-10 text-primary" />
                                </div>
                                <h1 className="text-3xl font-bold text-foreground mb-2">Join a Classroom</h1>
                                <p className="text-muted-foreground">
                                    Enter the classroom code provided by your teacher
                                </p>
                            </div>

                            <form onSubmit={handleCodeSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="classroomCode">Classroom Code</Label>
                                    <Input
                                        id="classroomCode"
                                        type="text"
                                        placeholder="Enter code (e.g., class-1)"
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
                    <Card className="backdrop-blur-lg bg-card/70 border-2 border-border/50">
                        <CardContent className="pt-8 pb-8 space-y-6">
                            {/* Classroom Preview */}
                            <div className="text-center">
                                <div className="text-6xl mb-4">🏫</div>
                                <h2 className="text-3xl font-bold text-foreground mb-3">
                                    Join {classroom.name}
                                </h2>
                                <p className="text-muted-foreground mb-6">
                                    You've been invited to join this classroom
                                </p>
                            </div>

                            {/* Classroom Details */}
                            <div className="space-y-4 py-6 border-y border-border/30">
                                <div className="flex gap-2 justify-center flex-wrap">
                                    <Badge className={`${subjectColors[classroom.subject] || 'bg-gray-500'} text-white text-base px-4 py-1`}>
                                        {classroom.subject}
                                    </Badge>
                                    <Badge variant="outline" className="text-base px-4 py-1">
                                        Grade {classroom.grade_level}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div className="p-4 bg-muted/50 rounded-lg">
                                        <p className="text-sm text-muted-foreground mb-1">Theme</p>
                                        <p className="font-semibold text-foreground">{classroom.story_theme}</p>
                                    </div>
                                    <div className="p-4 bg-muted/50 rounded-lg">
                                        <p className="text-sm text-muted-foreground mb-1">Style</p>
                                        <p className="font-semibold text-foreground capitalize">{classroom.design_style}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Terms Agreement */}
                            <div className="space-y-4">
                                <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
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
            </div>
        </div>
    );
};

export default JoinClassroom;
