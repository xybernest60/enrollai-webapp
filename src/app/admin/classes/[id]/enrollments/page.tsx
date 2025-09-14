
import AdminLayout from "@/components/admin/admin-layout";
import { EnrollmentManager } from "@/components/admin/enrollment-manager";
import { Logo } from "@/components/logo";
import { supabase } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";

export default async function EnrollmentPage({ params }: { params: { id: string } }) {
    const classId = params.id;

    // Fetch the class details
    const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('id, name')
        .eq('id', classId)
        .single();

    if (classError || !classData) {
        console.error("Error fetching class:", classError?.message);
        notFound();
    }

    // Fetch all students
    const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, name, image_url')
        .order('name', { ascending: true });

    // Fetch current enrollments for this class
    const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('student_id')
        .eq('class_id', classId);

    if (studentsError) console.error("Error fetching students:", studentsError.message);
    if (enrollmentsError) console.error("Error fetching enrollments:", enrollmentsError.message);

    const enrolledStudentIds = new Set(enrollments?.map(e => e.student_id) ?? []);

    return (
        <AdminLayout>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                 <div className="flex justify-center text-center">
                    <div className="flex flex-col items-center space-y-2">
                        <Logo />
                        <div className="pt-2">
                            <h2 className="text-3xl font-bold tracking-tight font-headline">
                                Manage Enrollments
                            </h2>
                            <p className="text-muted-foreground text-xl">
                                For class: <span className="font-semibold text-primary">{classData.name}</span>
                            </p>
                        </div>
                    </div>
                </div>
                
                <EnrollmentManager 
                    classId={classData.id}
                    students={students ?? []}
                    enrolledStudentIds={enrolledStudentIds}
                />
            </div>
        </AdminLayout>
    );
}
