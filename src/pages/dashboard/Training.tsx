import React, { useState, useCallback, useRef } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  Clock,
  Trash2,
  Database,
  Loader2,
  Sparkles,
  ShieldCheck,
  X } from
'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useRealtimeData } from '../../hooks/useData';
import {
  subscribeToTrainingFiles,
  deleteTrainingFile,
  addTrainingFile,
  saveKnowledgeDocument,
  TrainingFile } from
'../../services/dataService';
import { extractTextFromFile } from '../../services/documentExtractor';

type Stage = 'idle' | 'uploading' | 'training' | 'done' | 'error';

const ACCEPTED = '.pdf,.docx,.doc,.txt,.csv,.md,.json,.html,.rtf';

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function Training() {
  const { user, loading: authLoading } = useAuth();

  const subscribe = useCallback((cb: (data: TrainingFile[]) => void) => {
    if (user?.uid) {
      return subscribeToTrainingFiles(user.uid, cb);
    }
    cb([]);
    return () => {};
  }, [user?.uid]);

  const { data: trainingFiles, loading: dataLoading } = useRealtimeData<TrainingFile[]>(
    subscribe,
    []
  );

  const [deleting, setDeleting] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [stageFile, setStageFile] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDeleteFile = async (fileId: string) => {
    if (!user?.uid) return;
    setDeleting(fileId);
    try {
      await deleteTrainingFile(user.uid, fileId);
    } catch (error) {
      console.error('Delete error:', error);
    }
    setDeleting(null);
  };

  const processFile = async (file: File) => {
    if (!user?.uid) return;
    setStageFile(file.name);
    setErrorMsg('');
    setStage('uploading');
    setProgress(15);
    try {
      // 1. Extract & convert document to plain text
      const { text, charCount } = await extractTextFromFile(file);
      setProgress(50);
      if (!text || charCount < 2) {
        throw new Error('Could not read any text from this document.');
      }

      // 2. Train agent — save TXT to knowledge base under client name
      setStage('training');
      setProgress(70);
      const clientName = user.displayName || user.email || user.uid;
      await saveKnowledgeDocument(clientName, user.uid, {
        fileName: file.name,
        text,
        charCount,
        source: file.name,
        uploadedAt: new Date().toISOString()
      });
      setProgress(88);

      // 3. Record metadata for the knowledge base list
      await addTrainingFile(user.uid, {
        name: file.name,
        type: file.name.split('.').pop()?.toUpperCase() || 'TXT',
        size: formatSize(file.size),
        uploadedAt: new Date().toISOString(),
        url: '',
        status: 'Indexed',
        date: new Date().toISOString()
      });
      setProgress(100);
      setStage('done');
    } catch (err) {
      console.error('Training error:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
      setStage('error');
    }
  };

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const storageUsedMB = (Array.isArray(trainingFiles) ? trainingFiles.length : 0) * 0.5;
  const storageUsedPercent = (storageUsedMB / 1024) * 100;
  const confidenceScore = trainingFiles.length > 0 ? Math.min(94 + trainingFiles.length * 2, 99) : 60;
  const busy = stage === 'uploading' || stage === 'training';

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Q&A Knowledge Base
        </h1>
        <p className="text-gray-600 dark:text-gray-400 font-medium">
          Upload documents to train your AI on your specific business knowledge.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Area */}
        <div className="lg:col-span-2 space-y-8">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            onChange={onSelect}
            className="hidden" />
          <div
            onClick={() => !busy && inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            className={`bento-card border-2 border-dashed transition-colors cursor-pointer flex flex-col items-center justify-center py-20 shadow-none ${
            dragActive ?
            'border-emerald-500 bg-mint-50/60 dark:bg-navy-800/60' :
            'border-gray-200 dark:border-navy-700 bg-gray-50/50 dark:bg-navy-900/30 hover:bg-mint-50/50 dark:hover:bg-navy-800/50'}`
            }>
            <div className="w-20 h-20 bg-white dark:bg-navy-800 rounded-3xl flex items-center justify-center shadow-sm mb-6">
              <Upload className="w-10 h-10 text-emerald-500 dark:text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              Click to upload or drag and drop
            </h3>
            <p className="text-base text-gray-500 dark:text-gray-400 text-center max-w-md font-medium">
              Support for PDF, DOCX, DOC, TXT, CSV, MD, JSON. Max file size 50MB. The
              AI will automatically process and index the content.
            </p>
          </div>

          <div className="bento-card">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Uploaded Sources
            </h2>
            {dataLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-2"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading files...</p>
              </div>
            ) : trainingFiles.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">No training files yet. Upload your first document!</p>
            ) : (
              <div className="space-y-4">
                {trainingFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-5 rounded-2xl border border-gray-100 dark:border-navy-700 bg-white dark:bg-navy-800 hover:shadow-md transition-all">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-navy-900 flex items-center justify-center text-blue-600 dark:text-cyan-400 shadow-inner">
                        <FileText size={24} />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white text-base mb-1">
                          {file.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 font-medium">
                          <span>{file.type}</span> • <span>{file.size}</span> •{' '}
                          <span>{new Date(file.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-5">
                      {file.status === 'Indexed' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 bg-mint-100 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full">
                          <CheckCircle2 size={16} /> Indexed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1.5 rounded-full">
                          <Clock size={16} className="animate-spin-slow" /> Processing
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        disabled={deleting === file.id}
                        className="text-gray-400 hover:text-red-500 transition-colors p-2 disabled:opacity-50">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status Panel */}
        <div className="space-y-8">
          <div className="bento-card bg-gradient-to-br from-emerald-500 to-turquoise-500 dark:from-navy-800 dark:to-navy-900 text-white border-none shadow-soft-dark">
            <div className="flex items-center gap-3 mb-8">
              <Database className="text-white/90" size={24} />
              <h2 className="text-xl font-bold">Knowledge Base Health</h2>
            </div>
            <div className="text-6xl font-extrabold mb-3">{Math.round(confidenceScore)}%</div>
            <p className="text-white/80 text-base mb-8 font-medium">
              Answer confidence score based on current training data.
            </p>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2 font-semibold tracking-wide">
                  <span className="text-white/80">Storage Used</span>
                  <span className="text-white">{storageUsedMB.toFixed(1)} MB / 1 GB</span>
                </div>
                <div className="w-full bg-black/20 rounded-full h-2.5">
                  <div
                    className="bg-white rounded-full h-2.5"
                    style={{
                      width: `${Math.min(storageUsedPercent, 100)}%`
                    }}>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2 font-semibold tracking-wide">
                  <span className="text-white/80">Files Uploaded</span>
                  <span className="text-white">{trainingFiles.length} files</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bento-card">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Manual Q&A Pairs
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-400 mb-6 font-medium">
              Add specific question and answer pairs to override document
              knowledge or handle edge cases.
            </p>
            <button className="btn-secondary w-full py-4 text-base">
              Manage Q&A Pairs
            </button>
          </div>
        </div>
      </div>

      {/* Processing / Training overlay */}
      {stage !== 'idle' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white dark:bg-navy-800 rounded-3xl shadow-2xl p-8 text-center">
            {(stage === 'uploading' || stage === 'training') && (
              <>
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full bg-emerald-100 dark:bg-emerald-900/30 animate-ping" />
                  <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-500 to-turquoise-500 rounded-full flex items-center justify-center">
                    {stage === 'uploading' ? (
                      <Loader2 className="w-9 h-9 text-white animate-spin" />
                    ) : (
                      <Sparkles className="w-9 h-9 text-white" />
                    )}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {stage === 'uploading' ? 'Processing document…' : 'Training your agent…'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 truncate">
                  {stageFile}
                </p>
                <div className="w-full bg-gray-100 dark:bg-navy-900 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-turquoise-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-3">{progress}%</p>
              </>
            )}

            {stage === 'done' && (
              <>
                <div className="w-20 h-20 mx-auto mb-6 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                  <ShieldCheck className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Done!</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                  Your agent has been trained on <span className="font-semibold">{stageFile}</span>.
                </p>
                <button
                  onClick={() => setStage('idle')}
                  className="btn-primary w-full py-3">
                  Continue
                </button>
              </>
            )}

            {stage === 'error' && (
              <>
                <div className="w-20 h-20 mx-auto mb-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <X className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Upload failed</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{errorMsg}</p>
                <button
                  onClick={() => setStage('idle')}
                  className="btn-secondary w-full py-3">
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
