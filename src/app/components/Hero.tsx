import { useState, useEffect } from 'react';
import image01 from '../../assets/image01.png';
import image02 from '../../assets/image02.jpg';
import image03 from '../../assets/image03.jpg';
import image04 from '../../assets/image04.jpg';

const allImages = [
  { src: image01, alt: 'Hero Image 1' },
  { src: image02, alt: 'Hero Image 2' },
  { src: image03, alt: 'Hero Image 3' },
  { src: image04, alt: 'Hero Image 4' },
];

const desktopImages = [
  { src: image01, alt: 'Hero Image 1' },
  { src: image03, alt: 'Hero Image 3' },
];

export function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return true;
  });

  // 화면 크기에 따른 이미지 배열
  const heroImages = isMobile ? allImages : desktopImages;

  useEffect(() => {
    // 화면 크기 확인 함수
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768; // Tailwind md 브레이크포인트
      setIsMobile((prevMobile) => {
        if (prevMobile !== mobile) {
          // 화면 크기가 변경되면 인덱스를 0으로 리셋
          setCurrentIndex(0);
        }
        return mobile;
      });
    };

    // resize 이벤트 리스너 추가
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const images = isMobile ? allImages : desktopImages;
        return (prevIndex + 1) % images.length;
      });
    }, 5000); // 5초마다 이미지 전환

    return () => clearInterval(interval);
  }, [isMobile]);

  return (
    <section className="relative h-[500px] overflow-hidden">
      <div className="relative w-full h-full">
        {heroImages.map((image, index) => (
          <img
            key={index}
            src={image.src}
            alt={image.alt}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
      </div>
      <div className="absolute inset-0 bg-black/20"></div>
      
      <div className="absolute inset-0 container mx-auto px-6 md:flex md:items-center md:justify-between">
        {/* 타이틀 - 모바일: 좌측 상단 (25% 크기), 데스크톱: 좌측 중앙 (원래 크기) */}
        <div className="absolute top-4 left-6 md:relative md:top-0 md:left-0">
          <div className="w-[72px] h-[72px] md:w-72 md:h-72 bg-blue-500 rounded-full flex items-center justify-center text-white">
            <div className="text-center">
              <div className="text-xs md:text-5xl font-bold md:mb-2">LOVE</div>
              <div className="text-xs md:text-5xl font-bold">AFRICA</div>
            </div>
          </div>
        </div>
        
        {/* 오른쪽 텍스트 - 모바일: 하단 우측, 데스크톱: 우측 중앙 */}
        <div className="absolute bottom-6 right-6 md:relative md:bottom-0 md:right-0 text-white text-right">
          <h1 className="text-2xl md:text-5xl mb-2 md:mb-4">우리는 함께</h1>
          <h1 className="text-2xl md:text-5xl">기적을 만듭니다.</h1>
        </div>
      </div>
    </section>
  );
}
