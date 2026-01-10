import { useState, useEffect } from 'react';
import image01 from '../../assets/image01.png';
import image02 from '../../assets/image02.jpg';
import image03 from '../../assets/image03.jpg';
import image04 from '../../assets/image04.jpg';

const heroImages = [
  { src: image01, alt: 'Hero Image 1' },
  { src: image02, alt: 'Hero Image 2' },
  { src: image03, alt: 'Hero Image 3' },
  { src: image04, alt: 'Hero Image 4' },
];

export function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 5000); // 5초마다 이미지 전환

    return () => clearInterval(interval);
  }, []);

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
      
      <div className="absolute inset-0 container mx-auto px-6 flex items-center justify-between">
        <div className="relative">
          <div className="w-72 h-72 bg-blue-500 rounded-full flex items-center justify-center text-white">
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">LOVE</div>
              <div className="text-5xl font-bold">AFRICA</div>
            </div>
          </div>
        </div>
        
        <div className="text-white text-right">
          <h1 className="text-5xl mb-4">우리는 함께</h1>
          <h1 className="text-5xl">기적을 만듭니다.</h1>
        </div>
      </div>
    </section>
  );
}
