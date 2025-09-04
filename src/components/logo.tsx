
import { cn } from "@/lib/utils";
import { GraduationCap } from "lucide-react";
import Link from "next/link";

type LogoProps = {
  className?: string;
  isLink?: boolean;
  href?: string;
};

export const Logo = ({ className, isLink = false, href = "/" }: LogoProps) => {

  const content = (
    <div className={cn("flex items-center gap-3 group/logo", className)}>
      <GraduationCap className="h-12 w-12 text-primary shrink-0" />
      <div className={cn("flex flex-col")}>
        <span className="font-headline text-2xl font-bold text-primary leading-tight">
          EnrollAI
        </span>
        <span className="text-sm font-medium text-muted-foreground leading-tight">
          Student Management
        </span>
      </div>
    </div>
  );

  if (isLink) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
};
