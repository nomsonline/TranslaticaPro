'use server';
/**
 * @fileOverview A flow for translating a document while preserving formatting.
 *
 * - translateDocument - A function that handles the document translation.
 * - TranslateDocumentInput - The input type for the translateDocument function.
 * - TranslateDocumentOutput - The return type for the translateDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {TranslationServiceClient} from '@google-cloud/translate';

const TranslateDocumentInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "A document file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  mimeType: z.string().describe('The mime type of the document.'),
  sourceLanguage: z.string().describe('The ISO 639-1 code of the source language.'),
  targetLanguage: z.string().describe('The ISO 639-1 code of the target language.'),
});
export type TranslateDocumentInput = z.infer<typeof TranslateDocumentInputSchema>;

const TranslateDocumentOutputSchema = z.object({
  translatedDocumentDataUri: z.string().describe('The translated document as a data URI.'),
});
export type TranslateDocumentOutput = z.infer<typeof TranslateDocumentOutputSchema>;

export async function translateDocument(input: TranslateDocumentInput): Promise<TranslateDocumentOutput> {
  return translateDocumentFlow(input);
}

const translateDocumentFlow = ai.defineFlow(
  {
    name: 'translateDocumentFlow',
    inputSchema: TranslateDocumentInputSchema,
    outputSchema: TranslateDocumentOutputSchema,
  },
  async (input) => {
    const translationClient = new TranslationServiceClient();

    const projectId = await translationClient.getProjectId();
    const location = 'us-central1';

    const content = input.documentDataUri.split(',')[1];

    const request = {
      parent: `projects/${projectId}/locations/${location}`,
      sourceLanguageCode: input.sourceLanguage,
      targetLanguageCode: input.targetLanguage,
      documentInputConfig: {
        content: content,
        mimeType: input.mimeType,
      },
    };

    try {
      const [response] = await translationClient.translateDocument(request);
      if (response.documentTranslation?.byteStreamOutputs?.[0]) {
        const translatedContent = response.documentTranslation.byteStreamOutputs[0];
        const translatedBase64 = Buffer.from(translatedContent).toString('base64');
        const translatedDocumentDataUri = `data:${input.mimeType};base64,${translatedBase64}`;
        return { translatedDocumentDataUri };
      } else {
        throw new Error('Document translation did not return content.');
      }
    } catch (error) {
        console.error("Document translation failed:", error);
        throw new Error('Failed to translate the document. The format may not be supported or the file may be corrupted.');
    }
  }
);