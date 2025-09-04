
import AdminLayout from '@/components/admin/admin-layout';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StudentsTable } from '@/components/admin/students-table';
import Link from 'next/link';
import { ArrowRight, UserPlus, Users, CalendarCheck, LogIn } from 'lucide-react';
import { Logo } from '@/components/logo';

const featureCards = [
    {
        title: 'Check-In Kiosk',
        description: 'Launch the student-facing check-in screen.',
        href: '/check-in',
        icon: LogIn,
    },
    {
        title: 'Enroll New Student',
        description: 'Add a new student with RFID and face scan.',
        href: '/enroll',
        icon: UserPlus,
    },
    {
        title: 'Manage Students',
        description: 'View and edit the records of all enrolled students.',
        href: '/admin/students',
        icon: Users,
    },
    {
        title: 'Track Attendance',
        description: 'Monitor daily check-ins and generate reports.',
        href: '/admin/attendance',
        icon: CalendarCheck,
    },
];

export default async function AdminDashboard() {

  const { data: students, error } = await supabase.from('students').select('*').order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching students", error);
  }

  return (
    <AdminLayout>
       <main className="flex-1 space-y-8 p-4 sm:p-6 md:p-8">
        <div className="flex justify-center text-center">
          <div className="flex flex-col items-center space-y-2">
            <Logo />
            <div className="pt-2">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight font-headline">
                Admin Dashboard
              </h2>
              <p className="text-muted-foreground mt-1">
                  Welcome to EnrollAI. Here's an overview of your system.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
            {featureCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.title} href={card.href} className="group">
                  <Card className="h-full transform transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-2xl hover:bg-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xl font-headline font-semibold">
                            {card.title}
                        </CardTitle>
                        <Icon className="h-8 w-8 text-primary transition-transform duration-300 group-hover:scale-110" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{card.description}</p>
                    </CardContent>
                    <CardContent className="pt-2">
                          <p className="text-sm font-medium text-primary flex items-center">
                            Go to section <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </p>
                    </CardContent>
                  </Card>
                </Link>
            )})}
        </div>

        <Card>
          <CardHeader>
             <h3 className="font-semibold text-xl font-headline">Recently Enrolled Students</h3>
             <p className="text-sm text-muted-foreground">A quick look at the latest student enrollments.</p>
          </CardHeader>
          <CardContent>
            <StudentsTable students={students?.slice(0, 5) ?? []} />
          </CardContent>
        </Card>
      </main>
    </AdminLayout>
  );
}
