
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatInTimeZone } from 'date-fns-tz';
import { ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type ReportData = {
    student_id: string;
    student_name: string;
    student_image_url: string | null;
    status: 'on-time' | 'late' | 'absent';
    checkin_time: string | null;
    verified_by_face: boolean;
};

type AttendanceReportTableProps = {
    reportData: ReportData[];
};

export function AttendanceReportTable({ reportData }: AttendanceReportTableProps) {
  const formatTime = (dateTimeString: string | null) => {
    if (!dateTimeString) return '—';
    // Display time in the user's local timezone
    return formatInTimeZone(new Date(dateTimeString), Intl.DateTimeFormat().resolvedOptions().timeZone, 'HH:mm:ss');
  };
  
  const getStatusClass = (status: ReportData['status']) => {
    switch (status) {
      case 'on-time': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700';
      case 'late': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700';
      case 'absent': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700';
    }
  }


  return (
    <Card>
        <CardHeader>
            <CardTitle>Detailed Log</CardTitle>
            <CardDescription>A list of all students for this session and their status.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="border rounded-md">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Check-in Time</TableHead>
                    <TableHead className="text-center">Face Verified</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {reportData.length === 0 && (
                    <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        No records to display.
                    </TableCell>
                    </TableRow>
                )}
                {reportData.map((record) => (
                    <TableRow key={record.student_id}>
                    <TableCell>
                        <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={record.student_image_url ?? undefined} alt={record.student_name} />
                            <AvatarFallback>{record.student_name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{record.student_name}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline" className={cn("capitalize", getStatusClass(record.status))}>
                            {record.status}
                        </Badge>
                    </TableCell>
                    <TableCell>
                        {formatTime(record.checkin_time)}
                    </TableCell>
                    <TableCell className="text-center">
                        {record.checkin_time && (
                            record.verified_by_face ? (
                                <ShieldCheck className="h-5 w-5 text-blue-500 mx-auto" />
                            ) : (
                                <span className="text-muted-foreground text-xs">RFID Only</span>
                            )
                        )}
                         {record.status === 'absent' && '—'}
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </div>
        </CardContent>
    </Card>
  );
}
