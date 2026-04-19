import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Info, LifeBuoy, Facebook, MessageCircle } from "lucide-react";

export function Navbar() {
  return (
    <nav className="relative z-10 flex flex-col sm:flex-row justify-between items-center px-8 sm:px-16 py-6 sm:py-8 max-w-[1024px] mx-auto w-full gap-4 sm:gap-0 animate-slide-up">
      <div className="flex items-center">
        <span 
          className="text-[28px] tracking-tight font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400"
          style={{ fontFamily: "var(--font-display)" }}
        >
          passmonez<sup className="text-[10px] -top-[1em] text-sky-400">®</sup>
        </span>
      </div>
      
      <div className="flex items-center space-x-6 sm:space-x-8">
        <a href="#" className="text-[12px] sm:text-[13px] text-stone-300 hover:text-white font-medium transition-colors relative group">
          Trang chủ
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-sky-400 transition-all group-hover:w-full"></span>
        </a>
        
        <Dialog>
          <DialogTrigger asChild>
            <span className="text-[12px] sm:text-[13px] text-stone-300 hover:text-white font-medium transition-colors cursor-pointer relative group">
              About Us
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-sky-400 transition-all group-hover:w-full"></span>
            </span>
          </DialogTrigger>
          <DialogContent className="liquid-glass border-white/20 rounded-[32px] max-w-md w-full mx-4 text-white">
            <DialogHeader>
              <DialogTitle style={{ fontFamily: "var(--font-display)" }} className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400 text-center">Về Chúng Tôi</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 w-full bg-black/20 p-6 rounded-2xl border border-white/5 mt-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className="text-stone-400">Coding by</span>
                <span className="text-white font-bold">Thiên Phúc</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className="text-stone-400">Assistant</span>
                <span className="text-white font-bold whitespace-nowrap">Aistudio, Động Sếch Gay</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Software</span>
                <span className="text-white font-bold">VS Code, Notepad</span>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <span className="text-[12px] sm:text-[13px] text-stone-300 hover:text-white font-medium transition-colors cursor-pointer relative group">
              Cứu trợ khẩn cấp
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-400 transition-all group-hover:w-full"></span>
            </span>
          </DialogTrigger>
          <DialogContent className="liquid-glass border-white/20 rounded-[32px] max-w-md w-full mx-4 text-white">
            <DialogHeader className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4 border border-red-500/30">
                <LifeBuoy className="w-8 h-8 text-red-400 icon-3d" />
              </div>
              <DialogTitle style={{ fontFamily: "var(--font-display)" }} className="text-3xl font-bold text-center">Cứu trợ khẩn cấp</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 w-full mt-4">
              <a href="https://www.facebook.com/ta.thien.phuc.922208?locale=vi_VN" target="_blank" rel="noopener noreferrer" className="flex items-center p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 hover:bg-sky-500/20 transition-colors group">
                <Facebook className="w-6 h-6 text-sky-400 mr-4" />
                <div className="text-left">
                  <p className="text-[10px] text-sky-300/80 font-bold uppercase">Facebook Cá Nhân</p>
                  <p className="text-sm font-semibold text-white group-hover:text-sky-300 truncate w-48">Tạ Thiên Phúc</p>
                </div>
              </a>
              <a href="https://zalo.me/0909747714" target="_blank" rel="noopener noreferrer" className="flex items-center p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors group">
                <MessageCircle className="w-6 h-6 text-blue-400 mr-4" />
                <div className="text-left">
                  <p className="text-[10px] text-blue-300/80 font-bold uppercase">Zalo Support</p>
                  <p className="text-sm font-semibold text-white group-hover:text-blue-300">0909.747.714</p>
                </div>
              </a>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="hidden sm:block w-[120px]"></div>
    </nav>
  );
}
