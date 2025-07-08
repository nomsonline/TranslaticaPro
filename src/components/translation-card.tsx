'use client';

import { detectSourceLanguage } from '@/ai/flows/auto-detect-source-language';
import { generateTranslationQualityHints } from '@/ai/flows/generate-translation-quality-hints';
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

  const [isLoading, setIsLoading] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);

  const [originalText, setOriginalText] = useState('');
  const [translatedText, setTranslatedText] = useState('');

  const [qualityHints, setQualityHints] = useState('');
  const [isFetchingHints, setIsFetchingHints] = useState(false);

  const { toast } = useToast();

  const handleFileSelect = useCallback(
    (selectedFile: File) => {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        setOriginalText(text);

        if (sourceLang === 'auto') {
          setIsDetecting(true);
          try {
            const result = await detectSourceLanguage({ text });
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
      };
      reader.onerror = () => {
        toast({
          variant: 'destructive',
          title: 'File Error',
          description: 'Failed to read the file.',
        });
      };
      reader.readAsText(selectedFile);
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
    if (sourceLang !== 'auto') {
      setSourceLang('auto');
    }
  };

  const handleTranslate = async () => {
    if (!file || !targetLang) return;
    setIsLoading(true);
    // Simulate translation API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const mockTranslation = `(Translated) ${originalText
      .split('')
      .reverse()
      .join('')}`;
    setTranslatedText(mockTranslation);
    setIsLoading(false);
    setView('preview');
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
                <Button size="sm">
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
                <input type="file" id="file-upload" className="hidden" onChange={onFileChange} />
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
              <Select value={sourceLang} onValueChange={setSourceLang} disabled={isDetecting}>
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
              <Select value={targetLang} onValueChange={setTargetLang}>
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
            disabled={!file || !targetLang || isLoading || isDetecting}
            onClick={handleTranslate}
          >
            {(isLoading || isDetecting) && <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />}
            {isLoading ? 'Translating...' : isDetecting ? 'Detecting...' : 'Translate'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
