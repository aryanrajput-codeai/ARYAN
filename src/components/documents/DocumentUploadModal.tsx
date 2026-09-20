import React, { useState } from 'react';
import { X, Upload, FileText, Check } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  clientId,
}) => {
  const { addClientDocument } = useData();

  const [docName, setDocName] = useState('');
  const [fileData, setFileData] = useState('');
  const [fileType, setFileType] = useState('PDF');
  const [fileSize, setFileSize] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocName(file.name);
    setFileSize(file.size);
    setFileType(file.type.includes('pdf') ? 'PDF' : file.type.includes('image') ? 'IMAGE' : 'DOC');

    const reader = new FileReader();
    reader.onload = (event) => {
      setFileData(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName || !fileData) {
      alert('Please select a valid document file.');
      return;
    }

    setIsUploading(true);
    try {
      await addClientDocument({
        client_id: clientId,
        name: docName,
        file_type: fileType,
        file_data: fileData,
        file_size: fileSize,
      });
      onClose();
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Upload Client Contract / SLA</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Document Display Name *
            </label>
            <input
              type="text"
              required
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="e.g. Signed SLA Agreement 2026.pdf"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium"
            />
          </div>

          <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-6 text-center bg-slate-50 transition-colors">
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload-input"
            />
            <label htmlFor="file-upload-input" className="cursor-pointer space-y-2 block">
              <FileText className="w-8 h-8 text-indigo-500 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">
                {docName ? `Selected: ${docName}` : 'Click to select Contract PDF or Image'}
              </p>
              <p className="text-[11px] text-slate-400">PDF, DOCX, PNG, JPG up to 10MB</p>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !fileData}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              {isUploading ? 'Uploading...' : 'Save Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
