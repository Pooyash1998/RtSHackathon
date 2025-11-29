import { useNavigate } from "react-router-dom";
import { ChevronLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockStudents } from "@/lib/mockData";

const StudentLogin = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-muted/20">
            <header className="bg-background border-b">
                <div className="container mx-auto px-4 py-4">
                    <Button variant="ghost" onClick={() => navigate("/")}>
                        <ChevronLeft className="w-5 h-5 mr-2" />
                        Back to Home
                    </Button>
                </div>
            </header>

            <div className="container mx-auto px-4 py-12 max-w-2xl">
                <Card className="backdrop-blur-lg bg-card/70 border-2 border-border/50">
                    <CardContent className="pt-8 pb-8 space-y-6">
                        <div className="text-center">
                            <div className="text-6xl mb-4">🎓</div>
                            <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back!</h1>
                            <p className="text-muted-foreground">
                                Select your account to continue
                            </p>
                        </div>

                        <div className="space-y-3">
                            {mockStudents.map((student) => (
                                <Card
                                    key={student.id}
                                    className="cursor-pointer hover:bg-accent transition-all hover:shadow-lg border-2"
                                    onClick={() => navigate(`/student/dashboard/${student.id}`)}
                                >
                                    <CardContent className="pt-4 pb-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                                                    <User className="w-6 h-6 text-primary" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-foreground">{student.name}</h3>
                                                    <p className="text-sm text-muted-foreground">{student.interests}</p>
                                                </div>
                                            </div>
                                            <Badge variant="outline">Student</Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-border/30 text-center">
                            <p className="text-sm text-muted-foreground mb-3">
                                New to the platform?
                            </p>
                            <Button onClick={() => navigate("/student/signup")} variant="outline" size="sm">
                                Create Account
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default StudentLogin;
