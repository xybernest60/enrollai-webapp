
import AdminLayout from "@/components/admin/admin-layout";
import { SessionManager } from "@/components/admin/session-manager";
import { Logo } from "@/components/logo";
import { supabase } from "@/lib/supabase/client";

export default async function SessionsPage() {

    const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('id, name');

    const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
            *,
            classes (
                name
            )
        `)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

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

                <SessionManager 
                    classes={classes ?? []} 
                    sessions={sessions ?? []} 
                />

            </div>
        </AdminLayout>
    )
}
