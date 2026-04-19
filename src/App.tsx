import React, { useState, useEffect, useRef } from "react";
import { Navbar } from "./components/Navbar";
import PassMonEzApp from "./components/PassMonEzApp";

export default function App() {
  const [view, setView] = useState<'hero' | 'app'>('hero');
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
      
      const xOffset = (e.clientX / window.innerWidth - 0.5) * 40;
      const yOffset = (e.clientY / window.innerHeight - 0.5) * 40;
      setParallax({ x: xOffset, y: yOffset });

      const target = e.target as HTMLElement;
      const isClickable = !!target.closest('button, a, input, textarea, .draggable-card, .card-press, .cursor-pointer, .action-btn, label');
      setIsHovering(isClickable);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (view === 'app') {
    return (
      <>
        <div 
          className={`custom-cursor shadow-lg ${isHovering ? 'cursor-hover' : ''}`}
          style={{ left: cursorPos.x, top: cursorPos.y }}
        />
        <div className="space-bg">
          <div className="nebula"></div>
          <div 
            className="stars-layer-1" 
            style={{ transform: `translate(${parallax.x * 0.5}px, ${parallax.y * 0.5}px)` }}
          ></div>
          <div 
            className="stars-layer-2" 
            style={{ transform: `translate(${parallax.x}px, ${parallax.y}px)` }}
          ></div>
          <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-screen">
            <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4" type="video/mp4" />
          </video>
          <div className="vignette"></div>
        </div>
        <PassMonEzApp onBack={() => setView('hero')} />
      </>
    );
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#00101f] selection:bg-white/20">
      <div 
        className={`custom-cursor shadow-lg ${isHovering ? 'cursor-hover' : ''}`}
        style={{ left: cursorPos.x, top: cursorPos.y }}
      />
      
      {/* Space Parallax Background */}
      <div className="space-bg">
        <div className="nebula"></div>
        <div 
          className="stars-layer-1" 
          style={{ transform: `translate(${parallax.x * 0.5}px, ${parallax.y * 0.5}px)` }}
        ></div>
        <div 
          className="stars-layer-2" 
          style={{ transform: `translate(${parallax.x}px, ${parallax.y}px)` }}
        ></div>
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-screen"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"
            type="video/mp4"
          />
        </video>
        <div className="vignette"></div>
      </div>

      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-8 min-h-[calc(100vh-84px)]">
        <div className="max-w-[950px] mx-auto flex flex-col items-center">
          <h1 
            className="text-[56px] sm:text-[72px] md:text-[96px] leading-[1.05] tracking-[-1px] font-bold text-transparent bg-clip-text bg-gradient-to-br from-white via-sky-100 to-stone-400 drop-shadow-2xl animate-slide-up italic"
            style={{ fontFamily: "var(--font-display)", animationDelay: "0.1s" }}
          >
            Chuyện Nhà<br />Sinh Viên
          </h1>
          
          <p className="text-sky-100/80 text-lg sm:text-xl max-w-[700px] mt-8 leading-[1.6] font-medium animate-slide-up" style={{ animationDelay: "0.2s" }}>
            Học không chơi đánh rơi tuổi trẻ, <br className="hidden sm:block" />
            học mà không có passmonez thì dễ đánh rơi tương like.
          </p>
          
          <button 
            onClick={() => setView('app')}
            className="liquid-glass btn-glow rounded-full px-16 py-5 text-lg font-bold mt-12 hover:bg-white/10 text-white transition-all animate-slide-up"
            style={{ animationDelay: "0.3s" }}
          >
            Vào Học Thôi 🚀
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 w-full py-8 text-center border-t border-white/10 bg-[#00101f]/50 backdrop-blur-md animate-slide-up" style={{ animationDelay: "0.4s" }}>
        <p className="text-stone-400 text-sm px-6">
          Website này được làm bằng mồ hôi, nước mắt và rất nhiều <em className="not-italic text-sky-400 font-bold">Jollibee.</em>
        </p>
      </footer>
    </main>
  );
}
