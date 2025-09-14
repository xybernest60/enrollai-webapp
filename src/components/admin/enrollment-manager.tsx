
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Checkbox } from "../ui/checkbox";
import { updateEnrollments } from "@/lib/actions";
import { Loader2 } from "lucide-react";

type Student = { id: string; name: string; image_url: string | null };
type EnrollmentManagerProps = {
  classId: string;
  students: Student[];
  enrolledStudentIds: Set<string>;
};

export function EnrollmentManager({ classId, students, enrolledStudentIds }: EnrollmentManagerProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(enrolledStudentIds);

  const handleCheckboxChange = (studentId: string) => {
    setSelectedStudents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const handleSaveChanges = () => {
    startTransition(async () => {
      const result = await updateEnrollments(classId, Array.from(selectedStudents));
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Enrollments updated successfully.",
        });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Roster</CardTitle>
        <CardDescription>Select the students to enroll in this class.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="w-[80px]">Enrolled</TableHead>
                    <TableHead>Student</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                    {students.length === 0 && <TableRow><TableCell colSpan={2} className="text-center h-24">No students found in the system.</TableCell></TableRow>}
                    {students.map(student => (
                        <TableRow key={student.id} >
                             <TableCell className="text-center">
                                <Checkbox
                                    id={`student-${student.id}`}
                                    checked={selectedStudents.has(student.id)}
                                    onCheckedChange={() => handleCheckboxChange(student.id)}
                                    aria-label={`Select ${student.name}`}
                                />
                            </TableCell>
                            <TableCell>
                                <label htmlFor={`student-${student.id}`} className="flex items-center gap-3 cursor-pointer">
                                    <Avatar>
                                        <AvatarImage src={student.image_url ?? undefined} alt={student.name} />
                                        <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">{student.name}</span>
                                </label>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
        <div className="flex justify-end mt-6">
            <Button onClick={handleSaveChanges} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
