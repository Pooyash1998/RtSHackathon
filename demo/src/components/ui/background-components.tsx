import { cn } from "@/lib/utils";

interface BackgroundComponentProps {
    children?: React.ReactNode;
    className?: string;
}

export const BackgroundComponent = ({ children, className }: BackgroundComponentProps) => {
    return (
        <div className={cn("min-h-screen w-full bg-background", className)}>
            {children}
        </div>
    );
};
