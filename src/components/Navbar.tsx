import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function Navbar() {
  return (
    <nav className="relative z-10 flex flex-col sm:flex-row justify-between items-center px-8 sm:px-16 py-6 sm:py-8 max-w-[1024px] mx-auto w-full gap-4 sm:gap-0">
      <div className="flex items-center">
        <span 
          className="text-[28px] tracking-tight text-foreground font-normal"
          style={{ fontFamily: "var(--font-display)" }}
        >
          passmonez<sup className="text-[10px] -top-[1em]">®</sup>
        </span>
      </div>
      
      <div className="flex items-center space-x-6 sm:space-x-8">
        <a href="#" className="text-[12px] sm:text-[13px] text-foreground font-medium transition-colors">Trang chủ</a>
        
        <Dialog>
          <DialogTrigger asChild>
            <button className="text-[12px] sm:text-[13px] text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer">
              About Us
            </button>
          </DialogTrigger>
          <DialogContent className="bg-background/95 backdrop-blur-md border-border text-foreground">
            <DialogHeader>
              <DialogTitle style={{ fontFamily: "var(--font-display)" }} className="text-2xl">About Us</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-muted-foreground leading-relaxed">
                <span className="text-foreground font-medium">Coding by:</span> Thiên Phúc<br />
                <span className="text-foreground font-medium">Assistant:</span> Aistudio, Canva, Động Sếch Gay<br />
                <span className="text-foreground font-medium">Software:</span> VS Code, Notepad
              </p>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <button className="text-[12px] sm:text-[13px] text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer">
              Cứu trợ khẩn cấp
            </button>
          </DialogTrigger>
          <DialogContent className="bg-background/95 backdrop-blur-md border-border text-foreground">
            <DialogHeader>
              <DialogTitle style={{ fontFamily: "var(--font-display)" }} className="text-2xl">Cứu trợ khẩn cấp</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Facebook</span>
                <a 
                  href="https://www.facebook.com/ta.thien.phuc.922208?locale=vi_VN" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline break-all"
                >
                  facebook.com/ta.thien.phuc.922208
                </a>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Zalo</span>
                <p className="text-foreground text-lg font-medium">0909747714</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Spacer to help center the middle links on desktop */}
      <div className="hidden sm:block w-[120px]"></div>
    </nav>
  );
}
