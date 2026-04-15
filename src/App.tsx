import { Navbar } from "./components/Navbar";

export default function App() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-background selection:bg-white/20">
      {/* Background Video */}
      <div className="absolute inset-0 w-full h-full z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-60"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"
            type="video/mp4"
          />
        </video>
      </div>

      {/* Layout Overlays */}
      <div className="vignette"></div>

      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-8 min-h-[calc(100vh-84px)]">
        <div className="max-w-[900px] mx-auto flex flex-col items-center">
          <h1 
            className="text-[56px] sm:text-[72px] md:text-[96px] leading-[1.05] tracking-[-1px] font-medium text-foreground animate-fade-rise italic"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Chuyện Nhà 2k7
          </h1>
          
          <p className="text-muted-foreground text-lg sm:text-xl max-w-[700px] mt-8 leading-[1.6] animate-fade-rise-delay">
            Học không chơi đánh rơi tuổi trẻ, <br className="hidden sm:block" />
            học mà không có passmonez thì dễ đánh rơi tương like.
          </p>
          
          <button className="liquid-glass rounded-full px-14 py-[18px] text-base font-medium text-foreground mt-12 hover:scale-[1.03] transition-transform cursor-pointer animate-fade-rise-delay-2">
            Dzô
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 w-full py-8 text-center border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <p className="text-muted-foreground text-sm px-6">
          Website này được làm bằng mồ hôi, nước mắt và rất nhiều <em className="not-italic text-foreground">Jollibe.</em>
        </p>
      </footer>
    </main>
  );
}
