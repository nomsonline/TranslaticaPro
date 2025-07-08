import { config } from 'dotenv';
config();

import '@/ai/flows/auto-detect-source-language.ts';
import '@/ai/flows/generate-translation-quality-hints.ts';
import '@/ai/flows/extract-text-from-document.ts';
import '@/ai/flows/translate-text.ts';
import '@/ai/flows/translate-document.ts';
