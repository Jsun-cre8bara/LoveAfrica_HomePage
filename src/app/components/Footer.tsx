import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-100 text-gray-700 py-12 px-6 border-t">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-xl mb-4 font-semibold">LOVE FOR AFRICA</h3>
            <p className="text-sm mb-4">
              아프리카 어린이들의 더 나은 미래를 위해<br />
              함께 노력하는 비영리 단체입니다.
            </p>
            <div className="text-sm space-y-1">
              <p>대표자: 이형로 | 고유번호증: 573-82-00144</p>
              <p>주소: 서울특별시 용산구 한강대로 44길 20, 301호(한강로2가)</p>
              <p>대표전화: 1522-5158</p>
              <p>이메일: <a href="mailto:loveafrica1004@gmail.com" className="hover:text-blue-600">loveafrica1004@gmail.com</a></p>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg mb-4 font-semibold">후원 계좌</h4>
            <div className="text-sm space-y-2 bg-white p-4 rounded-lg">
              <p>신한은행: 100-032-649001</p>
              <p>예금주: 사단법인 러브아프리카</p>
              <p className="text-xs text-gray-500 mt-3">
                * 후원금은 아프리카 어린이 교육, 의료, 식수 지원 등에 사용됩니다.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-300 pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="text-sm">
                <span className="font-semibold">외교부 지정 비영리단체</span>
              </div>
              <div className="text-sm">
                <span className="font-semibold">서울시 후원단체</span>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              &copy; 2026 LOVE FOR AFRICA. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}