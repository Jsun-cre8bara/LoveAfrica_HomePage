import { X, FileText, Calendar } from 'lucide-react';
import { Card } from './ui/card';
import { Newsletter } from './NewsletterEditor';

interface NewsletterDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  newsletter: Newsletter | null;
}

export function NewsletterDetailModal({ isOpen, onClose, newsletter }: NewsletterDetailModalProps) {
  if (!isOpen || !newsletter) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
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
          {/* 제목 */}
          <h2 className="text-3xl font-bold mb-4 pr-8">
            {newsletter.title}
          </h2>

          {/* 날짜 정보 */}
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-6 pb-6 border-b">
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <span>작성일: {formatDate(newsletter.created_at)}</span>
            </div>
            {newsletter.updated_at && newsletter.updated_at !== newsletter.created_at && (
              <div className="flex items-center gap-2">
                <span>수정일: {formatDate(newsletter.updated_at)}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                newsletter.published 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {newsletter.published ? '게시됨' : '임시저장'}
              </span>
            </div>
          </div>

          {/* 본문 내용 */}
          <div className="prose max-w-none mb-6">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {newsletter.content}
            </div>
          </div>

          {/* 첨부파일 */}
          {newsletter.attachments && newsletter.attachments.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText size={20} />
                첨부파일
              </h3>
              <div className="space-y-2">
                {newsletter.attachments.map((attachment, index) => (
                  <a
                    key={index}
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText size={20} className="text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{attachment.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                      </div>
                    </div>
                    <span className="text-sm text-blue-600 hover:text-blue-700">다운로드</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}


