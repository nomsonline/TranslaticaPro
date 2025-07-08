// This file is machine-generated - edit at your own risk!

'use server';

/**
 * @fileOverview Flow for automatically detecting the source language of a document.
 *
 * - detectSourceLanguage - A function that handles the language detection process.
 * - DetectSourceLanguageInput - The input type for the detectSourceLanguage function.
 * - DetectSourceLanguageOutput - The return type for the detectSourceLanguage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectSourceLanguageInputSchema = z.object({
  text: z
    .string()
    .describe('The text content of the document to detect the language from.'),
});
export type DetectSourceLanguageInput = z.infer<
  typeof DetectSourceLanguageInputSchema
>;

const DetectSourceLanguageOutputSchema = z.object({
  languageCode: z
    .string()
    .describe('The ISO 639-1 code of the detected language.'),
  confidence: z
    .number()
    .describe(
      'The confidence score (0.0-1.0) of the language detection result.'
    ),
});
export type DetectSourceLanguageOutput = z.infer<
  typeof DetectSourceLanguageOutputSchema
>;

export async function detectSourceLanguage(
  input: DetectSourceLanguageInput
): Promise<DetectSourceLanguageOutput> {
  return detectSourceLanguageFlow(input);
}

const detectSourceLanguagePrompt = ai.definePrompt({
  name: 'detectSourceLanguagePrompt',
  input: {schema: DetectSourceLanguageInputSchema},
  output: {schema: DetectSourceLanguageOutputSchema},
  prompt: `Determine the language of the following text and provide the ISO 639-1 language code and a confidence score (0.0-1.0) for your determination.\n\nText: {{{text}}}`,
});

const detectSourceLanguageFlow = ai.defineFlow(
  {
    name: 'detectSourceLanguageFlow',
    inputSchema: DetectSourceLanguageInputSchema,
    outputSchema: DetectSourceLanguageOutputSchema,
  },
  async (input) => {
    let retries = 3;
    let delay = 1000;
    while (retries > 0) {
      try {
        const { output } = await detectSourceLanguagePrompt(input);
        return output!;
      } catch (e) {
        const error = e as Error;
        if (error.message && error.message.includes('503')) {
          retries--;
          if (retries === 0) {
            throw error;
          }
          await new Promise((r) => setTimeout(r, delay));
          delay *= 2;
        } else {
          throw error;
        }
      }
    }
    // This part is for type-safety, it should not be reached.
    throw new Error('Failed to detect language after multiple retries.');
  }
);
