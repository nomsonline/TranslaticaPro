'use client';

import { detectSourceLanguage } from '@/ai/flows/auto-detect-source-language';
import { extractTextFromDocument } from '@/ai/flows/extract-text-from-document';
import { generateTranslationQualityHints } from '@/ai/flows/generate-translation-quality-hints';
import { translateText } from '@/ai/flows/translate-text';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { languages, type Language } from '@/lib/languages';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
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
import React, { useCallback, useMemo, useState } from 'react';

type View = 'upload' | 'preview';

export function TranslationCard() {
  const [view, setView] = useState<View>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('');

  const [isTranslating, setIsTranslating] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);


  const [originalText, setOriginalText] = useState('');
  const [translatedText, setTranslatedText] = useState('');

  const [qualityHints, setQualityHints] = useState('');
  const [isFetchingHints, setIsFetchingHints] = useState(false);

  const { toast } = useToast();

  const handleFileSelect = useCallback(
    (selectedFile: File) => {
      setFile(selectedFile);
      setIsExtracting(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUri = e.target?.result as string;
        
        try {
          const { extractedText } = await extractTextFromDocument({ documentDataUri: dataUri });
          setOriginalText(extractedText);
          toast({
            title: 'Text Extracted',
            description: 'Successfully extracted text from your document.',
          });

          if (sourceLang === 'auto') {
            setIsDetecting(true);
            try {
              const result = await detectSourceLanguage({ text: extractedText });
              const detectedLang = languages.find(
                (l) =>
                  l.label.toLowerCase() === result.languageCode.toLowerCase() ||
                  l.value.toLowerCase() === result.languageCode.toLowerCase()
              );
              if (detectedLang) {
                setSourceLang(detectedLang.value);
                toast({
                  title: 'Language Detected',
                  description: `Source language set to ${detectedLang.label}.`,
                });
              }
            } catch (error) {
              console.error('Language detection failed:', error);
              toast({
                variant: 'destructive',
                title: 'Detection Failed',
                description: 'Could not auto-detect the language.',
              });
            } finally {
              setIsDetecting(false);
            }
          }

        } catch (error) {
          console.error('Text extraction failed:', error);
          toast({
            variant: 'destructive',
            title: 'Extraction Failed',
            description: 'Could not extract text from the document. Please try a different file.',
          });
          clearFile();
        } finally {
          setIsExtracting(false);
        }
      };
      reader.onerror = () => {
        toast({
          variant: 'destructive',
          title: 'File Error',
          description: 'Failed to read the file.',
        });
        setIsExtracting(false);
      };
      reader.readAsDataURL(selectedFile);
    },
    [sourceLang, toast]
  );

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
    setOriginalText('');
    setTranslatedText('');
    setQualityHints('');
    if (sourceLang !== 'auto') {
      setSourceLang('auto');
    }
  };

  const handleTranslate = async () => {
    if (!originalText || !targetLang || sourceLang === 'auto') return;
    setIsTranslating(true);
    try {
      const result = await translateText({
        text: originalText,
        sourceLanguage: languages.find(l => l.value === sourceLang)?.label || sourceLang,
        targetLanguage: languages.find(l => l.value === targetLang)?.label || targetLang,
      });
      setTranslatedText(result.translatedText);
      setView('preview');
    } catch (error) {
      console.error('Translation failed:', error);
      toast({
        variant: 'destructive',
        title: 'Translation Failed',
        description: 'An error occurred during translation.',
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleDownload = () => {
    if (!translatedText || !file) return;

    const blob = new Blob([translatedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const originalFilename = file.name.substring(0, file.name.lastIndexOf('.'));
    const targetLangLabel = languages.find(l => l.value === targetLang)?.label || targetLang;
    link.download = `${originalFilename}_translated_to_${targetLangLabel}.txt`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleGetQualityHints = async () => {
    if (!originalText || !translatedText || sourceLang === 'auto' || !targetLang) {
      toast({
        title: 'Missing Information',
        description: 'Need original text, translated text, and languages to generate hints.',
        variant: 'destructive'
      });
      return;
    }
    setIsFetchingHints(true);
    try {
      const result = await generateTranslationQualityHints({
        originalText,
        translatedText,
        sourceLanguage: languages.find((l) => l.value === sourceLang)?.label || sourceLang,
        targetLanguage: languages.find((l) => l.value === targetLang)?.label || targetLang,
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


  const sourceLanguages = useMemo(() => [{ value: 'auto', label: 'Auto-detect' }, ...languages], []);
  const targetLanguages = useMemo(() => languages.filter(l => l.value !== sourceLang), [sourceLang]);

  const isLoading = isExtracting || isDetecting || isTranslating;
  const loadingText = useMemo(() => {
    if (isExtracting) return 'Extracting Text...';
    if (isDetecting) return 'Detecting Language...';
    if (isTranslating) return 'Translating...';
    return 'Translate';
  }, [isExtracting, isDetecting, isTranslating]);

  if (view === 'preview') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
              <Button variant="outline" size="sm" onClick={() => setView('upload')}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
              </Button>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleGetQualityHints} aria-label="Get AI Quality Hints">
                      {isFetchingHints ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <h4 className="font-medium leading-none font-headline">AI Quality Hints</h4>
                          <p className="text-sm text-muted-foreground">
                            {qualityHints || 'Click the sparkles to generate AI-powered feedback on the translation.'}
                          </p>
                        </div>
                      </div>
                  </PopoverContent>
                </Popover>
                <Button size="sm" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
                <Label htmlFor="original-text" className="mb-2 block">Original ({languages.find(l => l.value === sourceLang)?.label})</Label>
                <Textarea id="original-text" value={originalText} readOnly className="h-96 resize-none" />
            </div>
            <div>
                <Label htmlFor="translated-text" className="mb-2 block">Translated ({languages.find(l => l.value === targetLang)?.label})</Label>
                <Textarea id="translated-text" value={translatedText} readOnly className="h-96 resize-none" />
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
                <p className="font-semibold">Drag & drop files here, or click to browse</p>
                <p className="text-sm text-muted-foreground">Supports Word, PDF, Excel, PowerPoint, Text</p>
                <div className="mt-4 flex items-center justify-center gap-4 text-muted-foreground">
                  <FileText />
                  <FileIcon />
                  <FileSpreadsheet />
                  <Presentation />
                </div>
                <input type="file" id="file-upload" className="hidden" onChange={onFileChange} accept=".txt,.pdf,.docx,.xlsx,.pptx" />
              </div>
          ) : (
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={clearFile} aria-label="Remove file">
                    <X className="h-5 w-5" />
                </Button>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="source-lang">Source Language</Label>
              <Select value={sourceLang} onValueChange={setSourceLang} disabled={isDetecting || isExtracting}>
                <SelectTrigger id="source-lang">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {sourceLanguages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-lang">Target Language</Label>
              <Select value={targetLang} onValueChange={setTargetLang} disabled={isLoading}>
                <SelectTrigger id="target-lang">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {targetLanguages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button
            size="lg"
            className="w-full"
            disabled={!file || !targetLang || isLoading}
            onClick={handleTranslate}
          >
            {isLoading && <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />}
            {loadingText}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
