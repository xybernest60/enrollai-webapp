
import AdminLayout from "@/components/admin/admin-layout";
import { StudentsTable } from "@/components/admin/students-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default async function StudentsPage() {

  const { data: students, error } = await supabase.from('students').select('*').order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching students", error);
  }


  return (
    <AdminLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex justify-center text-center">
          <div className="flex flex-col items-center space-y-2">
            <Logo />
            <div className="pt-2">
                <h2 className="text-3xl font-bold tracking-tight font-headline">
                Student Management
                </h2>
                <p className="text-muted-foreground">
                    View, edit, and manage all student records.
                </p>
            </div>
           <div className="flex items-center space-x-2 pt-4">
              <Button asChild>
                <Link href="/enroll">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add New Student
                </Link>
              </Button>
            </div>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Student Roster</CardTitle>
            <CardDescription>
              A list of all students currently enrolled in the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StudentsTable students={students ?? []} />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
