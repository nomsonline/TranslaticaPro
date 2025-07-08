import { config } from 'dotenv';
config();

import '@/ai/flows/auto-detect-source-language.ts';
import '@/ai/flows/generate-translation-quality-hints.ts';