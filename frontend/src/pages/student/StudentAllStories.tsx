import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { BookOpen, CheckCircle, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

const StudentAllStories = () => {
    const { studentId } = useParams();
    const [chapters, setChapters] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadChapters = async () => {
            if (!studentId) return;

            setIsLoading(true);
            try {
                const response = await api.students.getChapters(studentId);
                setChapters(response.chapters || []);
            } catch (error) {
                console.error("Failed to load chapters:", error);
                toast.error("Failed to load stories");
            } finally {
                setIsLoading(false);
            }
        };

        loadChapters();
    }, [studentId]);

    const subjectColors: Record<string, string> = {
        Physics: "bg-blue-500",
        Math: "bg-purple-500",
        History: "bg-amber-500",
        English: "bg-green-500",
        Chemistry: "bg-cyan-500",
        Biology: "bg-emerald-500"
    };

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

    return (
        <div className="min-h-screen bg-muted/20">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl font-bold text-foreground mb-3">
                        All Stories
                    </h1>
                    <p className="text-muted-foreground">
                        Browse all your stories across all classrooms
                    </p>
                </motion.div>

                {/* Stories Grid */}
                {chapters.length === 0 ? (
                    <Card className="backdrop-blur-lg bg-card/70 border-border/50">
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
                                <Card className="backdrop-blur-lg bg-card/70 border-2 border-border/50 hover:bg-card/80 transition-all hover:shadow-xl hover:scale-[1.02] h-full flex flex-col">
                                    <CardContent className="pt-6 flex flex-col h-full">
                                        <div className="w-full h-48 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center border border-border/30 overflow-hidden flex-shrink-0">
                                            {chapter.thumbnail_url ? (
                                                <img src={chapter.thumbnail_url} alt={`Chapter ${chapter.index}`} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-5xl">📚</span>
                                            )}
                                        </div>

                                        <div className="flex-1 flex flex-col justify-between mt-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-2 min-h-[3.5rem]">
                                                    {chapter.story_title || `Chapter ${chapter.index}`}
                                                </h3>

                                                {/* Classroom badge */}
                                                {chapter.classroom_name && (
                                                    <div className="mb-3">
                                                        <Badge
                                                            className={`${subjectColors[chapter.classroom_subject] || 'bg-gray-500'} text-white`}
                                                        >
                                                            {chapter.classroom_name}
                                                        </Badge>
                                                    </div>
                                                )}

                                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2 min-h-[2.5rem]">
                                                    {chapter.chapter_outline || chapter.original_prompt}
                                                </p>

                                                <p className="text-xs text-muted-foreground mb-3">
                                                    Created on {new Date(chapter.created_at).toLocaleDateString()}
                                                </p>

                                                <div className="flex gap-2 flex-wrap mb-4">
                                                    <Badge className="bg-green-500/80 text-white backdrop-blur-sm">
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        Completed
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
