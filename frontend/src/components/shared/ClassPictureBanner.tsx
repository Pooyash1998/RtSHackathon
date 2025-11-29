import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ClassPictureBannerProps {
  students: Array<{
    id: string;
    name: string;
    avatar_url: string | null;
  }>;
  className?: string;
}

export function ClassPictureBanner({ students, className = "" }: ClassPictureBannerProps) {
  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className={`backdrop-blur-lg bg-card/70 border border-border/50 rounded-lg p-4 ${className}`}>
      <h3 className="text-sm font-semibold mb-3 text-foreground">Class Picture</h3>
      <div className="flex flex-wrap gap-2">
        <TooltipProvider>
          {students.map((student) => (
            <Tooltip key={student.id}>
              <TooltipTrigger>
                <Avatar className="w-[60px] h-[60px] border-3 border-background">
                  <AvatarImage src={student.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20">
                    {getInitials(student.name)}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>{student.name}</TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
    </div>
  );
}
