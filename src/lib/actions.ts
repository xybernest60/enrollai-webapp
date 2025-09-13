
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
    rawFormData.is_recurring = rawFormData.is_recurring === 'on';

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
