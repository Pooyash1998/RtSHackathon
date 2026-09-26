import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { BookOpen, CheckCircle, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import type { ChapterPreview } from "@/types/story";

const StudentAllStories = () => {
    const { studentId } = useParams();
    const [chapters, setChapters] = useState<ChapterPreview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        const loadChapters = async () => {
            if (!studentId) return;

            setIsLoading(true);
            setLoadError(null);
            try {
                const response = await api.students.getChapters(studentId);
                setChapters((response.chapters || []).filter(chapter => chapter.status === "ready"));
            } catch {
                toast.error("Failed to load stories");
                setLoadError("Failed to load stories. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };

        loadChapters();
    }, [studentId]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center space-y-4">
                    <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
                    <p className="text-muted-foreground">Loading stories...</p>
                </div>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p role="alert" className="text-destructive">{loadError}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <div className="container mx-auto max-w-6xl px-4 py-8 sm:py-12">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <p className="mb-2 font-mono text-xs font-bold tracking-wide text-primary">STUDENT LIBRARY</p>
                    <h1 className="mb-3 font-serif text-4xl font-semibold tracking-tight text-foreground">
                        All Stories
                    </h1>
                    <p className="text-muted-foreground">
                        Browse all your stories across all classrooms
                    </p>
                </motion.div>

                {/* Stories Grid */}
                {chapters.length === 0 ? (
                    <Card>
                        <CardContent className="pt-12 pb-12 text-center">
                            <p className="text-muted-foreground">
                                No stories available yet.
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
                                transition={{ duration: 0.3, delay: idx * 0.1 }}
                                className="h-full"
                            >
                                <Card className="flex h-full flex-col">
                                    <CardContent className="flex h-full flex-col">
                                        <div className="flex h-48 w-full flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-foreground/15 bg-muted">
                                            {chapter.thumbnail_url ? (
                                                <img
                                                    src={chapter.thumbnail_url}
                                                    alt={`${chapter.story_title} story preview`}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <BookOpen className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                                            )}
                                        </div>

                                        <div className="flex-1 flex flex-col justify-between mt-4">
                                            <div>
                                                <h3 className="mb-2 min-h-[3.5rem] font-serif text-xl font-semibold text-foreground">
                                                    {chapter.story_title || `Chapter ${chapter.index}`}
                                                </h3>

                                                {/* Classroom badge */}
                                                {chapter.classroom_name && (
                                                    <div className="mb-3">
                                                        <Badge
                                                            variant="outline"
                                                        >
                                                            {chapter.classroom_name}
                                                        </Badge>
                                                    </div>
                                                )}

                                                <p className="text-sm text-muted-foreground mb-3 min-h-[2.5rem]">
                                                    {chapter.story_description}
                                                </p>

                                                <p className="text-xs text-muted-foreground mb-3">
                                                    Created on {new Date(chapter.created_at).toLocaleDateString()}
                                                </p>

                                                <div className="flex gap-2 flex-wrap mb-4">
                                                    <Badge className="border-green-700 bg-green-700 text-white">
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        {chapter.status.replace(/_/g, " ")}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <Button asChild className="w-full mt-auto">
                                                <Link to={`/student/story/${chapter.id}/${studentId}`}>
                                                    <BookOpen className="w-4 h-4 mr-2" />
                                                    Read Story
                                                </Link>
                                            </Button>
                                        </div>
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

export default StudentAllStories;
