'use server';

/**
 * @fileOverview Provides real-time feedback during the face scan process.
 *
 * - getFaceScanFeedback - A function that provides feedback during face scan.
 * - FaceScanFeedbackInput - The input type for the getFaceScanFeedback function.
 * - FaceScanFeedbackOutput - The return type for the getFaceScanFeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FaceScanFeedbackInputSchema = z.object({
  faceDetected: z.boolean().describe('Whether a face is detected or not.'),
  lightingStatus: z
    .string()
    .describe(
      'The status of the lighting conditions during the face scan (e.g., good, poor).'    ),
  distanceStatus: z
    .string()
    .describe('The status of the distance to the camera (e.g., too close, too far, optimal).'),
});
export type FaceScanFeedbackInput = z.infer<typeof FaceScanFeedbackInputSchema>;

const FaceScanFeedbackOutputSchema = z.object({
  feedbackMessage: z.string().describe('The real-time feedback message for the user.'),
});
export type FaceScanFeedbackOutput = z.infer<typeof FaceScanFeedbackOutputSchema>;

export async function getFaceScanFeedback(
  input: FaceScanFeedbackInput
): Promise<FaceScanFeedbackOutput> {
  return faceScanFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'faceScanFeedbackPrompt',
  input: {schema: FaceScanFeedbackInputSchema},
  output: {schema: FaceScanFeedbackOutputSchema},
  prompt: `You are providing real-time feedback to a student during a face scan process for enrollment.

  Based on the following information, generate a concise and helpful feedback message for the student.

  Face Detected: {{faceDetected}}
  Lighting Status: {{lightingStatus}}
  Distance Status: {{distanceStatus}}

  The feedback message should be actionable and easy to understand. Focus on guiding the student to improve the scan quality.

  Examples:
  - If face is not detected: "Please ensure your face is fully visible in the frame."
  - If lighting is poor: "Adjust the lighting for better visibility."
  - If distance is too far: "Move closer to the camera."
  - If distance is too close: "Move slightly further away from the camera."
  - If face is detected and lighting and distance are optimal: "Face detected ✅. Please hold still."
  `,
});

const faceScanFeedbackFlow = ai.defineFlow(
  {
    name: 'faceScanFeedbackFlow',
    inputSchema: FaceScanFeedbackInputSchema,
    outputSchema: FaceScanFeedbackOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
