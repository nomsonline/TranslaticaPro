'use server';
/**
 * @fileOverview A flow for translating text from a source to a target language.
 *
 * - translateText - A function that handles the text translation.
 * - TranslateTextInput - The input type for the translateText function.
 * - TranslateTextOutput - The return type for the translateText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateTextInputSchema = z.object({
  text: z.string().describe('The text to translate.'),
  sourceLanguage: z.string().describe('The source language of the text (e.g., English).'),
  targetLanguage: z.string().describe('The target language for the translation (e.g., Spanish).'),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const TranslateTextOutputSchema = z.object({
  translatedText: z.string().describe('The translated text.'),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;

export async function translateText(input: TranslateTextInput): Promise<TranslateTextOutput> {
  return translateTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'translateTextPrompt',
  input: {schema: TranslateTextInputSchema},
  output: {schema: TranslateTextOutputSchema},
  prompt: `Translate the following text from {{{sourceLanguage}}} to {{{targetLanguage}}}.
Do not add any extra commentary, just provide the translated text.

Text:
{{{text}}}
`,
});

const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
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
    throw new Error('Failed to translate text after multiple retries.');
  }
);
