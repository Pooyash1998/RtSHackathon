import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { User, Mail, Heart } from "lucide-react";
import api from "@/lib/api";
import { isDemoMode } from "@/lib/runtime";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Student = Awaited<ReturnType<typeof api.students.getById>>["student"];

const StudentProfile = () => {
    const { studentId } = useParams();
    const [student, setStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [avatarError, setAvatarError] = useState<string | null>(null);
    const [avatarMessage, setAvatarMessage] = useState<string | null>(null);
    const [generatingAvatar, setGeneratingAvatar] = useState(false);
    const [portrait, setPortrait] = useState<File>();
    const [portraitInputVersion, setPortraitInputVersion] = useState(0);
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState({ name: "", interests: "" });
    const [profileMessage, setProfileMessage] = useState("");

    useEffect(() => {
        if (!studentId) return;
        const loadStudentData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.students.getById(studentId);
            setStudent(response.student);
        } catch {
            setError("Failed to load student profile");
        } finally {
            setLoading(false);
        }
        };
        loadStudentData();
    }, [studentId]);

    const getInitials = (name: string) =>
        name.split(' ').map(n => n[0]).join('').toUpperCase();

    const retryAvatar = async () => {
        if (!studentId) return;
        setGeneratingAvatar(true);
        setAvatarError(null);
        setAvatarMessage(null);
        try {
            const response = await api.avatar.create(studentId, portrait);
            setStudent(response.student);
            setPortrait(undefined);
            setPortraitInputVersion((version) => version + 1);
            setAvatarMessage("Avatar updated.");
        } catch {
            setAvatarError("Avatar generation failed. Please try again.");
        } finally {
            setGeneratingAvatar(false);
        }
    };

    const saveProfile = async () => {
        if (!studentId) return;
        setProfileMessage("");
        try {
            const response = await api.students.update(studentId, draft);
            setStudent(response.student);
            setEditing(false);
        } catch {
            setProfileMessage("Profile could not be saved. Your changes are still shown.");
        }
    };

    const eraseProfile = async () => {
        if (!studentId) return;
        try {
            await api.students.erase(studentId);
            setProfileMessage("Profile and personal data erased.");
        } catch {
            setProfileMessage("Erasure is incomplete. Retry to finish local file cleanup.");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    if (error || !student) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-destructive">{error || "Student not found"}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <div className="container mx-auto max-w-4xl px-4 py-8 sm:py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <p className="mb-2 font-mono text-xs font-bold tracking-wide text-primary">STUDENT PROFILE</p>
                    <h1 className="mb-8 font-serif text-4xl font-semibold tracking-tight text-foreground">My Profile</h1>

                    {/* Profile Card */}
                    <Card className="mb-6">
                        <CardContent className="py-8">
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                {/* Avatar Section */}
                                <div className="flex flex-col items-center space-y-4">
                                    <Avatar className="w-32 h-32 border-4 border-primary/20">
                                        <AvatarImage src={student.avatar_url || undefined} alt={`${student.name} avatar`} />
                                        <AvatarFallback className="bg-primary/20 text-4xl">
                                            {getInitials(student.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    {!isDemoMode && <div className="max-w-60 space-y-2">
                                        <Label htmlFor="profile-portrait">Portrait photo (optional)</Label>
                                        <Input
                                            id="profile-portrait"
                                            key={portraitInputVersion}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={(event) => setPortrait(event.target.files?.[0])}
                                            disabled={generatingAvatar}
                                        />
                                        <p className="text-center text-xs text-muted-foreground">
                                            If selected, this image is sent to Black Forest Labs for avatar generation and is not kept by EduComic after the request.
                                        </p>
                                    </div>}
                                    {!isDemoMode && <Button variant="outline" size="sm" onClick={retryAvatar} disabled={generatingAvatar}>
                                        {generatingAvatar ? "Generating avatar..." : student.avatar_url ? "Regenerate avatar" : "Try avatar again"}
                                    </Button>}
                                    {!isDemoMode && student.avatar_url && <p className="max-w-52 text-center text-xs text-muted-foreground">Your current avatar stays visible until a replacement succeeds.</p>}
                                    {!isDemoMode && avatarMessage && <p role="status" className="text-sm text-muted-foreground">{avatarMessage}</p>}
                                    {!isDemoMode && avatarError && <p role="alert" className="text-sm text-destructive">{avatarError}</p>}
                                </div>

                                {/* Local profile details */}
                                <div className="flex-1 space-y-6">
                                    <div>
                                        <h2 className="mb-1 font-serif text-2xl font-semibold text-foreground">{student.name}</h2>
                                        <Badge variant="outline" className="mt-2">Student</Badge>
                                        {!isDemoMode && <Button variant="outline" className="ml-3" onClick={() => { setDraft({ name: student.name, interests: student.interests }); setEditing(true); }}>Edit profile</Button>}
                                    </div>

                                    {!isDemoMode && editing && <form className="space-y-3 rounded-lg border p-4" onSubmit={(event) => { event.preventDefault(); void saveProfile(); }}>
                                        <label>Name<Input required maxLength={100} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
                                        <label>Interests<Input required maxLength={500} value={draft.interests} onChange={(event) => setDraft({ ...draft, interests: event.target.value })} /></label>
                                        <Button type="submit">Save profile</Button>
                                    </form>}

                                    <div className="space-y-4">
                                        {/* Student ID */}
                                        <div className="flex items-start gap-3 border-t py-4">
                                            <User className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-muted-foreground">Student ID</p>
                                                <p className="text-foreground font-mono text-sm">{student.id}</p>
                                            </div>
                                        </div>

                                        {/* Interests */}
                                        <div className="flex items-start gap-3 border-t py-4">
                                            <Heart className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-muted-foreground">Interests & Hobbies</p>
                                                <p className="text-foreground">{student.interests}</p>
                                            </div>
                                        </div>

                                        {/* Member Since */}
                                        <div className="flex items-start gap-3 border-y py-4">
                                            <Mail className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-muted-foreground">Profile Created</p>
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

                    {!isDemoMode && <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive">Erase profile and personal data</Button></AlertDialogTrigger>
                        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Erase all personal data?</AlertDialogTitle>
                            <AlertDialogDescription>This removes the profile, classroom memberships, source photo, avatar, and other student-owned files. Completed stories and their artwork remain unchanged.</AlertDialogDescription>
                        </AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={eraseProfile}>Confirm full erasure</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                    </AlertDialog>}
                    {!isDemoMode && profileMessage && <p role="status" className="mt-3 rounded-md border bg-card p-3 text-sm">{profileMessage}</p>}

                </motion.div>
            </div>
        </div>
    );
};

export default StudentProfile;
