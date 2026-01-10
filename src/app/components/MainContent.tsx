import React, { useState } from 'react';
import { Heart, DollarSign, FileText, ChevronRight, Edit, Trash2, Plus, Mail } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Notice } from './NoticeEditor';
import { Newsletter } from './NewsletterEditor';
import { DonationReceiptModal } from './DonationReceiptModal';

interface MainContentProps {
  notices: Notice[];
  newsletters: Newsletter[];
  isAdmin: boolean;
  onAddNotice: () => void;
  onEditNotice: (notice: Notice) => void;
  onDeleteNotice: (id: string) => void;
  onViewNotice?: (notice: Notice) => void;
  onAddNewsletter: () => void;
  onEditNewsletter: (newsletter: Newsletter) => void;
  onDeleteNewsletter: (id: string) => void;
  onViewNewsletter?: (newsletter: Newsletter) => void;
}

export function MainContent({ 
  notices, 
  newsletters, 
  isAdmin, 
  onAddNotice, 
  onEditNotice, 
  onDeleteNotice, 
  onViewNotice,
  onAddNewsletter,
  onEditNewsletter,
  onDeleteNewsletter,
  onViewNewsletter
}: MainContentProps) {
  // 게시된 뉴스레터만 필터링
  const publishedNewsletters = newsletters.filter(n => n.published);
  const [isDonationReceiptModalOpen, setIsDonationReceiptModalOpen] = useState(false);

  return (
    <section className="py-16 px-6 bg-gray-50">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* 후원하기 */}
          <Card className="p-8 hover:shadow-lg transition-shadow bg-white">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4">
                <Heart className="text-white" size={32} />
              </div>
              <h3 className="text-2xl mb-4">후원하기</h3>
              <p className="text-gray-600 mb-6">
                온라인 후원 신청서 작성<br />
                (정기/일시)
              </p>
              <Button 
                className="w-full" 
                asChild
              >
                <a 
                  href="https://docs.google.com/forms/d/e/1FAIpQLSfrcI9BTLGViDWpNFHTzwy_ClSa06EwCF-hzaTDamZTtPereQ/viewform" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  후원신청서 작성
                </a>
              </Button>
            </div>
          </Card>

          {/* 기부금 영수증 */}
          <Card className="p-8 hover:shadow-lg transition-shadow bg-white">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4">
                <DollarSign className="text-white" size={32} />
              </div>
              <h3 className="text-2xl mb-4">기부금 영수증</h3>
              <p className="text-gray-600 mb-6">
                기부금 영수증을<br />
                발급받으실 수 있습니다
              </p>
              <Button 
                className="w-full"
                onClick={() => setIsDonationReceiptModalOpen(true)}
              >
                발급하기
              </Button>
            </div>
          </Card>

          {/* 문의하기 */}
          <Card className="p-8 hover:shadow-lg transition-shadow bg-white">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4">
                <FileText className="text-white" size={32} />
              </div>
              <h3 className="text-2xl mb-4">문의하기</h3>
              <p className="text-gray-600 mb-6">
                후원 및 사업에 대한<br />
                문의를 남겨주세요
              </p>
              <Button className="w-full" asChild>
                <a href="mailto:loveafrica1004@gmail.com">문의하기</a>
              </Button>
            </div>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 공지사항 */}
          <Card className="p-6 bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl text-blue-600">공지사항</h3>
              <div className="flex gap-2">
                {isAdmin && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={onAddNotice}
                    className="text-blue-600"
                  >
                    <Plus size={16} className="mr-1" />
                    작성
                  </Button>
                )}
                <Button variant="ghost" size="sm">
                  더보기 <ChevronRight size={16} />
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              {notices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  등록된 공지사항이 없습니다.
                </div>
              ) : (
                notices.map((notice) => (
                  <div key={notice.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => onViewNotice && onViewNotice(notice)}
                    >
                      <div className="text-gray-900 hover:text-blue-600">
                        {notice.title}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-gray-500">{notice.date}</div>
                      {isAdmin && (
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditNotice(notice);
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              notice.id && onDeleteNotice(notice.id);
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* 뉴스레터 */}
          <Card className="p-6 bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl text-blue-600">뉴스레터</h3>
              <div className="flex gap-2">
                {isAdmin && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={onAddNewsletter}
                    className="text-blue-600"
                  >
                    <Plus size={16} className="mr-1" />
                    작성
                  </Button>
                )}
                <Button variant="ghost" size="sm">
                  더보기 <ChevronRight size={16} />
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              {publishedNewsletters.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {isAdmin ? '게시된 뉴스레터가 없습니다.' : '등록된 뉴스레터가 없습니다.'}
                </div>
              ) : (
                publishedNewsletters.slice(0, 5).map((newsletter) => (
                  <div key={newsletter.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => onViewNewsletter && onViewNewsletter(newsletter)}
                    >
                      <div className="text-gray-900 hover:text-blue-600 flex items-center gap-2">
                        <Mail size={16} className="text-blue-500" />
                        {newsletter.title}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-gray-500">
                        {new Date(newsletter.created_at).toLocaleDateString('ko-KR', { 
                          year: 'numeric', 
                          month: '2-digit', 
                          day: '2-digit' 
                        }).replace(/\. /g, '.').replace(/\.$/, '')}
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditNewsletter(newsletter);
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              newsletter.id && onDeleteNewsletter(newsletter.id);
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      <DonationReceiptModal 
        isOpen={isDonationReceiptModalOpen}
        onClose={() => setIsDonationReceiptModalOpen(false)}
      />
    </section>
  );
}