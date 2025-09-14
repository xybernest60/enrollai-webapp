
"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2, CreditCard, User, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase/client";
import Image from 'next/image';
import { updateStudent } from "@/lib/actions";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

type Enrollment = {
    classes: {
        id: string;
        name: string;
    } | null;
} | {
    classes: {
        id: string;
        name: string;
    } | null;
}[];

type Student = {
  id: string;
  name: string;
  rfid_uid: string | null;
  image_url: string | null;
  created_at: string;
  face_embedding: any;
  enrollments: Enrollment;
};

export function StudentsTable({ students: initialStudents }: { students: Student[] }) {
  const [students, setStudents] = useState(initialStudents);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editedName, setEditedName] = useState("");
  const [editedRfid, setEditedRfid] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    setStudents(initialStudents);
  }, [initialStudents]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleDeleteClick = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };
  
  const handleEditClick = (student: Student) => {
    setSelectedStudent(student);
    setEditedName(student.name);
    setEditedRfid(student.rfid_uid || "");
    setIsEditDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedStudent) return;

    const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', selectedStudent.id);

    if (error) {
        toast({
            title: "Deletion Failed",
            description: `Could not delete ${selectedStudent.name}. Reason: ${error.message}`,
            variant: "destructive",
        });
        console.error("Error deleting student:", error);
    } else {
        toast({
            title: "Student Deleted",
            description: `${selectedStudent.name} has been removed from the system.`,
        });
        setStudents((prevStudents) => prevStudents.filter(s => s.id !== selectedStudent.id));
    }
    
    setIsDeleteDialogOpen(false);
    setSelectedStudent(null);
  };

  const handleEditConfirm = async () => {
    if (!selectedStudent) return;
    setIsSubmitting(true);

    const result = await updateStudent(selectedStudent.id, {
        name: editedName,
        rfid_uid: editedRfid,
        original_rfid_uid: selectedStudent.rfid_uid,
        image_url: selectedStudent.image_url,
    });

    if (result.error) {
        toast({ title: "Update Failed", description: result.error, variant: "destructive" });
    } else {
        toast({ title: "Success!", description: "Student details updated." });
        setStudents(prev => prev.map(s => s.id === selectedStudent.id ? { ...s, name: editedName, rfid_uid: editedRfid } : s));
        setIsEditDialogOpen(false);
        setSelectedStudent(null);
    }
    setIsSubmitting(false);
  };

  const getEnrolledClasses = (enrollments: Enrollment) => {
    if (!enrollments) return [];
    const enrollmentsArray = Array.isArray(enrollments) ? enrollments : [enrollments];
    
    // Use a map to handle cases where a student is enrolled multiple times in the same class in the query result
    const classMap = new Map<string, string>();
    enrollmentsArray.forEach(e => {
        if (e.classes) {
            classMap.set(e.classes.id, e.classes.name);
        }
    });
    return Array.from(classMap.values());
  }

  return (
    <>
      <div className="border rounded-md mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Student</TableHead>
              <TableHead>RFID UID</TableHead>
              <TableHead>Enrolled In</TableHead>
              <TableHead>Enrolled On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No students match the current filters.
                </TableCell>
              </TableRow>
            )}
            {students.map((student) => {
              const enrolledClasses = getEnrolledClasses(student.enrollments);
              return (
              <TableRow key={student.id}>
                <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            {student.image_url ? (
                            <Image
                                src={student.image_url}
                                alt={student.name}
                                width={40}
                                height={40}
                                className="rounded-full object-cover"
                                data-ai-hint="student photo"
                            />
                            ) : (
                            <AvatarFallback>
                                {student.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                            )}
                        </Avatar>
                         <span className="font-medium">{student.name}</span>
                    </div>
                </TableCell>
                <TableCell>
                  {student.rfid_uid ? (
                    <Badge variant="secondary">{student.rfid_uid}</Badge>
                  ) : (
                    <span className="text-muted-foreground">N/A</span>
                  )}
                </TableCell>
                <TableCell>
                    <div className="flex flex-wrap gap-1">
                        {enrolledClasses.length > 0 ? (
                            enrolledClasses.map(className => (
                                <Badge key={className} variant="outline">{className}</Badge>
                            ))
                        ) : (
                            <span className="text-xs text-muted-foreground">Not enrolled</span>
                        )}
                    </div>
                </TableCell>
                <TableCell>{formatDate(student.created_at)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleEditClick(student)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        onClick={() => handleDeleteClick(student)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the student
              record for <span className="font-bold">{selectedStudent?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Student: {selectedStudent?.name}</DialogTitle>
                <DialogDescription>
                    Update the student's name or assign a new RFID card.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                     <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="name"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="rfid">RFID UID</Label>
                    <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="rfid"
                            value={editedRfid}
                            onChange={(e) => setEditedRfid(e.target.value)}
                            placeholder="Tap new card to update UID"
                            className="pl-10"
                        />
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleEditConfirm} disabled={isSubmitting}>
                     {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

