import { EnrollmentWizard } from "@/components/enrollment/enrollment-wizard";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Logo } from "@/components/logo";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function EnrollPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <Button
        variant="ghost"
        asChild
        className="absolute top-4 left-4"
      >
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>
      <div className="w-full max-w-2xl">
        <Card className="overflow-hidden">
            <EnrollmentWizard />
        </Card>
      </div>
    </div>
  );
}
