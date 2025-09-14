
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
    return { message: 'Enrollments updated successfully.' };
}
