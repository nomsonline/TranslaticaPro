// This file is machine-generated - edit at your own risk.

'use server';

/**
 * @fileOverview AI-powered tooltips that suggest translation quality estimates as feedback to the user.
 *
 * - generateTranslationQualityHints - A function that generates translation quality hints.
 * - GenerateTranslationQualityHintsInput - The input type for the generateTranslationQualityHints function.
 * - GenerateTranslationQualityHintsOutput - The return type for the generateTranslationQualityHints function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTranslationQualityHintsInputSchema = z.object({
  originalText: z
    .string()
    .describe('The original text that was translated.'),
  translatedText: z
    .string()
    .describe('The translated text.'),
  sourceLanguage: z
    .string()
    .describe('The source language of the original text.'),
  targetLanguage: z
    .string()
    .describe('The target language of the translated text.'),
});
export type GenerateTranslationQualityHintsInput = z.infer<
  typeof GenerateTranslationQualityHintsInputSchema
>;

const GenerateTranslationQualityHintsOutputSchema = z.object({
  qualityHints: z
    .string()
    .describe(
      'AI-generated hints or quality estimates for the translation, providing insights into its potential accuracy.'
    ),
});
export type GenerateTranslationQualityHintsOutput = z.infer<
  typeof GenerateTranslationQualityHintsOutputSchema
>;

export async function generateTranslationQualityHints(
  input: GenerateTranslationQualityHintsInput
): Promise<GenerateTranslationQualityHintsOutput> {
  return generateTranslationQualityHintsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTranslationQualityHintsPrompt',
  input: {schema: GenerateTranslationQualityHintsInputSchema},
  output: {schema: GenerateTranslationQualityHintsOutputSchema},
  prompt: `You are an AI expert in translation quality assessment. Given the original text, the translated text, the source language, and the target language, generate hints or quality estimates for the translation.

Original Text: {{{originalText}}}
Translated Text: {{{translatedText}}}
Source Language: {{{sourceLanguage}}}
Target Language: {{{targetLanguage}}}

Provide concise and informative hints about the translation quality.`,
});

const generateTranslationQualityHintsFlow = ai.defineFlow(
  {
    name: 'generateTranslationQualityHintsFlow',
    inputSchema: GenerateTranslationQualityHintsInputSchema,
    outputSchema: GenerateTranslationQualityHintsOutputSchema,
  },
  async (input) => {
    let retries = 3;
    let delay = 1000;
    while (retries > 0) {
      try {
        const { output } = await prompt(input);
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
    throw new Error('Failed to generate hints after multiple retries.');
  }
);
