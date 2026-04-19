import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy 
} from "firebase/firestore";
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from "firebase/storage";
import { 
  ArrowLeft, 
  Plus, 
  X, 
  UploadCloud, 
  ExternalLink, 
  Edit2, 
  Trash2, 
  GripVertical, 
  PlayCircle, 
  FileText, 
  Download, 
  Timer, 
  List, 
  Clock, 
  Share2, 
  Copy,
  ChevronRight,
  Grip,
  ZoomIn,
  Power,
  Wand2,
  FileUp,
  Award,
  CircleDashed,
  AlertTriangle,
  CalendarClock,
  CheckCircle,
  MessageCircle,
  Facebook
} from 'lucide-react';
import confetti from 'canvas-confetti';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

// Firebase Config from User
const firebaseConfig = {
  apiKey: "AIzaSyDzwFZotQFJdxy32lWbvyN79Ev7L1wp8aA",
  authDomain: "pass-mon-ez.firebaseapp.com",
  projectId: "pass-mon-ez",
  storageBucket: "pass-mon-ez.firebasestorage.app",
  messagingSenderId: "150479855404",
  appId: "1:150479855404:web:068bea5aecfd0670971689",
  measurementId: "G-FJ5BJ8XK2T"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

const categoryConfig: any = {
  'on-thi': { label: 'Ôn Thi', color: 'amber', hasDeadline: true, icon: '📚', hasQuiz: false },
  'bai-hoc': { label: 'Bài Học', color: 'sky', hasDeadline: false, icon: '🎓', hasQuiz: false },
  'bai-tap': { label: 'Bài Tập', color: 'emerald', hasDeadline: true, icon: '📝', hasQuiz: false },
  'trac-nghiem': { label: 'Trắc Nghiệm', color: 'violet', hasDeadline: false, icon: '❓', hasQuiz: true }
};

const colorMap: any = {
  amber: { bg: 'bg-amber-500', text: 'text-amber-600', hover: 'hover:border-amber-400', light: 'bg-amber-50', border: 'border-amber-200' },
  sky: { bg: 'bg-sky-500', text: 'text-sky-600', hover: 'hover:border-sky-400', light: 'bg-sky-50', border: 'border-sky-200' },
  emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600', hover: 'hover:border-emerald-400', light: 'bg-emerald-50', border: 'border-emerald-200' },
  violet: { bg: 'bg-violet-500', text: 'text-violet-600', hover: 'hover:border-violet-400', light: 'bg-violet-50', border: 'border-violet-200' }
};

export default function PassMonEzApp({ onBack }: { onBack: () => void }) {
  const [screen, setScreen] = useState('home');
  const [allData, setAllData] = useState<any[]>([]);
  const [currentCategory, setCurrentCategory] = useState('');
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    if (editingItem && editingItem.links) {
      const items = editingItem.links.split('\n').filter((l: string) => l.trim()).map((line: string) => {
        const [url, ...noteParts] = line.split('|');
        return { url, note: noteParts.join('|') };
      });
      setLinkItems(items.length > 0 ? items : [{ url: '', note: '' }]);
    } else {
      setLinkItems([{ url: '', note: '' }]);
    }
  }, [editingItem]);
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [quizPreview, setQuizPreview] = useState<any>(null);
  const [quizTest, setQuizTest] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<any[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [quizTimer, setQuizTimer] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [saveError, setSaveError] = useState('');
  const [currentTab, setCurrentTab] = useState<'link' | 'file'>('link');
  const [linkItems, setLinkItems] = useState<{ url: string; note: string }[]>([{ url: '', note: '' }]);
  const [categoryOrder, setCategoryOrder] = useState(['on-thi', 'bai-hoc', 'bai-tap', 'trac-nghiem']);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectedQuizzes, setSelectedQuizzes] = useState<Set<string>>(new Set());
  const [mediaViewer, setMediaViewer] = useState<{ src: string, type: 'image' | 'video' } | null>(null);
  const [docViewer, setDocViewer] = useState<{ src: string, type: string, name: string } | null>(null);
  const [extractStatus, setExtractStatus] = useState('');
  const [wrongQuestionsCache, setWrongQuestionsCache] = useState<any[]>([]);
  const [draggedSubjectId, setDraggedSubjectId] = useState<string | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [draggedQuizId, setDraggedQuizId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const timerRef = useRef<any>(null);

  useEffect(() => {
    const q = query(collection(db, "shared_items"), orderBy("created_at", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ ...d.data(), __backendId: d.id }));
      setAllData(data);
    });

    const savedOrder = localStorage.getItem('homeCategoryOrder');
    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder);
        if (Array.isArray(parsed)) setCategoryOrder(parsed);
      } catch (e) {}
    }

    return () => {
      unsubscribe();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const playCorrectSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playNote = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine'; 
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + startTime); 
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
        osc.start(ctx.currentTime + startTime);
        osc.stop(ctx.currentTime + startTime + duration);
      };
      playNote(1046.50, 0, 0.1);   // C6
      playNote(1318.51, 0.1, 0.2); // E6
    } catch(e) { }
  };

  const autoFormatQuizText = (text: string) => {
    let cleanText = text.replace(/\r\n/g, '\n').replace(/\n{2,}/g, '\n');
    let blocks = cleanText.split(/(?=Câu\s*\d+|Question\s*\d+|Bài\s*\d+)/i);
    if (blocks.length <= 1) blocks = cleanText.split('\n\n'); 

    let result = [];
    
    for (let block of blocks) {
      if (!block.trim()) continue;
      
      let ans = '';
      let ansMatch = block.match(/(?:Đáp án|ĐÁP ÁN|Answer|ĐA|Gợi ý)[\s:\.\-]*([A-D])/i);
      if (ansMatch) {
        ans = ansMatch[1].toUpperCase();
        block = block.replace(ansMatch[0], ''); 
      }

      let optRegex = /([A-D])[\.\:\)]\s*(.*?)(?=(?:[A-D][\.\:\)]|$))/gi;
      let options = [];
      let match;
      let firstOptIndex = block.length;
      
      while ((match = optRegex.exec(block)) !== null) {
        if (options.length === 0) firstOptIndex = match.index; 
        options.push(`${match[1].toUpperCase()}. ${match[2].replace(/\n/g, ' ').trim()}`);
      }

      if (options.length > 0) {
        let questionText = block.substring(0, firstOptIndex).replace(/\n/g, ' ').trim();
        let optStr = options.join(' | ');
        ans = ans || 'A'; 
        result.push(`${questionText} | ${optStr} | Đáp án: ${ans}`);
      }
    }
    
    return result.length > 0 ? result.join('\n') : text;
  };

  const extractQuizText = async (file: File) => {
    setExtractStatus('Đang trích xuất & AI xử lý Auto-Format...');
    try {
      let extractedText = '';
      if (file.name.toLowerCase().endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = (content.items as any[]).map(item => item.str);
          extractedText += strings.join(' ') + '\n';
        }
      } else if (file.name.toLowerCase().endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        extractedText = result.value;
      } else {
        throw new Error("Chỉ hỗ trợ file PDF hoặc DOCX.");
      }

      const formattedText = autoFormatQuizText(extractedText);
      const textArea = document.getElementById('quiz-text') as HTMLTextAreaElement;
      if (textArea) {
        textArea.value = (textArea.value + '\n\n' + formattedText).trim();
      }
      setExtractStatus('🎉 Trích xuất thành công!');
    } catch (err: any) {
      setExtractStatus('❌ Lỗi: ' + err.message);
    }
  };

  const createWrongQuestionsQuiz = async () => {
    if (wrongQuestionsCache.length === 0) return;
    setIsSaving(true);
    const newUid = 'quiz_' + Date.now();
    let chunkText = '';
    wrongQuestionsCache.forEach((q: any) => {
      chunkText += q.text + '|' + q.options.map((o: any) => o.letter + '. ' + o.text).join('|') + '|Đáp án:' + (q.answer || q.correct) + '\n';
    });

    try {
      await addDoc(collection(db, "shared_items"), {
        category: currentCategory,
        subject: quizTest.item.subject,
        title: "Ôn lại: " + quizTest.item.title,
        quiz_text: chunkText,
        quiz_part: 0,
        quiz_id: newUid,
        links: 'show-answer',
        created_at: new Date().toISOString()
      });
      alert("Đã tạo đề Ôn tập câu sai thành công!");
    } catch (e) {}
    setIsSaving(false);
  };

  const renameGroup = async (oldSubject: string, isQuiz: boolean) => {
    if (!oldSubject) return;
    const newSubject = window.prompt("Nhập tên môn học mới:", oldSubject);
    if (newSubject !== null && newSubject.trim() !== "" && newSubject.trim() !== oldSubject) {
      const newSubjectTrimmed = newSubject.trim();
      const itemsToUpdate = allData.filter(d => d.category === currentCategory && (d.subject || '') === oldSubject);
      
      for (const item of itemsToUpdate) {
        await updateDoc(doc(db, "shared_items", item.__backendId), { subject: newSubjectTrimmed });
      }
      
      const nextGroups = new Set(openGroups);
      nextGroups.delete(oldSubject.toUpperCase());
      nextGroups.add(newSubjectTrimmed.toUpperCase());
      setOpenGroups(nextGroups);
    }
  };

  const cloneQuiz = async (quizId: string) => {
    const item = allData.find(d => (d.quiz_id === quizId) || d.__backendId === quizId);
    if (!item || !window.confirm(`Nhân bản đề "${item.title}"?`)) return;
    setIsSaving(true);
    const allParts = getQuizParts(item);
    const newQuizId = 'quiz_' + Date.now();
    try {
      for (const part of allParts) {
        const { __backendId, ...newRecord } = part;
        await addDoc(collection(db, "shared_items"), {
          ...newRecord,
          quiz_id: newQuizId,
          title: part.title + " (Bản sao)",
          created_at: new Date().toISOString()
        });
      }
      alert("Đã nhân bản thành công!");
    } catch(e) {}
    setIsSaving(false);
  };

  const escHtml = (s: string) => s;

  const getQuizParts = (item: any) => {
    if (item.quiz_id) return allData.filter(d => d.quiz_id === item.quiz_id).sort((a, b) => (a.quiz_part || 0) - (b.quiz_part || 0));
    return allData.filter(d => !d.quiz_id && d.title === item.title && d.category === item.category).sort((a, b) => (a.quiz_part || 0) - (b.quiz_part || 0));
  };

  const parseQuizLine = (line: string) => {
    try {
      const parts = line.split('|').map(p => p.trim()).filter(p => p);
      if (parts.length < 6) return null;
      const question: any = { text: parts[0], options: [], answer: null };
      for (let i = 1; i <= 4; i++) {
        const answerText = parts[i] || '';
        const match = answerText.match(/^([A-Da-d])[.:\s]+(.*)/);
        if (match) {
          question.options.push({ letter: match[1].toUpperCase(), text: match[2] });
        } else {
          question.options.push({ letter: String.fromCharCode(64 + i), text: answerText });
        }
      }
      const answerMatch = parts[parts.length - 1].match(/[A-Da-d]/);
      if (answerMatch) question.answer = answerMatch[0].toUpperCase();
      return question.answer && question.options.some((o: any) => o.letter === question.answer) ? question : null;
    } catch (e) { return null; }
  };

  const startTimer = (minutes: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    let seconds = minutes * 60;
    setQuizTimer(seconds);
    timerRef.current = setInterval(() => {
      seconds--;
      setQuizTimer(seconds);
      if (seconds <= 0) {
        clearInterval(timerRef.current);
        handleFinishQuiz();
      }
    }, 1000);
  };

  const handleFinishQuiz = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setQuizResult(true);
  };

  const saveItem = async (e: any) => {
    e.preventDefault();
    const subject = (document.getElementById('input-subject') as HTMLInputElement).value.trim();
    const title = (document.getElementById('input-title') as HTMLInputElement).value.trim();
    const deadline = (document.getElementById('input-deadline') as HTMLInputElement)?.value || '';
    
    if (!subject || !title) {
      setSaveError('Vui lòng nhập đủ thông tin.');
      return;
    }

    setIsSaving(true);
    setSaveError('');
    setSaveProgress(0);

    try {
      let linksStr = '';
      if (currentTab === 'link') {
        linksStr = linkItems
          .filter(item => item.url.trim())
          .map(item => `${item.url.trim()}${item.note.trim() ? '|' + item.note.trim() : ''}`)
          .join('\n');
          
        if (!linksStr) {
          setSaveError('Vui lòng nhập ít nhất 1 link.');
          setIsSaving(false);
          return;
        }
      }

      let fileNameStr = selectedFiles.map(f => f.name).join('|');

      const record = {
        category: currentCategory,
        subject: subject || 'Không có',
        title: title || 'Không có',
        links: linksStr,
        file_name: fileNameStr,
        deadline,
        quiz_text: '',
        created_at: new Date().toISOString()
      };

      if (editingItem) {
        await updateDoc(doc(db, "shared_items", editingItem.__backendId), record);
        // Handle file updates if needed (simplified for brevity)
      } else {
        const docRef = await addDoc(collection(db, "shared_items"), record);
        if (selectedFiles.length > 0) {
          for (let i = 0; i < selectedFiles.length; i++) {
            const fileObj = selectedFiles[i];
            let downloadUrl = fileObj.data;

            if (fileObj.fileObject) {
              const storageRef = ref(storage, `uploads/${Date.now()}_${fileObj.fileObject.name}`);
              const uploadTask = uploadBytesResumable(storageRef, fileObj.fileObject);
              
              await new Promise<void>((resolve) => {
                uploadTask.on('state_changed', 
                  (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setSaveProgress(progress);
                  },
                  (error) => resolve(),
                  async () => {
                    downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve();
                  }
                );
              });
            }

            await addDoc(collection(db, "shared_items"), {
              category: currentCategory,
              subject: '',
              title: '',
              links: '',
              file_name: fileObj.name,
              item_id: docRef.id,
              file_data: downloadUrl,
              file_type: fileObj.type,
              file_index: i,
              created_at: new Date().toISOString()
            });
          }
        }
      }

      setIsSaving(false);
      setScreen('list');
    } catch (e: any) {
      setIsSaving(false);
      setSaveError('Lỗi: ' + e.message);
    }
  };

  const saveQuiz = async () => {
    const subject = (document.getElementById('quiz-subject') as HTMLInputElement).value.trim();
    const title = (document.getElementById('quiz-title') as HTMLInputElement).value.trim();
    const quizText = (document.getElementById('quiz-text') as HTMLTextAreaElement).value.trim();
    const quizTime = parseInt((document.getElementById('quiz-time') as HTMLInputElement).value) || 0;
    const mode = (document.querySelector('input[name="quiz-mode"]:checked') as HTMLInputElement).value;

    if (!subject || !title || !quizText) return;

    setIsSaving(true);
    try {
      const lines = quizText.split('\n').filter(l => l.trim());
      const questions = lines.map(l => parseQuizLine(l)).filter(q => q !== null);

      const chunks = [];
      for (let i = 0; i < questions.length; i += 50) {
        let chunkText = '';
        questions.slice(i, i + 50).forEach(q => {
          chunkText += q.text + '|' + q.options.map((o: any) => o.letter + '.' + o.text).join('|') + '|Đáp án:' + q.answer + '\n';
        });
        chunks.push(chunkText.trim());
      }

      const quizId = editingItem ? (editingItem.quiz_id || editingItem.__backendId) : 'quiz_' + Date.now();

      if (editingItem) {
        const parts = getQuizParts(editingItem);
        for (const p of parts) await deleteDoc(doc(db, "shared_items", p.__backendId));
      }

      for (let i = 0; i < chunks.length; i++) {
        await addDoc(collection(db, "shared_items"), {
          category: currentCategory,
          subject,
          title,
          quiz_text: chunks[i],
          quiz_part: i,
          quiz_id: quizId,
          quiz_time: quizTime,
          links: mode,
          created_at: new Date().toISOString()
        });
      }

      setIsSaving(false);
      setScreen('quiz-list');
    } catch (e) {
      setIsSaving(false);
    }
  };

  const renderHome = () => (
    <div className="max-w-xl mx-auto px-5 py-10 relative pb-24">
      <div className="flex justify-between items-center mb-10 pl-2">
        <div>
          <h1 
            className="text-2xl font-bold text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Bảng Điều Khiển
          </h1>
          <p className="text-sm text-sky-200/60 mt-1">Sắp xếp theo ý bạn bằng cách kéo thả</p>
        </div>
        <button 
          onClick={onBack} 
          className="w-12 h-12 rounded-2xl liquid-glass flex items-center justify-center card-press hover:border-red-400/50 hover:text-red-400 transition-colors shadow-lg"
          title="Thoát"
        >
          <Power size={20} />
        </button>
      </div>
      <div className="bento-grid mt-4 pb-8">
        {categoryOrder.map((catKey, index) => {
          const cfg = categoryConfig[catKey];
          const colors = colorMap[cfg.color];
          const count = allData.filter(d => d.category === catKey && !d.file_data).length;
          return (
            <div 
              key={catKey}
              onClick={() => {
                setCurrentCategory(catKey);
                setScreen(cfg.hasQuiz ? 'quiz-list' : 'list');
              }}
              className="bento-item flex flex-col items-center justify-center p-6 rounded-[32px] border border-white/10 relative overflow-hidden group liquid-glass sm:animate-slide-up"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className={`absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none z-0 ${colors.bg}`}></div>
              <div className="relative z-10 flex flex-col items-center justify-center text-center gap-3 w-full h-full pointer-events-none">
                <div className="text-[3.5rem] icon-3d transition-transform duration-500 drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]">{cfg.icon}</div>
                <div>
                  <h2 className="font-black text-white text-xl tracking-wide drop-shadow-md">{cfg.label}</h2>
                  <p className="text-[10px] text-stone-300 font-semibold mt-1 uppercase tracking-widest">{cfg.hasQuiz ? 'Thi trắc nghiệm' : 'Quản lý tài liệu'}</p>
                </div>
                <div className="mt-2 px-4 py-1.5 bg-black/30 rounded-full text-xs font-bold text-white backdrop-blur-md border border-white/10 shadow-inner flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full animate-pulse ${colors.bg}`}></span>
                  {count} mục
                </div>
              </div>
              <div className="absolute right-4 top-4 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 cursor-grab text-stone-300 hover:text-white transition-colors z-20 shadow-sm border border-transparent hover:border-white/10 backdrop-blur-sm bg-black/10">
                <Grip size={20} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderList = () => {
    const items = allData.filter(d => d.category === currentCategory && !d.file_data);
    const cfg = categoryConfig[currentCategory];
    const colors = colorMap[cfg.color];

    // Grouping logic
    const groupedItems: any = {};
    items.forEach(item => {
      const subj = (item.subject || '').trim();
      const groupName = subj === '' ? 'CHƯA PHÂN NHÓM' : subj;
      const upperSubj = groupName.toUpperCase();
      if (!groupedItems[upperSubj]) groupedItems[upperSubj] = { originalName: groupName, isUngrouped: subj === '', items: [] };
      groupedItems[upperSubj].items.push(item);
    });

    return (
      <div className="max-w-md mx-auto px-5 py-6 animate-fade-rise">
        <div className="flex items-center gap-4 mb-8 liquid-glass p-3 rounded-2xl">
          <button onClick={() => setScreen('home')} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center card-press border border-white/10 transition-colors">
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h1 className="text-xl font-bold text-white flex-1 drop-shadow-md">{cfg.label}</h1>
          <button 
            onClick={() => {
              setEditingItem(null);
              setSelectedFiles([]);
              setScreen('form');
            }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center card-press shadow-[0_0_15px_rgba(56,189,248,0.4)] ${colors.bg}`}
          >
            <Plus size={20} className="text-white" />
          </button>
        </div>

        {selectedItems.size > 0 && (
          <div className="flex items-center justify-between bg-stone-800/80 backdrop-blur-md text-white p-4 rounded-2xl mb-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-sky-400/30 animate-slide-up">
            <span className="text-sm font-bold ml-2">{selectedItems.size} mục đã chọn</span>
            <button 
              onClick={async () => {
                if (!window.confirm(`Xóa ${selectedItems.size} mục?`)) return;
                for (const id of selectedItems) {
                  await deleteDoc(doc(db, "shared_items", id));
                  const relatedFiles = allData.filter(d => d.item_id === id);
                  for (const f of relatedFiles) await deleteDoc(doc(db, "shared_items", f.__backendId));
                }
                setSelectedItems(new Set());
              }}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl text-xs font-bold transition-colors border border-red-400 shadow-lg"
            >
              Xóa hàng loạt
            </button>
          </div>
        )}

        {isDragging && (
          <div 
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-amber-500/20'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('bg-amber-500/20')}
            onDrop={async (e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('bg-amber-500/20');
              if (draggedItemId) {
                const draggedItem = allData.find(d => d.__backendId === draggedItemId);
                if (draggedItem && (draggedItem.subject || '') !== '') {
                  await updateDoc(doc(db, "shared_items", draggedItemId), { subject: '' });
                }
              }
            }}
            className="w-full py-4 border-2 border-dashed border-amber-400 bg-amber-400/5 text-amber-400 rounded-2xl text-center text-sm font-bold mb-6 transition-all"
          >
            Thả vào đây để tách khỏi nhóm
          </div>
        )}

        <div className="space-y-6 pb-8">
          {Object.keys(groupedItems).map((groupKey, gIdx) => {
            const group = groupedItems[groupKey];
            const isOpen = openGroups.has(groupKey);
            return (
              <div 
                key={groupKey} 
                className={`animate-slide-up transition-all rounded-2xl p-1 ${isDragging ? 'hover:bg-white/5 border border-transparent hover:border-white/10' : ''}`} 
                style={{ animationDelay: `${gIdx * 0.05}s` }}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-white/10'); }}
                onDragLeave={(e) => e.currentTarget.classList.remove('bg-white/10')}
                onDrop={async (e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('bg-white/10');
                  if (draggedItemId) {
                    const tSubj = group.isUngrouped ? '' : group.originalName;
                    await updateDoc(doc(db, "shared_items", draggedItemId), { subject: tSubj });
                    const next = new Set(openGroups);
                    next.add(groupKey);
                    setOpenGroups(next);
                  }
                }}
              >
                <div 
                  onClick={() => {
                    const next = new Set(openGroups);
                    if (isOpen) next.delete(groupKey); else next.add(groupKey);
                    setOpenGroups(next);
                  }}
                  className="flex items-center gap-3 w-full py-2 px-1 hover:opacity-90 transition-opacity cursor-pointer mb-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-black/30 flex items-center justify-center flex-shrink-0 border border-white/5 shadow-inner">
                    <ChevronRight size={16} className={`text-stone-300 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className={`text-sm font-bold ${group.isUngrouped ? 'text-sky-300 italic' : 'text-white'} uppercase tracking-widest truncate drop-shadow-md`}>
                      {group.originalName}
                    </span>
                    <span className="text-[10px] font-medium text-stone-400">{group.items.length} mục</span>
                  </div>
                  {!group.isUngrouped && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); renameGroup(group.originalName, false); }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-stone-400"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                </div>

                {isOpen && (
                  <div className="space-y-4 pl-1 border-l-2 border-white/5 ml-4">
                    {group.items.map((item: any) => {
                      const isSelected = selectedItems.has(item.__backendId);
                      return (
                        <div 
                          key={item.__backendId} 
                          draggable
                          onDragStart={() => { setDraggedItemId(item.__backendId); setIsDragging(true); }}
                          onDragEnd={() => { setDraggedItemId(null); setIsDragging(false); }}
                          className={`bg-black/40 rounded-2xl p-5 border transition-all hover:border-sky-400/50 relative cursor-pointer group ${isSelected ? 'border-sky-400 bg-sky-500/10 shadow-[0_0_20px_rgba(56,189,248,0.3)]' : 'border-white/10'}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1 min-w-0 pr-10">
                              <input 
                                type="checkbox" 
                                checked={isSelected}
                                onChange={() => {
                                  const next = new Set(selectedItems);
                                  if (isSelected) next.delete(item.__backendId); else next.add(item.__backendId);
                                  setSelectedItems(next);
                                }}
                                className="mt-1.5 w-5 h-5 accent-sky-500 bg-black/30 border border-white/20 rounded cursor-pointer shadow-inner transition-transform hover:scale-110" 
                              />
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base font-bold text-white mb-2 truncate drop-shadow-sm group-hover:text-sky-300 transition-colors">{item.title}</h3>
                                {cfg.hasDeadline && item.deadline && (
                                  <div className="mt-3">
                                    <span className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider flex inline-flex items-center gap-1.5 text-amber-300">
                                      <Clock size={12} /> {item.deadline}
                                    </span>
                                  </div>
                                )}
                                {item.links && (
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {item.links.split('\n').filter((l:any)=>l).map((linkLine: string, i: number) => {
                                      const [url, note = 'Mở link'] = linkLine.split('|');
                                      return (
                                        <a key={i} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[11px] text-sky-300 hover:text-white bg-sky-500/10 hover:bg-sky-500/30 px-3 py-2 rounded-lg border border-sky-500/20 hover:border-sky-400/50 transition-all shadow-sm">
                                          <ExternalLink size={14} /> <span className="font-bold truncate max-w-[150px] uppercase tracking-wider">{note}</span>
                                        </a>
                                      );
                                    })}
                                  </div>
                                )}
                                {/* Files */}
                                {allData.filter(d => d.item_id === item.__backendId).map((file, i) => (
                                  <div 
                                    key={i} 
                                    onClick={() => {
                                      if (file.file_type === 'image' || file.file_type === 'video') setMediaViewer({ src: file.file_data, type: file.file_type });
                                      else setDocViewer({ src: file.file_data, type: file.file_type || 'pdf', name: file.file_name });
                                    }}
                                    className="mt-4 p-3 rounded-xl bg-black/30 border border-white/5 flex items-center gap-3 cursor-pointer hover:bg-white/10 transition-all group/fitem"
                                  >
                                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                                      {file.file_type === 'image' ? <FileText size={20} className="text-sky-400" /> : <PlayCircle size={20} className="text-sky-400" />}
                                    </div>
                                    <div className="flex flex-col flex-1 min-w-0">
                                      <span className="text-sm font-bold text-white truncate">{file.file_name}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 flex-shrink-0 absolute right-5 top-5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="flex gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5 backdrop-blur-xl shadow-lg">
                                <button onClick={() => { setEditingItem(item); setScreen('form'); }} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-amber-500/20 hover:text-amber-300 text-stone-400 transition-all"><Edit2 size={16} /></button>
                                <button onClick={() => { if(window.confirm('Xóa?')) { deleteDoc(doc(db, "shared_items", item.__backendId)); allData.filter(d=>d.item_id===item.__backendId).forEach(f=>deleteDoc(doc(db,"shared_items",f.__backendId))); } }} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-500/20 hover:text-red-300 text-stone-400 transition-all"><Trash2 size={16} /></button>
                              </div>
                              <div className="w-full py-1.5 rounded-lg flex items-center justify-center bg-black/20 border border-white/5 cursor-grab text-stone-500"><GripVertical size={16} /></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {items.length === 0 && (
          <div className="text-center py-20 animate-slide-up liquid-glass rounded-[32px] border border-white/5">
            <p className="text-6xl mb-4 icon-3d">📂</p>
            <p className="text-sky-200 font-bold text-lg">Chưa có mục nào</p>
            <p className="text-stone-400 text-sm mt-2">Nhấn dấu + ở trên để thêm mới nhé</p>
          </div>
        )}
      </div>
    );
  };

  const renderQuizList = () => {
    const items = allData.filter(d => d.category === currentCategory && !d.file_data);
    const cfg = categoryConfig[currentCategory];
    const colors = colorMap[cfg.color];

    const uniqueQuizzesMap = new Map();
    items.forEach(item => {
      const key = item.quiz_id || item.__backendId;
      if (!uniqueQuizzesMap.has(key)) uniqueQuizzesMap.set(key, item);
    });
    const uniqueQuizzes = Array.from(uniqueQuizzesMap.values());

    const groupedQuizzes: any = {};
    uniqueQuizzes.forEach(item => {
      const subj = (item.subject || '').trim();
      const groupName = subj === '' ? 'CHƯA PHÂN NHÓM' : subj;
      const upperSubj = groupName.toUpperCase();
      if (!groupedQuizzes[upperSubj]) groupedQuizzes[upperSubj] = { originalName: groupName, isUngrouped: subj === '', items: [] };
      groupedQuizzes[upperSubj].items.push(item);
    });

    return (
      <div className="max-w-md mx-auto px-5 py-6 animate-fade-rise">
        <div className="flex items-center gap-4 mb-8 liquid-glass p-3 rounded-2xl">
          <button onClick={() => setScreen('home')} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center card-press border border-white/10 transition-colors">
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h1 className="text-xl font-bold text-white flex-1 drop-shadow-md">{cfg.label}</h1>
          <button 
            onClick={() => { setEditingItem(null); setScreen('quiz-form'); }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center card-press shadow-[0_0_15px_rgba(167,139,250,0.4)] ${colors.bg}`}
          >
            <Plus size={20} className="text-white" />
          </button>
        </div>

        {selectedQuizzes.size > 0 && (
          <div className="flex items-center justify-between bg-violet-600/80 backdrop-blur-md text-white p-4 rounded-2xl mb-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-violet-400/30 animate-slide-up">
            <span className="text-sm font-bold ml-2">{selectedQuizzes.size} đề đã chọn</span>
            <button 
              onClick={async () => {
                if (!window.confirm(`Xóa ${selectedQuizzes.size} đề?`)) return;
                for (const id of selectedQuizzes) {
                  const parts = allData.filter(d => d.quiz_id === id || d.__backendId === id);
                  for (const p of parts) await deleteDoc(doc(db, "shared_items", p.__backendId));
                }
                setSelectedQuizzes(new Set());
              }}
              className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
            >
              Xóa hàng loạt
            </button>
          </div>
        )}

        {isDragging && (
          <div 
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-amber-500/20'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('bg-amber-500/20')}
            onDrop={async (e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('bg-amber-500/20');
              if (draggedQuizId) {
                const parts = getQuizParts({ quiz_id: draggedQuizId, __backendId: draggedQuizId });
                for (const p of parts) {
                  await updateDoc(doc(db, "shared_items", p.__backendId), { subject: '' });
                }
              }
            }}
            className="w-full py-4 border-2 border-dashed border-amber-400 bg-amber-400/5 text-amber-400 rounded-2xl text-center text-sm font-bold mb-6 transition-all"
          >
            Thả vào đây để tách khỏi nhóm
          </div>
        )}

        <div className="space-y-6 pb-8">
          {Object.keys(groupedQuizzes).map((groupKey, gIdx) => {
            const group = groupedQuizzes[groupKey];
            const isOpen = openGroups.has(groupKey);
            return (
              <div 
                key={groupKey} 
                className={`animate-slide-up transition-all rounded-2xl p-1 ${isDragging ? 'hover:bg-white/5 border border-transparent hover:border-white/10' : ''}`} 
                style={{ animationDelay: `${gIdx * 0.05}s` }}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-white/10'); }}
                onDragLeave={(e) => e.currentTarget.classList.remove('bg-white/10')}
                onDrop={async (e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('bg-white/10');
                  if (draggedQuizId) {
                    const tSubj = group.isUngrouped ? '' : group.originalName;
                    const parts = getQuizParts({ quiz_id: draggedQuizId, __backendId: draggedQuizId });
                    for (const p of parts) {
                      await updateDoc(doc(db, "shared_items", p.__backendId), { subject: tSubj });
                    }
                    const next = new Set(openGroups);
                    next.add(groupKey);
                    setOpenGroups(next);
                  }
                }}
              >
                <div 
                  onClick={() => {
                    const next = new Set(openGroups);
                    if (isOpen) next.delete(groupKey); else next.add(groupKey);
                    setOpenGroups(next);
                  }}
                  className="flex items-center gap-3 w-full py-2 px-1 hover:opacity-90 transition-opacity cursor-pointer mb-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-black/30 flex items-center justify-center flex-shrink-0 border border-white/5 shadow-inner">
                    <ChevronRight size={16} className={`text-stone-300 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className={`text-sm font-bold ${group.isUngrouped ? 'text-sky-300 italic' : 'text-white'} uppercase tracking-widest truncate drop-shadow-md`}>
                      {group.originalName}
                    </span>
                    <span className="text-[10px] font-medium text-stone-400">{group.items.length} bài tập</span>
                  </div>
                  {!group.isUngrouped && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); renameGroup(group.originalName, true); }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-stone-400"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                </div>

                {isOpen && (
                  <div className="space-y-4 pt-3 border-t border-white/5 ml-1">
                    {group.items.map((item: any) => {
                      const uid = item.quiz_id || item.__backendId;
                      const history = localStorage.getItem('history_' + uid);
                      const isSelected = selectedQuizzes.has(uid);
                      const questionsCount = getQuizParts(item).map(p=>p.quiz_text||'').join('\n').split('\n').filter(l=>l.trim()).length;
                      return (
                        <div 
                          key={uid} 
                          draggable
                          onDragStart={() => { setDraggedQuizId(uid); setIsDragging(true); }}
                          onDragEnd={() => { setDraggedQuizId(null); setIsDragging(false); }}
                          onClick={() => {
                            const parts = getQuizParts(item);
                            const quizText = parts.map(p => p.quiz_text || '').join('\n');
                            const questions = quizText.split('\n').filter(l => l.trim()).map(l => parseQuizLine(l)).filter(q => q);
                            setQuizPreview({ item, questions, parts });
                          }}
                          className={`bg-black/40 rounded-2xl p-5 border transition-all hover:border-violet-400/50 relative cursor-pointer group ${isSelected ? 'border-violet-400 bg-violet-500/10 shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'border-white/10'}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1 min-w-0 pr-24">
                              <input 
                                type="checkbox" 
                                checked={isSelected}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  const next = new Set(selectedQuizzes);
                                  if (isSelected) next.delete(uid); else next.add(uid);
                                  setSelectedQuizzes(next);
                                }}
                                className="mt-1.5 w-5 h-5 accent-violet-500 bg-black/30 border border-white/20 rounded cursor-pointer transition-transform hover:scale-110" 
                              />
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base font-bold text-white mb-3 truncate drop-shadow-sm group-hover:text-violet-300 transition-colors">{item.title}</h3>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 font-bold uppercase tracking-wider"><Clock size={12} /> {item.quiz_time || 'KGH'} phút</span>
                                  <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-[10px] text-violet-300 font-bold uppercase tracking-wider"><List size={12} /> {questionsCount} câu</span>
                                  {history && <span className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider"><Award size={12} /> {history}</span>}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 flex-shrink-0 absolute right-5 top-5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="flex gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5 backdrop-blur-xl shadow-lg">
                                <button onClick={(e) => { e.stopPropagation(); cloneQuiz(uid); }} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-blue-500/20 hover:text-blue-300 text-stone-400" title="Nhân bản"><Copy size={16} /></button>
                                <button onClick={(e) => { e.stopPropagation(); setEditingItem(item); setScreen('quiz-form'); }} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-amber-500/20 hover:text-amber-300 text-stone-400" title="Sửa"><Edit2 size={16} /></button>
                                <button onClick={(e) => { e.stopPropagation(); if(window.confirm('Xóa?')) { getQuizParts(item).forEach(p=>deleteDoc(doc(db,"shared_items",p.__backendId))); } }} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-500/20 hover:text-red-300 text-stone-400" title="Xóa"><Trash2 size={16} /></button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {uniqueQuizzes.length === 0 && (
          <div className="text-center py-20 bg-black/20 rounded-[32px] border border-white/5">
            <p className="text-6xl mb-4">📋</p>
            <p className="text-violet-200 font-bold text-lg">Chưa có bài tập nào</p>
          </div>
        )}
      </div>
    );
  };

  const renderQuizTest = () => {
    if (!quizTest) return null;
    const question = quizTest.questions[currentQuestionIndex];
    const isPractice = quizTest.item.links !== 'no-answer';

    return (
      <div className="fixed inset-0 bg-[#00101f] z-50 flex flex-col overflow-auto custom-scrollbar">
        <div className="max-w-md mx-auto w-full px-5 py-6 flex flex-col h-full relative z-10">
          <div className="flex items-center gap-4 mb-6 sticky top-0 py-3 z-10 liquid-glass rounded-2xl px-4 shadow-lg">
            <button 
              onClick={() => {
                if (window.confirm('Dừng làm bài? Tiến độ hiện tại sẽ bị mất.')) {
                  setQuizTest(null);
                  setQuizResult(null);
                  if (timerRef.current) clearInterval(timerRef.current);
                }
              }} 
              className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/30 hover:bg-red-500/40 flex items-center justify-center card-press transition-colors"
            >
              <Power size={16} className="text-red-400" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-bold text-white truncate">{quizTest.item.title}</h1>
              <p className="text-[10px] text-stone-400 font-medium mt-0.5">Câu <span className="text-sky-400 font-bold text-xs">{currentQuestionIndex + 1}</span> / {quizTest.questions.length}</p>
            </div>
            {quizTimer > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-lg font-mono text-sm font-bold border border-amber-500/30 shadow-sm">
                <Timer size={14} /> 
                {Math.floor(quizTimer / 60)}:{String(quizTimer % 60).padStart(2, '0')}
              </div>
            )}
            <div className={`bg-emerald-500/20 px-3 py-1.5 rounded-lg border border-emerald-500/30 text-xs text-emerald-400 font-bold flex items-center gap-1.5 ${isPractice ? '' : 'hidden'}`}>
              <CheckCircle size={14} /> <span>{correctCount}</span>
            </div>
          </div>

          {!quizResult ? (
            <div className="flex-1 flex flex-col animate-slide-up">
              <div className="liquid-glass rounded-[24px] p-6 mb-6 shadow-xl border border-white/20">
                <p className="text-base font-bold text-white mb-6 leading-relaxed drop-shadow-md">{question.text}</p>
                <div className="space-y-3">
                  {question.options.map((opt: any) => {
                    const isSelected = quizAnswers[currentQuestionIndex] === opt.letter;
                    const isCorrect = opt.letter === question.answer;
                    const showFeedback = isPractice && quizAnswers[currentQuestionIndex];

                    let btnClass = "w-full text-left p-4 rounded-2xl border-2 border-white/5 bg-black/20 text-stone-300 font-medium transition-all card-press hover:bg-white/5 hover:border-white/20 shadow-inner";
                    let content = ``;

                    if (showFeedback) {
                      if (isCorrect) {
                        btnClass = "w-full text-left p-4 rounded-2xl border-2 border-emerald-400 bg-emerald-500/20 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]";
                        content = `<span class="font-black text-white mr-2 bg-emerald-500 px-2 py-1 rounded-lg">✓</span> <span class="font-bold">${opt.text}</span>`;
                      } else if (isSelected) {
                        btnClass = "w-full text-left p-4 rounded-2xl border-2 border-red-400 bg-red-500/20 text-red-200";
                        content = `<span class="font-black text-white mr-2 bg-red-500 px-2 py-1 rounded-lg">✗</span> <span class="line-through opacity-80">${opt.text}</span>`;
                      } else {
                        btnClass = "w-full text-left p-4 rounded-2xl border-2 border-white/5 bg-black/20 text-stone-300 opacity-50 grayscale";
                        content = `<span class="font-black text-sky-400 mr-2 bg-sky-500/10 px-2 py-1 rounded-lg">${opt.letter}</span> ${opt.text}`;
                      }
                    } else {
                      btnClass += isSelected ? " border-violet-400 bg-violet-500/10 text-white" : "";
                      content = `<span class="font-black text-sky-400 mr-2 bg-sky-500/10 px-2 py-1 rounded-lg">${opt.letter}</span> ${opt.text}`;
                    }

                    return (
                      <button 
                        key={opt.letter}
                        disabled={!!quizAnswers[currentQuestionIndex]}
                        onClick={() => {
                          const newAnswers = [...quizAnswers];
                          newAnswers[currentQuestionIndex] = opt.letter;
                          setQuizAnswers(newAnswers);
                          if (opt.letter === question.answer) {
                            setCorrectCount(c => c + 1);
                            playCorrectSound();
                            confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 }, colors: ['#10b981', '#34d399'] });
                          }
                          
                          if (isPractice) {
                            setTimeout(() => {
                              if (currentQuestionIndex < quizTest.questions.length - 1) {
                                setCurrentQuestionIndex(i => i + 1);
                              } else {
                                handleFinishQuiz();
                              }
                            }, 1500);
                          }
                        }}
                        className={btnClass}
                        dangerouslySetInnerHTML={{ __html: content }}
                      />
                    );
                  })}
                </div>
              </div>
              {(!isPractice || quizAnswers[currentQuestionIndex]) && (
                <button 
                  onClick={() => {
                    if (currentQuestionIndex < quizTest.questions.length - 1) {
                      setCurrentQuestionIndex(i => i + 1);
                    } else {
                      handleFinishQuiz();
                    }
                  }}
                  className="w-full py-4 bg-gradient-to-r from-sky-400 to-indigo-500 text-white rounded-2xl font-black text-lg card-press transition-transform hover:scale-[1.02] shadow-[0_10px_20px_rgba(56,189,248,0.3)] mt-auto mb-4"
                >
                  {currentQuestionIndex === quizTest.questions.length - 1 ? 'NỘP BÀI 📝' : 'CÂU TIẾP THEO 🚀'}
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col py-6 animate-slide-up">
              <div className="text-center mb-8">
                <p className="text-7xl mb-6 icon-3d inline-block">🎉</p>
                <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400 mb-2 drop-shadow-lg">Tuyệt vờiiii!</p>
                <p className="text-stone-300 text-sm mb-8">Bạn đã hoàn thành bài tập xuất sắc</p>
                <div className="liquid-glass rounded-[32px] p-8 w-full text-center border border-white/20 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-emerald-500/10 z-0"></div>
                  <div className="relative z-10 flex justify-around items-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 mb-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                        <p className="text-3xl font-bold text-emerald-400 drop-shadow-md">{correctCount}</p>
                      </div>
                      <p className="text-xs text-emerald-200/70 font-bold uppercase tracking-wider">Đúng</p>
                    </div>
                    <div className="w-px h-16 bg-white/10"></div>
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30 mb-2 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                        <p className="text-3xl font-bold text-red-400 drop-shadow-md">{quizTest.questions.length - correctCount}</p>
                      </div>
                      <p className="text-xs text-red-200/70 font-bold uppercase tracking-wider">Sai</p>
                    </div>
                  </div>
                  <div className="mt-8 pt-6 border-t border-white/10">
                    <p className="text-sm font-semibold text-stone-400 mb-1">Độ chính xác</p>
                    <p className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                      {Math.round((correctCount / quizTest.questions.length) * 100)}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mt-auto">
                <button 
                  onClick={createWrongQuestionsQuiz} 
                  className="w-full py-4 bg-white/10 border border-white/20 text-white rounded-2xl font-bold text-sm card-press transition-colors hover:bg-white/20 shadow-lg"
                >
                  Tạo bộ đề ôn riêng câu sai 📝
                </button>
                <button 
                  onClick={() => {
                    setQuizTest(null);
                    setQuizResult(null);
                    setCurrentQuestionIndex(0);
                    setQuizAnswers([]);
                    setCorrectCount(0);
                  }}
                  className="w-full py-4 bg-gradient-to-r from-sky-400 to-indigo-500 text-white rounded-2xl font-bold text-base card-press hover:scale-[1.02] transition-transform shadow-[0_10px_20px_rgba(56,189,248,0.3)]"
                >
                  Trở về danh sách 🚀
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="passmonez-root min-h-screen relative z-[100] text-white">
      {screen === 'home' && renderHome()}
      {screen === 'list' && renderList()}
      {screen === 'quiz-list' && renderQuizList()}
      
      {screen === 'form' && (
        <div className="max-w-md mx-auto px-5 py-6 animate-fade-rise">
          <div className="flex items-center gap-4 mb-8 liquid-glass p-3 rounded-2xl">
            <button onClick={() => setScreen('list')} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center card-press border border-white/10 transition-colors">
              <ArrowLeft size={20} className="text-white" />
            </button>
            <h1 className="text-xl font-bold text-white flex-1 drop-shadow-md">Thêm mới</h1>
          </div>
          <form onSubmit={saveItem} className="space-y-5 animate-slide-up">
            <div className="liquid-glass p-5 rounded-[24px]">
              <div className="mb-4">
                <label className="block text-xs font-bold text-sky-300 uppercase tracking-wider mb-2">Tên môn học</label>
                <input id="input-subject" defaultValue={editingItem?.subject} type="text" className="w-full bg-black/30 border border-white/10 focus:border-sky-400 rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-sky-300 uppercase tracking-wider mb-2">Tiêu đề</label>
                <input id="input-title" defaultValue={editingItem?.title} type="text" className="w-full bg-black/30 border border-white/10 focus:border-sky-400 rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors" />
              </div>
            </div>

            <div className="liquid-glass p-5 rounded-[24px]">
              <div className="flex bg-black/40 rounded-xl p-1.5 mb-5 border border-white/5">
                <button type="button" onClick={() => setCurrentTab('link')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${currentTab === 'link' ? 'bg-white text-stone-900 shadow-md' : 'text-stone-400'}`}>🔗 Links</button> 
                <button type="button" onClick={() => setCurrentTab('file')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${currentTab === 'file' ? 'bg-white text-stone-900 shadow-md' : 'text-stone-400'}`}>📁 Files</button>
              </div>

              {currentTab === 'link' ? (
                <div className="space-y-4">
                  {linkItems.map((item, idx) => (
                    <div key={idx} className="space-y-2 p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Ghi chú (VD: Tài liệu web)" 
                          value={item.note}
                          onChange={(e) => {
                            const next = [...linkItems];
                            next[idx].note = e.target.value;
                            setLinkItems(next);
                          }}
                          className="flex-1 bg-black/30 border border-white/10 focus:border-sky-400 rounded-lg px-3 py-2 text-xs text-white outline-none" 
                        />
                        {linkItems.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => setLinkItems(linkItems.filter((_, i) => i !== idx))}
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-500/20 text-red-400 border border-white/10"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      <input 
                        type="url" 
                        placeholder="https://..." 
                        value={item.url}
                        onChange={(e) => {
                          const next = [...linkItems];
                          next[idx].url = e.target.value;
                          setLinkItems(next);
                        }}
                        className="w-full bg-black/30 border border-white/10 focus:border-sky-400 rounded-lg px-3 py-2 text-xs text-white outline-none" 
                      />
                    </div>
                  ))}
                  <button 
                    type="button" 
                    onClick={() => setLinkItems([...linkItems, { url: '', note: '' }])}
                    className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors px-1"
                  >
                    <Plus size={12} /> Thêm link
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block w-full bg-black/20 border-2 border-dashed border-white/20 hover:border-sky-400/50 rounded-xl p-8 text-center cursor-pointer transition-colors group">
                    <UploadCloud size={32} className="text-sky-400 mx-auto mb-2 icon-3d" />
                    <p className="text-sm text-white font-bold mb-1">Chọn file để tải lên</p>
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={(e: any) => {
                        const file = e.target.files[0];
                        if (file) {
                          setSelectedFiles([...selectedFiles, { name: file.name, fileObject: file, type: file.type.split('/')[0] }]);
                        }
                      }} 
                    />
                  </label>
                  <div className="mt-4 space-y-2">
                    {selectedFiles.map((f, i) => (
                      <div key={i} className="p-3 rounded-xl bg-black/30 border border-white/10 flex justify-between items-center group">
                        <span className="text-sm font-bold text-white truncate">{f.name}</span>
                        <button type="button" onClick={() => setSelectedFiles(selectedFiles.filter((_, idx) => idx !== i))} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-500/20 text-red-400 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {categoryConfig[currentCategory]?.hasDeadline && (
              <div className="liquid-glass p-5 rounded-[24px]">
                <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-2"><CalendarClock size={16} /> Deadline</label>
                <input id="input-deadline" defaultValue={editingItem?.deadline} type="datetime-local" className="w-full bg-black/30 border border-white/10 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white outline-none transition-all [color-scheme:dark]" />
              </div>
            )}

            <button 
              disabled={isSaving} 
              className="w-full py-4 rounded-2xl text-white text-lg font-bold transition-transform hover:scale-[1.02] bg-gradient-to-r from-sky-400 to-indigo-500 shadow-[0_10px_20px_rgba(56,189,248,0.3)] mt-4 disabled:opacity-50"
            >
              {isSaving ? `Đang lưu... ${Math.round(saveProgress)}%` : 'Lưu Dữ Liệu 💾'}
            </button>

            {isSaving && (
              <div className="liquid-glass p-6 rounded-2xl mt-4 text-center">
                <div className="inline-block w-10 h-10 border-4 border-sky-500/30 border-t-sky-400 rounded-full animate-spin mb-4"></div>
                <div className="w-full bg-black/50 rounded-full h-2 mt-4 overflow-hidden border border-white/10">
                  <div className="bg-gradient-to-r from-sky-400 to-indigo-400 h-2 rounded-full transition-all duration-300" style={{ width: `${saveProgress}%` }}></div>
                </div>
              </div>
            )}
            {saveError && <p className="text-red-400 text-center text-xs bg-red-500/10 border border-red-500/20 rounded-xl p-3 font-bold mt-4">{saveError}</p>}
          </form>
        </div>
      )}

      {screen === 'quiz-form' && (
        <div className="max-w-md mx-auto px-5 py-6 animate-fade-rise">
          <div className="flex items-center gap-4 mb-8 liquid-glass p-3 rounded-2xl">
            <button onClick={() => setScreen('quiz-list')} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center card-press border border-white/10 transition-colors">
              <ArrowLeft size={20} className="text-white" />
            </button>
            <h1 className="text-xl font-bold text-white flex-1 drop-shadow-md">Thêm bài tập</h1>
          </div>
          <div className="space-y-5 animate-slide-up">
            <div className="liquid-glass p-5 rounded-[24px]">
              <div className="mb-4">
                <label className="block text-xs font-bold text-sky-300 uppercase tracking-wider mb-2">Tên môn học</label>
                <input id="quiz-subject" defaultValue={editingItem?.subject} className="w-full bg-black/30 border border-white/10 focus:border-sky-400 rounded-xl px-4 py-3 text-sm text-white outline-none" />
              </div>
              <div className="mb-4">
                <label className="block text-xs font-bold text-sky-300 uppercase tracking-wider mb-2">Tên bộ câu hỏi</label>
                <input id="quiz-title" defaultValue={editingItem?.title} className="w-full bg-black/30 border border-white/10 focus:border-sky-400 rounded-xl px-4 py-3 text-sm text-white outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-sky-300 uppercase tracking-wider mb-2">Thời gian (phút)</label>
                <input id="quiz-time" type="number" placeholder="KGH" className="w-full bg-black/30 border border-white/10 focus:border-sky-400 rounded-xl px-4 py-3 text-sm text-white outline-none" />
              </div>
            </div>

            <div className="liquid-glass p-5 rounded-[24px]">
              <label className="block text-xs font-bold text-violet-300 uppercase tracking-wider mb-3">Chế độ làm bài</label>
              <div className="space-y-3">
                <label className="flex items-center gap-4 p-4 rounded-xl border border-white/10 cursor-pointer transition-colors bg-black/20 hover:bg-white/5 has-[:checked]:border-amber-400 has-[:checked]:bg-amber-400/10 group">
                  <input type="radio" name="quiz-mode" value="show-answer" defaultChecked className="w-5 h-5 accent-amber-500" />
                  <div className="flex-1 min-w-0"><p className="text-sm font-bold text-white">Luyện tập</p><p className="text-[10px] text-stone-400 mt-0.5">Bấm sai hiện đáp án ngay</p></div>
                </label>
                <label className="flex items-center gap-4 p-4 rounded-xl border border-white/10 cursor-pointer transition-colors bg-black/20 hover:bg-white/5 has-[:checked]:border-violet-400 has-[:checked]:bg-violet-400/10 group">
                  <input type="radio" name="quiz-mode" value="no-answer" className="w-5 h-5 accent-violet-500" />
                  <div className="flex-1 min-w-0"><p className="text-sm font-bold text-white">Thi thử</p><p className="text-[10px] text-stone-400 mt-0.5">Làm xong mới biết điểm</p></div>
                </label>
              </div>
            </div>

            <div className="liquid-glass p-5 rounded-[24px]">
              <label className="block text-xs font-bold text-emerald-300 uppercase tracking-wider mb-3 flex items-center gap-2"><Wand2 size={16} /> Trích xuất tự động</label>
              <label className="block w-full border-2 border-dashed border-white/20 hover:border-emerald-400/50 rounded-xl p-6 text-center cursor-pointer transition-colors bg-black/20 group">
                <FileUp size={32} className="text-stone-400 mx-auto mb-2 transition-transform group-hover:scale-110" />
                <p className="text-xs text-stone-300 font-medium">Tải lên file PDF hoặc DOCX</p>
                <input type="file" accept=".pdf, .docx" className="hidden" onChange={(e) => e.target.files?.[0] && extractQuizText(e.target.files[0])} />
              </label>
              {extractStatus && <p className="text-[10px] text-amber-400 mt-3 text-center font-bold bg-amber-400/10 p-2 rounded-lg border border-amber-400/20">{extractStatus}</p>}
            </div>

            <div className="liquid-glass p-5 rounded-[24px]">
              <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-3">Nội dung câu hỏi</label>
              <textarea id="quiz-text" defaultValue={editingItem ? getQuizParts(editingItem).map(p=>p.quiz_text||'').join('\n') : ''} placeholder="Câu hỏi | A. ĐA 1 | B. ĐA 2 | C. ĐA 3 | D. ĐA 4 | Đáp án: A" className="w-full bg-black/30 border border-white/10 focus:border-sky-400 rounded-xl px-4 py-4 text-sm text-white outline-none min-h-[16rem] custom-scrollbar" />
            </div>

            <button onClick={saveQuiz} disabled={isSaving} className="w-full py-4 rounded-2xl text-white text-lg font-bold transition-all bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-[0_10px_20px_rgba(139,92,246,0.3)] mt-4 hover:scale-[1.02] disabled:opacity-50">
              {isSaving ? 'Đang lưu...' : 'Lưu Bài Tập 📝'}
            </button>
          </div>
        </div>
      )}

      {quizPreview && (
        <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-[60] backdrop-blur-md" onClick={() => setQuizPreview(null)}>
          <div className="liquid-glass border-t border-white/20 rounded-t-[32px] w-full max-w-md p-8 animate-fade-rise" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6"></div>
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-2xl font-bold text-white leading-tight pr-4">{quizPreview.item.title}</h2>
              <button 
                onClick={() => setQuizPreview(null)}
                className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-white/10 border border-white/10 hover:bg-white/20 rounded-full transition-colors"
                title="Đóng"
              >
                <X size={16} className="text-stone-300" />
              </button>
            </div>
            <div className="bg-black/30 rounded-2xl p-4 mb-6 flex gap-6 text-sm font-bold text-sky-300 border border-white/5">
              <p className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center"><List size={14} className="text-sky-400" /></div> <span className="text-lg text-white">{quizPreview.questions.length}</span> câu</p>
              <div className="w-px bg-white/10"></div>
              <p className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center"><Clock size={14} className="text-amber-400" /></div> <span className="text-sm text-white">{quizPreview.parts[0].quiz_time ? quizPreview.parts[0].quiz_time + ' phút' : 'KGH'}</span></p>
            </div>
            <div className="space-y-3 mb-8 max-h-60 overflow-auto pr-2 custom-scrollbar">
              {quizPreview.questions.slice(0, 10).map((q: any, i: number) => (
                <div key={i} className="bg-black/30 rounded-2xl p-4 border border-white/5">
                  <p className="text-sm font-bold text-sky-300 mb-3 block">Câu {i + 1}: <span className="text-white font-semibold">{q.text}</span></p>
                </div>
              ))}
              {quizPreview.questions.length > 10 && <p className="text-xs font-bold text-stone-500 text-center py-4 bg-white/5 rounded-xl border border-white/5 uppercase tracking-widest">... VÀ {quizPreview.questions.length - 10} CÂU KHÁC</p>}
            </div>
            <div className="flex gap-3 mt-auto pt-2">
              <button 
                onClick={() => {
                  setQuizTest(quizPreview);
                  setQuizPreview(null);
                  setCurrentQuestionIndex(0);
                  setQuizAnswers([]);
                  setCorrectCount(0);
                  setQuizResult(null);
                  if (quizPreview.parts[0].quiz_time) startTimer(quizPreview.parts[0].quiz_time);
                }}
                className="w-full py-4 bg-gradient-to-r from-sky-400 to-indigo-500 text-white rounded-2xl font-bold text-lg hover:scale-[1.02] transition-transform shadow-[0_10px_20px_rgba(56,189,248,0.3)]"
              >
                Bắt đầu làm bài 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {renderQuizTest()}

      {mediaViewer && (
        <div className="fixed inset-0 bg-black/95 z-[80] flex flex-col items-center justify-center h-full w-full backdrop-blur-xl animate-fade-rise">
          <div className="flex-1 flex items-center justify-center w-full p-4 relative">
            {mediaViewer.type === 'image' ? (
              <img src={mediaViewer.src} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border border-white/10" alt="Viewer" />
            ) : (
              <video src={mediaViewer.src} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border border-white/10" controls autoPlay />
            )}
          </div>
          <div className="absolute top-6 right-6 z-10">
            <button onClick={() => setMediaViewer(null)} className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white border border-white/20 backdrop-blur-md shadow-lg transition-all">
              <X size={24} />
            </button>
          </div>
        </div>
      )}

      {docViewer && (
        <div className="fixed inset-0 bg-[#00101f] z-[80] flex flex-col h-full w-full animate-fade-rise">
          <div className="flex items-center gap-4 p-5 liquid-glass z-10">
            <button onClick={() => setDocViewer(null)} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center border border-white/10">
              <ArrowLeft size={20} className="text-white" />
            </button>
            <h1 className="text-sm font-bold text-white flex-1 truncate drop-shadow-md">{docViewer.name}</h1>
            <a href={docViewer.src} download={docViewer.name} className="w-10 h-10 rounded-xl bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center shadow-lg transition-colors">
              <Download size={20} />
            </a>
          </div>
          <div className="flex-1 overflow-auto p-4 bg-black/40 m-4 rounded-[24px] border border-white/10 shadow-inner custom-scrollbar">
            {/* Simple preview logic, actual PDF rendering would need a lot more work or an iframe */}
            {docViewer.type === 'pdf' ? (
              <iframe src={docViewer.src} className="w-full h-full rounded-xl" title="PDF Viewer" />
            ) : (
              <pre className="text-white/80 whitespace-pre-wrap">{docViewer.src}</pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
