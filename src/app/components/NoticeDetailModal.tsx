import { X, Download, FileText, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Notice, NoticeAttachment } from './NoticeEditor';

interface NoticeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  notice: Notice | null;
}

export function NoticeDetailModal({ isOpen, onClose, notice }: NoticeDetailModalProps) {
  if (!isOpen || !notice) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isPDF = (attachment: NoticeAttachment) => {
    return attachment.type === 'application/pdf' || attachment.name.toLowerCase().endsWith('.pdf');
  };

  const isImage = (attachment: NoticeAttachment) => {
    return attachment.type?.startsWith('image/') || 
           /\.(jpg|jpeg|png|gif|webp)$/i.test(attachment.name);
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
          {/* 제목 영역 */}
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">{notice.title}</h2>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Eye size={16} />
                조회수 {notice.views}
              </span>
              <span>•</span>
              <span>{notice.date}</span>
            </div>
          </div>

          {/* 본문 내용 영역 */}
          <div className="mb-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 min-h-[200px]">
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                {notice.content || '내용이 없습니다.'}
              </p>
            </div>
          </div>

          {/* 첨부파일 영역 */}
          {notice.attachments && notice.attachments.length > 0 && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">첨부파일</h3>
              
              <div className="space-y-4">
                {notice.attachments.map((attachment, index) => (
                  <div key={index}>
                    {/* 파일 정보 */}
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3 flex-1">
                        <FileText size={24} className="text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{attachment.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                        </div>
                      </div>
                      <a
                        href={attachment.url}
                        download={attachment.name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <Download size={16} />
                        다운로드
                      </a>
                    </div>

                    {/* PDF 미리보기 */}
                    {isPDF(attachment) && (
                      <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden bg-white">
                        <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                          <p className="text-sm text-gray-700">PDF 미리보기</p>
                        </div>
                        <div className="p-4">
                          <iframe
                            src={attachment.url}
                            className="w-full h-[600px] border-0"
                            title={`PDF Preview: ${attachment.name}`}
                          />
                        </div>
                      </div>
                    )}

                    {/* 이미지 미리보기 */}
                    {isImage(attachment) && (
                      <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden bg-white p-4">
                        <img
                          src={attachment.url}
                          alt={attachment.name}
                          className="max-w-full h-auto rounded"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 닫기 버튼 */}
          <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
            <Button onClick={onClose} variant="outline">
              닫기
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
