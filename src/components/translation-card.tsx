'use client';

import { detectSourceLanguage } from '@/ai/flows/auto-detect-source-language';
import { extractTextFromDocument } from '@/ai/flows/extract-text-from-document';
import { generateTranslationQualityHints } from '@/ai/flows/generate-translation-quality-hints';
import { translateDocument } from '@/ai/flows/translate-document';
import { translateText } from '@/ai/flows/translate-text';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { LanguageCombobox } from '@/components/language-combobox';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { languages, type Language } from '@/lib/languages';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  ArrowRight,
  Download,
  File as FileIcon,
  Presentation,
  FileSpreadsheet,
  FileText,
  LoaderCircle,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

type View = 'upload' | 'preview';

export function TranslationCard() {
  const [view, setView] = useState<View>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [fileDataUri, setFileDataUri] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  const [autoDetect, setAutoDetect] = useState(true);
  const [sourceLang, setSourceLang] = useState('');
  const [targetLang, setTargetLang] = useState('');
  const [detectedLangLabel, setDetectedLangLabel] = useState('');

  const [isTranslating, setIsTranslating] = useState(false);

  const [originalText, setOriginalText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [translatedDocumentData, setTranslatedDocumentData] = useState<
    string | null
  >(null);

  const [qualityHints, setQualityHints] = useState('');
  const [isFetchingHints, setIsFetchingHints] = useState(false);

  const { toast } = useToast();

  const handleAutoDetectChange = (checked: boolean) => {
    setAutoDetect(checked);
    setSourceLang('');
    setDetectedLangLabel('');
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    // Reset all translation-related state
    setOriginalText('');
    setTranslatedText('');
    setTranslatedDocumentData(null);
    setFileDataUri(null);
    setQualityHints('');
    setDetectedLangLabel('');
    // If not auto-detecting, user must re-select source lang for the new file.
    if (!autoDetect) {
      setSourceLang('');
    } else {
      // Even in auto-detect, clear the source lang so it can be re-detected
      setSourceLang('');
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHovering(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHovering(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHovering(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const clearFile = () => {
    setFile(null);
    setFileDataUri(null);
    setOriginalText('');
    setTranslatedText('');
    setTranslatedDocumentData(null);
    setQualityHints('');
    setSourceLang('');
    setDetectedLangLabel('');
  };

  const handleTranslate = async () => {
    if (!file || !targetLang) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please upload a file and select a target language.',
      });
      return;
    }
    if (!autoDetect && !sourceLang) {
      toast({
        variant: 'destructive',
        title: 'Source Language Required',
        description: 'Please select a source language or enable auto-detect.',
      });
      return;
    }

    setIsTranslating(true);
    setTranslatedText('');
    setTranslatedDocumentData(null);

    try {
      const dataUri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            resolve(e.target.result as string);
          } else {
            reject(new Error('Failed to read file.'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file.'));
        reader.readAsDataURL(file);
      });
      setFileDataUri(dataUri);

      const { extractedText } = await extractTextFromDocument({
        documentDataUri: dataUri,
      });
      setOriginalText(extractedText);

      let finalSourceLangCode = sourceLang;

      if (autoDetect) {
        const result = await detectSourceLanguage({ text: extractedText });
        const detectedLangInfo = languages.find(
          (l) =>
            l.label.toLowerCase() === result.languageCode.toLowerCase() ||
            l.value.toLowerCase() === result.languageCode.toLowerCase()
        );

        if (detectedLangInfo) {
          finalSourceLangCode = detectedLangInfo.value;
          setSourceLang(finalSourceLangCode);
          setDetectedLangLabel(detectedLangInfo.label);
          toast({
            title: 'Language Detected',
            description: `Source language set to ${detectedLangInfo.label}.`,
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Detection Failed',
            description: `Could not recognize the detected language: ${result.languageCode}. Please select it manually.`,
          });
          setAutoDetect(false);
          setIsTranslating(false);
          return;
        }
      }

      if (!finalSourceLangCode) {
        toast({
          variant: 'destructive',
          title: 'Source Language Required',
          description: 'Could not determine source language. Please select one.',
        });
        setIsTranslating(false);
        return;
      }

      const sourceLangLabel =
        languages.find((l) => l.value === finalSourceLangCode)?.label ||
        finalSourceLangCode;
      const targetLangLabel =
        languages.find((l) => l.value === targetLang)?.label || targetLang;

      const [textResult, docResult] = await Promise.all([
        translateText({
          text: extractedText,
          sourceLanguage: sourceLangLabel,
          targetLanguage: targetLangLabel,
        }),
        translateDocument({
          documentDataUri: dataUri,
          mimeType: file.type,
          sourceLanguage: finalSourceLangCode,
          targetLanguage: targetLang,
        }),
      ]);

      setTranslatedText(textResult.translatedText);
      setTranslatedDocumentData(docResult.translatedDocumentDataUri);
      setView('preview');
    } catch (error) {
      console.error('Translation failed:', error);
      toast({
        variant: 'destructive',
        title: 'Translation Failed',
        description:
          error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleDownload = async () => {
    if (!translatedDocumentData || !file) {
      toast({
        variant: 'destructive',
        title: 'Download Error',
        description: 'Translated document is not available for download.',
      });
      return;
    }

    try {
      const res = await fetch(translatedDocumentData);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const originalFilename = file.name.substring(
        0,
        file.name.lastIndexOf('.')
      );
      const originalExtension = file.name.substring(
        file.name.lastIndexOf('.')
      );
      const targetLangValue =
        languages.find((l) => l.value === targetLang)?.value || targetLang;
      link.download = `${originalFilename}_translated_to_${targetLangValue}${originalExtension}`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description: 'Could not prepare the file for download.',
      });
    }
  };

  const handleGetQualityHints = async () => {
    if (!originalText || !translatedText || !sourceLang || !targetLang) {
      toast({
        title: 'Missing Information',
        description:
          'Need original text, translated text, and languages to generate hints.',
        variant: 'destructive',
      });
      return;
    }
    setIsFetchingHints(true);
    try {
      const result = await generateTranslationQualityHints({
        originalText,
        translatedText,
        sourceLanguage:
          languages.find((l) => l.value === sourceLang)?.label || sourceLang,
        targetLanguage:
          languages.find((l) => l.value === targetLang)?.label || targetLang,
      });
      setQualityHints(result.qualityHints);
    } catch (error) {
      console.error('Error fetching quality hints:', error);
      toast({
        title: 'Error',
        description: 'Could not fetch AI quality hints.',
        variant: 'destructive',
      });
    } finally {
      setIsFetchingHints(false);
    }
  };

  const sourceLanguages = useMemo(() => languages, []);
  const targetLanguages = useMemo(
    () => languages.filter((l) => l.value !== sourceLang),
    [sourceLang]
  );

  const isLoading = isTranslating;

  if (view === 'preview') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView('upload')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleGetQualityHints}
                    aria-label="Get AI Quality Hints"
                  >
                    {isFetchingHints ? (
                      <LoaderCircle className="h-5 w-5 animate-spin" />
                    ) : (
                      <Sparkles className="h-5 w-5" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="font-headline font-medium leading-none">
                        AI Quality Hints
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {qualityHints ||
                          'Click the sparkles to generate AI-powered feedback on the translation.'}
                      </p>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                size="sm"
                onClick={handleDownload}
                disabled={!translatedDocumentData}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <Label htmlFor="original-text" className="mb-2 block">
                Original ({languages.find((l) => l.value === sourceLang)?.label})
              </Label>
              <Textarea
                id="original-text"
                value={originalText}
                readOnly
                className="h-96 resize-none"
              />
            </div>
            <div>
              <Label htmlFor="translated-text" className="mb-2 block">
                Translated (
                {languages.find((l) => l.value === targetLang)?.label})
              </Label>
              <Textarea
                id="translated-text"
                value={translatedText}
                readOnly
                className="h-96 resize-none"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          {!file ? (
            <div
              className={cn(
                'relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center transition-colors hover:border-primary/80 hover:bg-accent/50',
                isHovering && 'border-primary bg-accent/50'
              )}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <UploadCloud className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="font-semibold">
                Drag & drop files here, or click to browse
              </p>
              <p className="text-sm text-muted-foreground">
                Supports Word, PDF, Excel, PowerPoint, Text
              </p>
              <div className="mt-4 flex items-center justify-center gap-4 text-muted-foreground">
                <FileText />
                <FileIcon />
                <FileSpreadsheet />
                <Presentation />
              </div>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={onFileChange}
                accept=".txt,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              />
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearFile}
                aria-label="Remove file"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="source-lang">Source Language</Label>
              <LanguageCombobox
                value={sourceLang}
                onValueChange={setSourceLang}
                placeholder={
                  autoDetect
                    ? detectedLangLabel || 'Auto-detect'
                    : 'Select source language'
                }
                languagesList={sourceLanguages}
                aria-label="Select source language"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target-lang">Target Language</Label>
              <LanguageCombobox
                value={targetLang}
                onValueChange={setTargetLang}
                placeholder="Select target language"
                languagesList={targetLanguages}
                aria-label="Select target language"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2">
            <Switch id="auto-detect-switch" checked={autoDetect} onCheckedChange={handleAutoDetectChange} disabled={isLoading} />
            <Label htmlFor="auto-detect-switch">Auto-detect source language</Label>
          </div>

          <Button
            size="lg"
            className="w-full"
            disabled={!file || !targetLang || isLoading}
            onClick={handleTranslate}
          >
            {isLoading ? (
              <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <ArrowRight className="mr-2 h-5 w-5" />
            )}
            Translate Document
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
