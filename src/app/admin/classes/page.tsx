
import AdminLayout from "@/components/admin/admin-layout";
import { ClassManager } from "@/components/admin/class-manager";
import { Logo } from "@/components/logo";
import { supabase } from "@/lib/supabase/admin";

export default async function ClassesPage() {
    const { data: classes, error } = await supabase
        .from('classes')
        .select('*')
        .order('name', { ascending: true });

    if (error) {
        console.error("Error fetching classes:", error.message);
    }

    return (
        <AdminLayout>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex justify-center text-center">
                    <div className="flex flex-col items-center space-y-2">
                        <Logo />
                        <div className="pt-2">
                            <h2 className="text-3xl font-bold tracking-tight font-headline">
                                Class Management
                            </h2>
                            <p className="text-muted-foreground">
                                Create and manage classes for your institution.
                            </p>
                        </div>
                    </div>
                </div>

                <ClassManager classes={classes ?? []} />
            </div>
        </AdminLayout>
    );
}
