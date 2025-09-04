# **App Name**: EnrollAI

## Core Features:

- Guided Enrollment: Wizard-style UI guides users through the enrollment steps: Name → RFID → Face Scan → Profile Pic → Confirm.
- RFID Capture: Input field captures RFID UID upon card tap, storing UID in state.
- Webcam Preview: Webcam live preview provides visual feedback during face scan.
- AI Face Scan: Uses face-api.js tool to detect faces and generate embeddings with continuous feedback like 'Move closer,' 'Adjust lighting,' and 'Face detected ✅'.
- Profile Picture Upload: File upload with image preview for profile picture selection.
- Confirmation Display: Displays a summary of entered information (name, RFID UID, profile picture) before submission.
- Supabase Integration: Persists all enrollment data in Supabase database tables and storage.
- Student Check-In: Allows students to check in using RFID and facial recognition, marking their attendance.
- Admin Dashboard: Provides an admin interface to view students, attendance records, and generate reports.
- Attendance Tracking: Tracks student attendance, marking students as present, absent or late.

## Style Guidelines:

- Primary color: Deep indigo (#3F51B5), evoking trust and knowledge.
- Background color: Very light indigo (#F0F2F9) creating a calm and unobtrusive backdrop.
- Accent color: Soft violet (#8E24AA) provides visual interest and a modern touch for highlights and active states.
- Font pairing: 'Space Grotesk' (sans-serif) for headlines and 'Inter' (sans-serif) for body text.
- Consistent use of line icons from a single library. Use icons representing identity, security, and verification.
- Responsive layout adapts smoothly to desktop, tablet, and mobile screens, ensuring usability on all devices.
- Use subtle, tasteful animations to provide feedback during key interactions like face scanning or data submission, improving user experience.