/// <reference types="vite/client" />
import React, { useEffect, useState, useRef } from 'react';
import {
  Upload,
  Trash2,
  Check,
  Loader,
  AlertCircle,
  BookOpen,
  File
} from 'lucide-react';

interface Document {
  id: string;
  title: string;
  content: string;
  uploadedAt: string;
  uploadedBy: string;
  size: number;
  status: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

export function AdminKnowledge() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [isTraining, setIsTraining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/kb/documents`);
      
      if (!response.ok) {
        throw new Error('Failed to load documents');
      }
      
      const data = await response.json();
      setDocuments(data.documents || []);
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load documents';
      setError(errorMsg);
      console.error('Error loading documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.txt')) {
      setError('Only .txt files are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccess(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/api/admin/kb/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      // Simulate training animation
      setIsTraining(true);
      for (let i = 0; i <= 100; i += 10) {
        setTrainingProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      setTrainingProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsTraining(false);
      setTrainingProgress(0);

      setSuccess(`✅ Successfully trained AI with "${file.name}". The knowledge is now available to all clients!`);
      await loadDocuments();
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMsg);
      console.error('Error uploading file:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/admin/kb/documents/${docId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      setSuccess('Document deleted successfully');
      await loadDocuments();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Delete failed';
      setError(errorMsg);
      console.error('Error deleting document:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <BookOpen className="text-emerald-500" size={28} />
          Global Knowledge Base
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Upload .txt files with knowledge content. The AI will use this to provide informed responses to all clients.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900 dark:text-red-400">Error</p>
            <p className="text-sm text-red-800 dark:text-red-300 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-lg flex items-start gap-3">
          <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-900 dark:text-green-400">Success!</p>
            <p className="text-sm text-green-800 dark:text-green-300 mt-1">{success}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Section */}
        <div className="lg:col-span-1">
          <div className="bento-card">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Upload size={20} className="text-emerald-500" />
              Upload Knowledge
            </h2>

            {/* Training Animation */}
            {isTraining && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Loader className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-400">
                    Training AI with your knowledge...
                  </p>
                </div>
                <div className="w-full h-2 bg-blue-200 dark:bg-blue-900/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                    style={{ width: `${trainingProgress}%` }}
                  />
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 text-center">
                  {trainingProgress}% complete
                </p>
              </div>
            )}

            {/* Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                dragActive
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10'
                  : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400 dark:hover:border-emerald-500'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Drag and drop your .txt file
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                or click to browse (Max 5MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt"
                onChange={handleFileInputChange}
                disabled={uploading || isTraining}
                className="hidden"
              />
            </div>

            {uploading && (
              <div className="mt-3 flex items-center gap-2">
                <Loader className="w-4 h-4 text-emerald-600 animate-spin" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Uploading...</p>
              </div>
            )}

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
              <p className="text-xs text-blue-900 dark:text-blue-400">
                <strong>Tip:</strong> Upload plain text files with your knowledge content. 
                The AI will read and learn from it to provide better answers.
              </p>
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div className="lg:col-span-2">
          <div className="bento-card">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <File size={20} className="text-cyan-500" />
              Uploaded Documents ({documents.length})
            </h2>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-6 h-6 text-gray-400 animate-spin" />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8">
                <File className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-400">
                  No documents uploaded yet. Upload your first knowledge file!
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <File className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {doc.title}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {formatFileSize(doc.size)} • {formatDate(doc.uploadedAt)}
                      </p>
                      {doc.content && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                          {doc.content.substring(0, 100)}...
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-600 dark:text-red-400 transition-colors flex-shrink-0"
                      title="Delete document"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bento-card bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-900/10 dark:to-cyan-900/10 border border-emerald-200 dark:border-emerald-900/30">
        <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-300 mb-2">
          ℹ️ How It Works
        </h3>
        <ul className="text-xs text-emerald-800 dark:text-emerald-400 space-y-1">
          <li>✓ Upload .txt files with your knowledge content</li>
          <li>✓ The AI learns from this knowledge</li>
          <li>✓ When users ask questions, Claude uses this knowledge to provide professional responses</li>
          <li>✓ All clients automatically get access to the knowledge base</li>
        </ul>
      </div>
    </div>
  );
}