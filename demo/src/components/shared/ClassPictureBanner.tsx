import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ClassPictureBannerProps {
  students: Array<{
    id: string;
    name: string;
    avatar_url: string | null;
    avatar_thumbnail_url: string | null;
  }>;
  className?: string;
}

export function ClassPictureBanner({ students, className = "" }: ClassPictureBannerProps) {
  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className={`rounded-lg border bg-card p-4 sm:p-6 ${className}`}>
      <h2 className="mb-4 font-serif text-2xl font-semibold text-foreground">Classmates</h2>
      <div className="flex flex-wrap gap-2">
        <TooltipProvider>
          {students.map((student) => (
            <Tooltip key={student.id}>
              <TooltipTrigger>
                <Avatar className="w-[60px] h-[60px] border-3 border-background">
                  {student.avatar_thumbnail_url || student.avatar_url ? (
                    <img
                      src={student.avatar_thumbnail_url || student.avatar_url || undefined}
                      alt={`${student.name} avatar`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <AvatarFallback className="bg-primary/20">
                      {getInitials(student.name)}
                    </AvatarFallback>
                  )}
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
