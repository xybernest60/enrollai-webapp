import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
  import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
  import { Badge } from "@/components/ui/badge";
  import { CheckCircle, ShieldCheck } from "lucide-react";
  
  type AttendanceRecord = {
    id: string;
    checkin_time: string;
    status: string;
    verified_by_face: boolean;
    students: {
      name: string;
      image_url: string | null;
    } | null;
  };
  
  export function AttendanceTable({ attendance }: { attendance: AttendanceRecord[] }) {
    
    const formatDateTime = (dateTimeString: string) => {
      return new Date(dateTimeString).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    }
  
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Check-in Time</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-center">Face Verified</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attendance.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                No attendance records yet.
              </TableCell>
            </TableRow>
          )}
          {attendance.map((record) => (
            <TableRow key={record.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={record.students?.image_url ?? undefined} alt={record.students?.name} />
                    <AvatarFallback>{record.students?.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{record.students?.name ?? 'Unknown Student'}</span>
                </div>
              </TableCell>
              <TableCell>
                {formatDateTime(record.checkin_time)}
              </TableCell>
              <TableCell>
                <Badge 
                  variant={record.status === "present" ? "default" : "destructive"}
                  className={record.status === "present" ? "bg-green-600" : ""}
                >
                  {record.status}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                {record.verified_by_face ? (
                  <ShieldCheck className="h-5 w-5 text-blue-500 mx-auto" />
                ) : (
                  <span className="text-muted-foreground text-xs">RFID Only</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }
  