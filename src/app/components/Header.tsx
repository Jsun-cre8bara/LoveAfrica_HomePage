import { Menu, X, LogOut } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import logoImage from '../../assets/9cdfaca214ac12f6d1e899df895449f48cad4c88.png';

interface HeaderProps {
  isAdmin: boolean;
  onAdminLogin: () => void;
  onAdminLogout: () => void;
}

export function Header({ isAdmin, onAdminLogin, onAdminLogout }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200">
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={logoImage} 
              alt="LOA Logo" 
              className="h-12 w-auto"
            />
            <span className="text-xl font-bold text-gray-800">LOVE FOR AFRICA</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#about" className="text-gray-700 hover:text-blue-600 transition-colors">
              LOA소개
            </a>
            <a href="#projects" className="text-gray-700 hover:text-blue-600 transition-colors">
              후원사업안내
            </a>
            <a href="#donate" className="text-gray-700 hover:text-blue-600 transition-colors">
              후원하기
            </a>
            <a href="#newsletter" className="text-gray-700 hover:text-blue-600 transition-colors">
              뉴스레터
            </a>
            <a href="#notices" className="text-gray-700 hover:text-blue-600 transition-colors">
              공지/알림
            </a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {isAdmin ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">관리자</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={onAdminLogout}
                >
                  <LogOut size={16} className="mr-1" />
                  로그아웃
                </Button>
              </div>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={onAdminLogin}
                >
                  관리자
                </Button>
                <Button size="sm">후원하기</Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 flex flex-col gap-4">
            <a href="#about" className="text-gray-700 hover:text-blue-600 transition-colors">
              LOA소개
            </a>
            <a href="#projects" className="text-gray-700 hover:text-blue-600 transition-colors">
              후원사업안내
            </a>
            <a href="#donate" className="text-gray-700 hover:text-blue-600 transition-colors">
              후원하기
            </a>
            <a href="#newsletter" className="text-gray-700 hover:text-blue-600 transition-colors">
              뉴스레터
            </a>
            <a href="#notices" className="text-gray-700 hover:text-blue-600 transition-colors">
              공지/알림
            </a>
            {isAdmin ? (
              <Button 
                size="sm" 
                className="w-full"
                onClick={onAdminLogout}
              >
                로그아웃
              </Button>
            ) : (
              <>
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={onAdminLogin}
                >
                  관리자 로그인
                </Button>
                <Button size="sm" className="w-full">후원하기</Button>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}