import { useState, useEffect } from 'react';
import { X, Upload, FileText, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

export interface NewsletterAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface Newsletter {
  id?: string;
  title: string;
  content: string;
  published: boolean;
  created_at: string;
  updated_at?: string;
  attachments?: NewsletterAttachment[];
}

interface NewsletterEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newsletter: Newsletter, files?: File[]) => Promise<void>;
  editingNewsletter?: Newsletter | null;
}

export function NewsletterEditor({ isOpen, onClose, onSave, editingNewsletter }: NewsletterEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [published, setPublished] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<NewsletterAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (editingNewsletter) {
      setTitle(editingNewsletter.title);
      setContent(editingNewsletter.content || '');
      setPublished(editingNewsletter.published);
      setExistingAttachments(editingNewsletter.attachments || []);
      setFiles([]);
    } else {
      setTitle('');
      setContent('');
      setPublished(false);
      setFiles([]);
      setExistingAttachments([]);
    }
  }, [editingNewsletter]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = (index: number) => {
    setExistingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    if (!content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const newsletter: Newsletter = {
        id: editingNewsletter?.id,
        title,
        content,
        published,
        created_at: editingNewsletter?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        attachments: existingAttachments,
      };

      await onSave(newsletter, files);
      
      setTitle('');
      setContent('');
      setPublished(false);
      setFiles([]);
      setExistingAttachments([]);
      onClose();
    } catch (err: any) {
      console.error('Save error in NewsletterEditor:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl bg-white relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
        >
          <X size={24} />
        </button>

        <div className="p-8">
          <h2 className="text-2xl mb-6">
            {editingNewsletter ? '뉴스레터 수정' : '뉴스레터 작성'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 제목 입력 */}
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <label className="block text-sm font-semibold mb-2 text-gray-700">제목</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                placeholder="뉴스레터 제목을 입력하세요"
                required
              />
            </div>

            {/* 본문 내용 입력 */}
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <label className="block text-sm font-semibold mb-2 text-gray-700">본문 내용</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-h-[300px] resize-vertical"
                placeholder="뉴스레터 내용을 입력하세요"
                rows={12}
                required
              />
            </div>

            {/* 게시 여부 */}
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-semibold text-gray-700">
                  게시하기 (체크 해제 시 임시 저장)
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-2 ml-8">
                게시된 뉴스레터만 사용자에게 표시됩니다.
              </p>
            </div>

            {/* 파일 첨부 */}
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <label className="block text-sm font-semibold mb-2 text-gray-700">파일 첨부</label>
              
              <div className="mb-4">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Upload size={18} />
                  <span className="text-sm">파일 선택</span>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">PDF, 문서, 이미지 파일을 첨부할 수 있습니다.</p>
              </div>

              {/* 기존 첨부파일 목록 */}
              {existingAttachments.length > 0 && (
                <div className="space-y-2 mb-3">
                  <p className="text-sm font-medium text-gray-600">기존 첨부파일</p>
                  {existingAttachments.map((attachment, index) => (
                    <div key={index} className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 flex-1">
                        <FileText size={18} className="text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{attachment.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExistingAttachment(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 새로 추가한 파일 목록 */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">새로 추가된 파일</p>
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 flex-1">
                        <FileText size={18} className="text-gray-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? '저장 중...' : '저장'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}


