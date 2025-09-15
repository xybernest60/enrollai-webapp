
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

export async function createSession(values: z.infer<typeof sessionSchema>) {
    const validatedFields = sessionSchema.safeParse(values);

    if (!validatedFields.success) {
        console.error("Validation errors:", validatedFields.error.flatten().fieldErrors);
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }
    
    const { start_time, end_time, ...rest } = validatedFields.data;
    
    // Combine with a placeholder date for storing in a timestamp field.
    const startTimeWithDate = `1970-01-01T${start_time}:00`;
    const endTimeWithDate = `1970-01-01T${end_time}:00`;

    const { data, error } = await supabase
        .from('sessions')
        .insert({
            ...rest,
            start_time: startTimeWithDate,
            end_time: endTimeWithDate,
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

export async function updateSession(sessionId: string, values: z.infer<typeof sessionSchema>) {
    if (!sessionId) {
        return { error: 'Session ID is required.' };
    }
    const validatedFields = sessionSchema.safeParse(values);
    if (!validatedFields.success) {
        return { error: JSON.stringify(validatedFields.error.flatten().fieldErrors) };
    }
    
    const { start_time, end_time, ...rest } = validatedFields.data;

    const startTimeWithDate = `1970-01-01T${start_time}:00`;
    const endTimeWithDate = `1970-01-01T${end_time}:00`;

    const updateData = {
        ...rest,
        start_time: startTimeWithDate,
        end_time: endTimeWithDate,
    };

    const { error } = await supabase
        .from('sessions')
        .update(updateData)
        .eq('id', sessionId);

    if (error) {
        console.error(`Error updating session ${sessionId}:`, error);
        return { error: `Database Error: ${error.message}` };
    }

    revalidatePath('/admin/sessions');
    return { message: 'Session updated successfully.' };
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
    revalidatePath('/admin/sessions');
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

// Action to fetch sessions for a specific class
export async function getSessionsForClass(classId: string) {
    if (!classId) return { error: 'Class ID is required.', data: null };

    const { data, error } = await supabase
        .from('sessions')
        .select('id, name')
        .eq('class_id', classId)
        .order('name');
    
    if (error) {
        console.error(`Error fetching sessions for class ${classId}:`, error);
        return { error: error.message, data: null };
    }
    
    return { error: null, data };
}


export async function getAttendanceReportData(sessionId: string, date: string) {
    if (!sessionId || !date) {
        return { error: 'Session ID and date are required.', data: null };
    }

    // 1. Get session details to find the class_id and time window
    const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('class_id, start_time, end_time')
        .eq('id', sessionId)
        .single();

    if (sessionError || !sessionData) {
        console.error(`Error fetching session ${sessionId}:`, sessionError);
        return { error: 'Could not find the specified session.', data: null };
    }
    
    const { class_id, start_time, end_time } = sessionData;

    // 2. Get all students enrolled in that class
    const { data: enrolledStudents, error: enrolledError } = await supabase
        .from('enrollments')
        .select('students (*)')
        .eq('class_id', class_id);

    if (enrolledError || !enrolledStudents) {
        console.error(`Error fetching enrollments for class ${class_id}:`, enrolledError);
        return { error: 'Could not fetch enrolled students.', data: null };
    }

    // 3. Get all check-ins for that session on that specific date
    const dateObj = new Date(date);
    const startOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).toISOString();
    const endOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate() + 1).toISOString();

    const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('attendance')
        .select('student_id, checkin_time, verified_by_face')
        .eq('session_id', sessionId)
        .gte('checkin_time', startOfDay)
        .lt('checkin_time', endOfDay);


    if (attendanceError) {
        console.error(`Error fetching attendance for session ${sessionId} on ${date}:`, attendanceError);
        return { error: 'Could not fetch attendance records.', data: null };
    }

    // 4. Process the data
    const attendanceMap = new Map(attendanceRecords?.map(r => [r.student_id, r]));
    
    // The end_time is just a time string, e.g., "09:15:00".
    // We need to create a full Date object for the report date with this end time.
    const [endHours, endMinutes, endSeconds] = end_time.split(':').map(Number);
    const sessionEndDateOnReportDay = new Date(date);
    // Use setUTCHours to align with the database's timezone (likely UTC)
    sessionEndDateOnReportDay.setUTCHours(endHours, endMinutes, endSeconds || 0, 0);


    const report = enrolledStudents.map(enrollment => {
        const student = enrollment.students;
        if (!student) return null;

        const checkIn = attendanceMap.get(student.id);
        let status: 'on-time' | 'late' | 'absent' = 'absent';
        let checkinTime: string | null = null;
        
        if (checkIn) {
            checkinTime = checkIn.checkin_time;
            const studentCheckinDate = new Date(checkinTime);

            if (studentCheckinDate <= sessionEndDateOnReportDay) {
                status = 'on-time';
            } else {
                status = 'late';
            }
        }
        
        return {
            student_id: student.id,
            student_name: student.name,
            student_image_url: student.image_url,
            status,
            checkin_time: checkinTime,
            verified_by_face: checkIn?.verified_by_face ?? false,
        };
    }).filter(Boolean);
    
    return { data: report, error: null };
}

