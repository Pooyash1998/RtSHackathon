import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { User, Mail, Heart, Trash2, Edit } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getStudentById } from "@/lib/mockData";

const StudentProfile = () => {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const [student, setStudent] = useState<any>(null);

    useEffect(() => {
        if (studentId) {
            const studentData = getStudentById(studentId);

            // Handle newly created students not in mock data
            if (!studentData) {
                setStudent({
                    id: studentId,
                    name: "New Student",
                    interests: "Learning",
                    avatar_url: null,
                    photo_url: null,
                    classroom_id: "",
                    created_at: new Date().toISOString()
                });
            } else {
                setStudent(studentData);
            }
        }
    }, [studentId]);

    const getInitials = (name: string) =>
        name.split(' ').map(n => n[0]).join('').toUpperCase();

    const handleDeleteAccount = () => {
        console.log("Deleting account:", studentId);
        // In production, this would delete the student account
        // For now, navigate back to landing page
        navigate("/");
    };

    if (!student) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/20">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-4xl font-bold text-foreground mb-8">My Profile</h1>

                    {/* Profile Card */}
                    <Card className="backdrop-blur-lg bg-card/70 border-2 border-border/50 mb-6">
                        <CardContent className="pt-8 pb-8">
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                {/* Avatar Section */}
                                <div className="flex flex-col items-center space-y-4">
                                    <Avatar className="w-32 h-32 border-4 border-primary/20">
                                        <AvatarImage src={student.avatar_url || student.photo_url || undefined} />
                                        <AvatarFallback className="bg-primary/20 text-4xl">
                                            {getInitials(student.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <Button variant="outline" size="sm" onClick={() => navigate("/student/create-avatar")}>
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit Avatar
                                    </Button>
                                </div>

                                {/* Account Details */}
                                <div className="flex-1 space-y-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-foreground mb-1">{student.name}</h2>
                                        <Badge variant="outline" className="mt-2">Student</Badge>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Student ID */}
                                        <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                                            <User className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-muted-foreground">Student ID</p>
                                                <p className="text-foreground font-mono text-sm">{student.id}</p>
                                            </div>
                                        </div>

                                        {/* Interests */}
                                        <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                                            <Heart className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-muted-foreground">Interests & Hobbies</p>
                                                <p className="text-foreground">{student.interests}</p>
                                            </div>
                                        </div>

                                        {/* Member Since */}
                                        <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                                            <Mail className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                                                <p className="text-foreground">
                                                    {new Date(student.created_at).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Danger Zone */}
                    <Card className="backdrop-blur-lg bg-card/70 border-2 border-destructive/50">
                        <CardHeader>
                            <CardTitle className="text-destructive">Danger Zone</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Once you delete your account, there is no going back. This will permanently delete your profile, remove you from all classrooms, and erase all your data.
                            </p>

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" className="w-full md:w-auto">
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Account
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete your account
                                            and remove your data from our servers. You will be removed from all classrooms
                                            and lose access to all stories.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleDeleteAccount}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                            Yes, Delete My Account
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
};

export default StudentProfile;
