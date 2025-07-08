'use server';
/**
 * @fileOverview A flow for extracting text from a document.
 *
 * - extractTextFromDocument - A function that handles the text extraction process.
 * - ExtractTextFromDocumentInput - The input type for the extractTextFromDocument function.
 * - ExtractTextFromDocumentOutput - The return type for the extractTextFromDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractTextFromDocumentInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "A document file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractTextFromDocumentInput = z.infer<typeof ExtractTextFromDocumentInputSchema>;

const ExtractTextFromDocumentOutputSchema = z.object({
  extractedText: z.string().describe('The text extracted from the document.'),
});
export type ExtractTextFromDocumentOutput = z.infer<typeof ExtractTextFromDocumentOutputSchema>;

export async function extractTextFromDocument(input: ExtractTextFromDocumentInput): Promise<ExtractTextFromDocumentOutput> {
  return extractTextFromDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractTextFromDocumentPrompt',
  input: {schema: ExtractTextFromDocumentInputSchema},
  output: {schema: ExtractTextFromDocumentOutputSchema},
  prompt: `You are an expert at extracting plain text from various document formats.
Extract all the user-readable text from the following document.
Do not include any formatting, metadata, or structural information. Only return the text content.

Document: {{media url=documentDataUri}}`,
});

const extractTextFromDocumentFlow = ai.defineFlow(
  {
    name: 'extractTextFromDocumentFlow',
    inputSchema: ExtractTextFromDocumentInputSchema,
    outputSchema: ExtractTextFromDocumentOutputSchema,
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
    throw new Error('Failed to extract text after multiple retries.');
  }
);
