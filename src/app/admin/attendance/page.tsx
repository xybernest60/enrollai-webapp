import AdminLayout from "@/components/admin/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { AttendanceTable } from "@/components/admin/attendance-table";
import { Logo } from "@/components/logo";

export default async function AttendancePage() {
    const { data: attendance, error } = await supabase
      .from('attendance')
      .select(`
        *,
        students (
          name,
          image_url
        )
      `)
      .order('checkin_time', { ascending: false });
  
    if (error) {
      console.error('Error fetching attendance:', error);
    }
  
    return (
      <AdminLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex justify-center text-center">
            <div className="flex flex-col items-center space-y-2">
                <Logo />
                <div className="pt-2">
                    <h2 className="text-3xl font-bold tracking-tight font-headline">
                    Attendance Records
                    </h2>
                </div>
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Daily Log</CardTitle>
              <CardDescription>
                A log of all student check-ins.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AttendanceTable attendance={attendance ?? []} />
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }
  