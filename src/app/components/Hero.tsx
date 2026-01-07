export function Hero() {
  return (
    <section className="relative h-[500px] overflow-hidden">
      <img
        src="https://images.unsplash.com/photo-1724491801484-efca6936866a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwY2hpbGRyZW4lMjBzbWlsaW5nfGVufDF8fHx8MTc2NzUyMjEwOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
        alt="Children smiling"
        className="w-full h-full object-cover"
      />
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
