
import AdminLayout from "@/components/admin/admin-layout";
import { SessionManager } from "@/components/admin/session-manager";
import { Logo } from "@/components/logo";
import { supabase } from "@/lib/supabase/admin";
import { SessionsToolbar } from "@/components/admin/sessions-toolbar";

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {

    const classId = searchParams?.class as string | undefined;
    const sortBy = searchParams?.sort as string | undefined;

    const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('id, name');

    let sessionsQuery = supabase
        .from('sessions')
        .select(`
            *,
            classes (
                name
            )
        `);

    if (classId) {
        sessionsQuery = sessionsQuery.eq('class_id', classId);
    }

    const [sortField, sortOrder] = sortBy?.split('-') || ['day_of_week', 'asc'];
    sessionsQuery = sessionsQuery.order(sortField, { ascending: sortOrder === 'asc' });


    const { data: sessions, error: sessionsError } = await sessionsQuery;

    if (classesError) console.error("Error fetching classes:", classesError.message);
    if (sessionsError) console.error("Error fetching sessions:", sessionsError.message);

    return (
        <AdminLayout>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex justify-center text-center">
                    <div className="flex flex-col items-center space-y-2">
                        <Logo />
                        <div className="pt-2">
                            <h2 className="text-3xl font-bold tracking-tight font-headline">
                                Session Management
                            </h2>
                            <p className="text-muted-foreground">
                                Create and manage attendance sessions for your classes.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-8 md:grid-cols-3">
                    <div className="md:col-span-1">
                        <SessionManager classes={classes ?? []} />
                    </div>
                    <div className="md:col-span-2">
                        <div className="space-y-4">
                            <SessionsToolbar classes={classes ?? []} />
                            <SessionManager sessions={sessions ?? []} showForm={false} />
                        </div>
                    </div>
                </div>

            </div>
        </AdminLayout>
    )
}
