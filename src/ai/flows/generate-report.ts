'use server';

/**
 * @fileOverview Generates attendance reports using AI, highlighting trends and potential issues.
 *
 * - generateAttendanceReport - A function that generates the attendance report.
 * - GenerateAttendanceReportInput - The input type for the generateAttendanceReport function.
 * - GenerateAttendanceReportOutput - The return type for the generateAttendanceReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAttendanceReportInputSchema = z.object({
  startDate: z.string().describe('The start date for the report period (YYYY-MM-DD).'),
  endDate: z.string().describe('The end date for the report period (YYYY-MM-DD).'),
  reportDetails: z.string().describe('Additional details or specific requirements for the report.'),
});
export type GenerateAttendanceReportInput = z.infer<typeof GenerateAttendanceReportInputSchema>;

const GenerateAttendanceReportOutputSchema = z.object({
  reportSummary: z.string().describe('A summary of the attendance report including trends and issues.'),
  reportDetails: z.string().describe('Detailed attendance information for the specified period.'),
});
export type GenerateAttendanceReportOutput = z.infer<typeof GenerateAttendanceReportOutputSchema>;

export async function generateAttendanceReport(input: GenerateAttendanceReportInput): Promise<GenerateAttendanceReportOutput> {
  return generateAttendanceReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAttendanceReportPrompt',
  input: {schema: GenerateAttendanceReportInputSchema},
  output: {schema: GenerateAttendanceReportOutputSchema},
  prompt: `You are an AI assistant specialized in generating attendance reports.

  Generate a comprehensive attendance report for the period between {{startDate}} and {{endDate}}.
  Highlight any significant trends, patterns, or potential issues related to student attendance.
  Include a summary of the overall attendance and provide detailed information as requested in the report details.

  Report Details: {{{reportDetails}}}
  Start Date: {{startDate}}
  End Date: {{endDate}}`,
});

const generateAttendanceReportFlow = ai.defineFlow(
  {
    name: 'generateAttendanceReportFlow',
    inputSchema: GenerateAttendanceReportInputSchema,
    outputSchema: GenerateAttendanceReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
