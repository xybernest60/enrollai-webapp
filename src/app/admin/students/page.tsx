
import AdminLayout from "@/components/admin/admin-layout";
import { StudentsTable } from "@/components/admin/students-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/admin";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { StudentsToolbar } from "@/components/admin/students-toolbar";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const classId = searchParams?.class as string | undefined;
  const sortBy = searchParams?.sort as string | undefined;
  const query = searchParams?.q as string | undefined;

  let studentQuery = supabase.from('students').select(`
      *,
      enrollments (
        classes (
          id,
          name
        )
      )
    `);

  if (classId) {
    // This is tricky with the many-to-many. We need to filter students who have an enrollment for the given classId.
    // The RPC approach is better for complex filters, but for this, a text search on the join might work if performance is not critical.
    // Or, more correctly, filter on the join table.
     studentQuery = supabase.from('students').select(`
      *,
      enrollments!inner (
        classes (
          id,
          name
        )
      )
    `).eq('enrollments.class_id', classId);
  }

  if (query) {
    studentQuery = studentQuery.ilike('name', `%${query}%`);
  }

  const [sortField, sortOrder] = sortBy?.split('-') || ['created_at', 'desc'];
  studentQuery = studentQuery.order(sortField, { ascending: sortOrder === 'asc' });

  const { data: students, error } = await studentQuery;

  if (error) {
    console.error("Error fetching students", error);
  }

  // Due to the join, a student might appear multiple times if enrolled in multiple classes.
  // We need to group the enrollments for each unique student.
  const studentMap = new Map();
  if (students) {
    students.forEach(student => {
      const existingStudent = studentMap.get(student.id);
      if (existingStudent) {
        // If student is already in the map, just add the new enrollment info
        if (student.enrollments) {
           const newEnrollments = Array.isArray(student.enrollments) ? student.enrollments : [student.enrollments];
           existingStudent.enrollments.push(...newEnrollments);
        }
      } else {
        // If student is not in the map, add them
        const newEnrollments = student.enrollments ? (Array.isArray(student.enrollments) ? student.enrollments : [student.enrollments]) : [];
        studentMap.set(student.id, { ...student, enrollments: newEnrollments });
      }
    });
  }
  const uniqueStudents = Array.from(studentMap.values());


  // Fetch all classes for the filter dropdown
  const { data: classes, error: classesError } = await supabase.from('classes').select('id, name');

  if (classesError) {
    console.error("Error fetching classes", classesError);
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
              Filter, sort, and manage all students currently in the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StudentsToolbar classes={classes ?? []} />
            <StudentsTable students={uniqueStudents} />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
