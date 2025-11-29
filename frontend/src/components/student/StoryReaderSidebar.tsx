import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StoryReaderSidebarProps {
  studentId: string;
  storyId: string;
  storyTitle: string;
  onBack: () => void;
}

export function StoryReaderSidebar({ studentId, storyId, storyTitle, onBack }: StoryReaderSidebarProps) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      {/* Hover trigger zone */}
      <div
        className="fixed left-0 top-0 bottom-0 w-5 z-40"
        onMouseEnter={() => setVisible(true)}
      />

      {/* Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: visible ? 0 : -300 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed left-0 top-0 bottom-0 w-[300px] bg-background/95 backdrop-blur-lg border-r border-border/50 z-50 shadow-xl"
        onMouseLeave={() => setVisible(false)}
      >
        <div className="p-6 space-y-6">
          <Button variant="ghost" onClick={onBack} className="w-full justify-start">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Classroom
          </Button>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Reading
            </h3>
            <h2 className="text-xl font-bold text-foreground">{storyTitle}</h2>
          </div>

          <div className="pt-4 border-t border-border/30">
            <p className="text-sm text-muted-foreground">
              Scroll down to read all panels
            </p>
          </div>
        </div>
      </motion.div>
    </>
  );
}
