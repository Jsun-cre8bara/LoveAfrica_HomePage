import { Heart, DollarSign, FileText, ChevronRight, Edit, Trash2, Plus } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Notice } from './NoticeEditor';

interface MainContentProps {
  notices: Notice[];
  isAdmin: boolean;
  onAddNotice: () => void;
  onEditNotice: (notice: Notice) => void;
  onDeleteNotice: (id: string) => void;
  onViewNotice?: (notice: Notice) => void;
}

export function MainContent({ notices, isAdmin, onAddNotice, onEditNotice, onDeleteNotice, onViewNotice }: MainContentProps) {
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
                정기/일시 후원을 통해<br />
                아프리카 어린이들을 도와주세요
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
                  후원 신청
                </a>
              </Button>
            </div>
          </Card>

          {/* 후원금 조회 */}
          <Card className="p-8 hover:shadow-lg transition-shadow bg-white">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4">
                <DollarSign className="text-white" size={32} />
              </div>
              <h3 className="text-2xl mb-4">후원금 조회</h3>
              <p className="text-gray-600 mb-6">
                나의 후원 내역을<br />
                확인할 수 있습니다
              </p>
              <Button variant="outline" className="w-full">조회하기</Button>
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
              <Button variant="outline" className="w-full" asChild>
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

          {/* 기부금 영수증 안내 */}
          <div className="space-y-6">
            <Card className="p-6 bg-white">
              <h3 className="text-xl mb-4 text-blue-600">기부금영수증</h3>
              <p className="text-gray-700 mb-4">
                기부금 영수증은 매년 1월에 일괄 발급됩니다.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">
                  ✓ 연말정산 공제 가능<br />
                  ✓ 기획재정부 지정 기부금 단체<br />
                  ✓ 세액공제 15% (1천만원 초과분 30%)
                </p>
              </div>
            </Card>

            <Card className="p-6 bg-white">
              <h3 className="text-xl mb-4 text-blue-600">연락처</h3>
              <div className="space-y-2 text-gray-700">
                <p>📞 전화: 1522-5158</p>
                <p>📧 이메일: <a href="mailto:loveafrica1004@gmail.com" className="hover:text-blue-600">loveafrica1004@gmail.com</a></p>
                <p>🏢 주소: 서울특별시 용산구 한강대로 44길 20, 301호</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}