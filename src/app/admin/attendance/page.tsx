
import AdminLayout from "@/components/admin/admin-layout";
import { supabase } from "@/lib/supabase/admin";
import { Logo } from "@/components/logo";
import { AttendanceReport } from "@/components/admin/attendance/attendance-report";

export default async function AttendancePage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {

    const classId = searchParams?.classId as string | undefined;
    const sessionId = searchParams?.sessionId as string | undefined;
    const date = searchParams?.date as string | undefined;

    // Fetch all classes for the filter dropdown
    const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('id, name')
        .order('name');
    
    if (classesError) {
        console.error("Error fetching classes:", classesError.message);
    }
    
    return (
      <AdminLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex justify-center text-center">
            <div className="flex flex-col items-center space-y-2">
                <Logo />
                <div className="pt-2">
                    <h2 className="text-3xl font-bold tracking-tight font-headline">
                    Attendance Report
                    </h2>
                    <p className="text-muted-foreground">
                        Analyze attendance records for specific sessions and dates.
                    </p>
                </div>
            </div>
          </div>
          
          <AttendanceReport 
            classes={classes ?? []}
            initialClassId={classId}
            initialSessionId={sessionId}
            initialDate={date}
          />
          
        </div>
      </AdminLayout>
    );
}
