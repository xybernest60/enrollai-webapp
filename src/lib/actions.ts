
"use server";

import { z } from "zod";
import { supabase } from './supabase/admin';
import { revalidatePath } from "next/cache";

const sessionSchema = z.object({
    class_id: z.string().uuid(),
    name: z.string().min(1, "Session name is required."),
    day_of_week: z.coerce.number().min(0).max(6),
    start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
    end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
    is_recurring: z.boolean(),
});

export async function createSession(formData: FormData) {
    const rawFormData = Object.fromEntries(formData.entries());

    // Manual boolean conversion
    rawFormData.is_recurring = rawFormData.is_recurring === 'true';

    const validatedFields = sessionSchema.safeParse(rawFormData);

    if (!validatedFields.success) {
        console.error("Validation errors:", validatedFields.error.flatten().fieldErrors);
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }
    
    // Combine date and time for Supabase timestamp
    // We use a dummy date because we only care about the time part for recurring sessions.
    // The actual date will be handled when generating daily attendance.
    const dummyDate = '1970-01-01';
    const startTimeStr = `${dummyDate}T${validatedFields.data.start_time}:00`;
    const endTimeStr = `${dummyDate}T${validatedFields.data.end_time}:00`;


    const { data, error } = await supabase
        .from('sessions')
        .insert({
            ...validatedFields.data,
            start_time: startTimeStr,
            end_time: endTimeStr,
        });

    if (error) {
        console.error('Error creating session:', error);
        return {
            error: `Database Error: ${error.message}`
        }
    }
    
    revalidatePath('/admin/sessions');
    return {
        data,
        message: 'Session created successfully.'
    }
}

export async function deleteSession(sessionId: string) {
    if (!sessionId) {
        return { error: 'Session ID is required.' };
    }

    const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId);
    
    if (error) {
        console.error('Error deleting session:', error);
        return { error: `Database Error: ${error.message}` };
    }

    revalidatePath('/admin/sessions');
    return { message: 'Session deleted successfully.' };
}

const classSchema = z.object({
  name: z.string().min(1, "Class name is required."),
});

export async function createClass(values: z.infer<typeof classSchema>) {
    const validatedFields = classSchema.safeParse(values);

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors };
    }

    const { error } = await supabase.from('classes').insert(validatedFields.data);

    if (error) {
        console.error('Error creating class:', error);
        if (error.code === '23505') {
            return { error: 'A class with this name already exists.' };
        }
        return { error: `Database Error: ${error.message}` };
    }
    
    revalidatePath('/admin/classes');
    return {};
}

export async function deleteClass(classId: string) {
    if (!classId) {
        return { error: 'Class ID is required.' };
    }

    const { error } = await supabase.from('classes').delete().eq('id', classId);
    
    if (error) {
        console.error('Error deleting class:', error);
        return { error: `Database Error: ${error.message}` };
    }

    revalidatePath('/admin/classes');
    return { message: 'Class deleted successfully.' };
}

export async function updateEnrollments(classId: string, studentIds: string[]) {
    if (!classId) {
        return { error: 'Class ID is required.' };
    }

    // First, delete all existing enrollments for this class
    const { error: deleteError } = await supabase
        .from('enrollments')
        .delete()
        .eq('class_id', classId);

    if (deleteError) {
        console.error('Error clearing existing enrollments:', deleteError);
        return { error: `Database Error: ${deleteError.message}` };
    }

    // Then, if there are any students to enroll, insert the new ones
    if (studentIds.length > 0) {
        const enrollmentsToInsert = studentIds.map(student_id => ({
            class_id: classId,
            student_id: student_id,
        }));

        const { error: insertError } = await supabase
            .from('enrollments')
            .insert(enrollmentsToInsert);

        if (insertError) {
            console.error('Error inserting new enrollments:', insertError);
            return { error: `Database Error: ${insertError.message}` };
        }
    }

    revalidatePath(`/admin/classes/${classId}/enrollments`);
    revalidatePath('/admin/classes');
    revalidatePath('/admin/students');
    return { message: 'Enrollments updated successfully.' };
}

const updateStudentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  rfid_uid: z.string().min(4, "RFID UID must be at least 4 characters.").optional().nullable(),
  original_rfid_uid: z.string().optional().nullable(),
  image_url: z.string().url().optional().nullable(),
});

export async function updateStudent(studentId: string, values: z.infer<typeof updateStudentSchema>) {
    if (!studentId) {
        return { error: 'Student ID is required.' };
    }

    const validatedFields = updateStudentSchema.safeParse(values);
    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors };
    }
    
    const { name, rfid_uid, original_rfid_uid, image_url } = validatedFields.data;

    // 1. Rename image in storage if RFID UID has changed
    if (rfid_uid && original_rfid_uid && rfid_uid !== original_rfid_uid && image_url) {
        try {
            const oldPath = new URL(image_url).pathname.split('/student-photos/')[1];
            const fileExtension = oldPath.split('.').pop();
            const newPath = `${rfid_uid}.${fileExtension}`;
            
            const { error: moveError } = await supabase.storage
                .from('student-photos')
                .move(oldPath, newPath);

            if (moveError) {
                // If file doesn't exist, we can ignore, otherwise throw
                if (moveError.message !== 'The resource was not found') {
                    console.error("Error renaming student photo:", moveError);
                    throw new Error(`Storage Error: ${moveError.message}`);
                }
            }
        } catch (e: any) {
             return { error: e.message };
        }
    }
    
    // 2. Get the potentially new public URL
    let newImageUrl = image_url;
    if (rfid_uid && rfid_uid !== original_rfid_uid && image_url) {
         const fileExtension = new URL(image_url).pathname.split('.').pop();
         const newPath = `${rfid_uid}.${fileExtension}`;
         const { data: urlData } = supabase.storage
            .from('student-photos')
            .getPublicUrl(newPath);
        newImageUrl = urlData.publicUrl;
    }

    // 3. Update the student record in the database
    const { error: dbError } = await supabase
        .from('students')
        .update({
            name,
            rfid_uid,
            image_url: newImageUrl,
        })
        .eq('id', studentId);

    if (dbError) {
        console.error("Error updating student record:", dbError);
        if (dbError.code === '23505') { // unique constraint violation
            return { error: 'This RFID UID is already in use by another student.' };
        }
        return { error: `Database Error: ${dbError.message}` };
    }

    revalidatePath('/admin/students');
    return { message: 'Student updated successfully.' };
}
