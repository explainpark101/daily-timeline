import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Calendar, CheckCircle2, Circle, Clock, Plus, Trash2, AlignLeft, Sun, Moon, ChevronUp, ChevronDown, Download, Upload, Share2, Zap, Edit2, Save, X, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';

// --- 유틸리티 및 IndexedDB 설정 ---
const DB_NAME = 'TimelineAppDB';
const STORE_NAME = 'tasks';
const DB_VERSION = 1;

const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getTasksFromDB = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveTaskToDB = async (task) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(task);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const deleteTaskFromDB = async (id) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const clearDB = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// 날짜 관련 유틸리티
const parseDate = (dateStr) => new Date(dateStr);
const getDaysBetween = (start, end) => {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  const diffTime = endDate.getTime() - startDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
const formatDate = (date) => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}/${day}`;
};
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};
const getTodayStr = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const formatToYYYYMMDD = (year, month, day) => {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

// --- 커스텀 DatePicker 모달 컴포넌트 ---
const DatePickerModal = ({ isOpen, onClose, onSelect, initialDate }) => {
  const [currentView, setCurrentView] = useState(new Date());

  useEffect(() => {
    if (isOpen) {
      setCurrentView(initialDate ? parseDate(initialDate) : new Date());
    }
  }, [isOpen, initialDate]);

  if (!isOpen) return null;

  const year = currentView.getFullYear();
  const month = currentView.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const handlePrevMonth = () => setCurrentView(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentView(new Date(year, month + 1, 1));
  const handleSelect = (day) => {
    if (!day) return;
    onSelect(formatToYYYYMMDD(year, month, day));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-4 w-full max-w-[300px] border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <button type="button" onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold text-slate-800 dark:text-slate-100">
            {year}년 {month + 1}월
          </span>
          <button type="button" onClick={handleNextMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
            <div key={d} className={`text-xs font-medium ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-500 dark:text-slate-400'}`}>
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {days.map((day, idx) => {
            const isToday = day && formatToYYYYMMDD(year, month, day) === getTodayStr();
            const isSelected = day && formatToYYYYMMDD(year, month, day) === initialDate;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(day)}
                disabled={!day}
                className={`
                  h-8 w-8 mx-auto rounded-full flex items-center justify-center text-sm transition-colors
                  ${!day ? 'invisible' : ''}
                  ${isSelected ? 'bg-blue-600 text-white font-bold shadow-sm' : 
                    isToday ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold hover:bg-blue-200 dark:hover:bg-blue-800' : 
                    'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'}
                `}
              >
                {day}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            취소
          </button>
        </div>
      </div>
    </div>
  );
};


export default function App() {
  const [tasks, setTasks] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const fileInputRef = useRef(null);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskStart, setNewTaskStart] = useState(getTodayStr());
  const [newTaskDue, setNewTaskDue] = useState(addDays(new Date(), 1).toISOString().split('T')[0]);
  
  // 퀵 툴바 상태
  const [isQuickToolsOpen, setIsQuickToolsOpen] = useState(false);

  // 일정 수정 상태
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editDue, setEditDue] = useState('');

  // DatePicker 모달 상태
  const [datePickerConfig, setDatePickerConfig] = useState({ isOpen: false, field: null, date: '' });

  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-red-500', 'bg-orange-500', 'bg-teal-500', 'bg-pink-500'];

  // 초기 데이터 로드 (IndexedDB 및 해시)
  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. 해시 링크를 통한 데이터 로드 시도
        const hash = window.location.hash;
        if (hash.startsWith('#share=')) {
          const base64 = hash.replace('#share=', '');
          try {
            // 한글 등 유니코드 처리를 위해 decodeURIComponent 사용
            const dataStr = decodeURIComponent(atob(base64));
            const sharedTasks = JSON.parse(dataStr);
            
            if (window.confirm('공유된 일정을 불러오시겠습니까? 기존 로컬 데이터는 모두 덮어쓰기 됩니다.')) {
              await clearDB();
              for (const t of sharedTasks) {
                await saveTaskToDB(t);
              }
              setTasks(sharedTasks);
              window.history.replaceState(null, '', window.location.pathname); // 해시 초기화
              setIsLoaded(true);
              return; // 공유 데이터 로드 성공 시 함수 종료
            }
          } catch(e) {
            console.error('공유 데이터 로드 실패:', e);
            alert('유효하지 않은 공유 링크입니다.');
          }
          // 취소하거나 실패한 경우 주소창 해시 지우기
          window.history.replaceState(null, '', window.location.pathname);
        }

        // 2. 일반 로컬 데이터 로드
        const storedTasks = await getTasksFromDB();
        if (storedTasks && storedTasks.length > 0) {
          // order 속성 기준으로 정렬 (기존 데이터 호환을 위해 없으면 id 기준)
          const orderedTasks = storedTasks.sort((a, b) => {
            const orderA = a.order !== undefined ? a.order : a.id;
            const orderB = b.order !== undefined ? b.order : b.id;
            return orderA - orderB;
          });
          
          // 모든 항목에 올바른 order 값 부여 및 업데이트
          const normalizedTasks = orderedTasks.map((t, index) => {
            if (t.order !== index) {
              t.order = index;
              saveTaskToDB(t); // 백그라운드로 DB 업데이트
            }
            return t;
          });
          setTasks(normalizedTasks);
        } else {
          setTasks([]);
        }
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    if (new Date(newTaskStart) > new Date(newTaskDue)) {
      alert('시작일은 마감일보다 이전이어야 합니다.');
      return;
    }

    const newTask = {
      id: Date.now(),
      title: newTaskTitle,
      startDate: newTaskStart,
      dueDate: newTaskDue,
      completed: false,
      color: colors[tasks.length % colors.length],
      order: tasks.length,
    };

    try {
      await saveTaskToDB(newTask);
      setTasks([...tasks, newTask]);
      setNewTaskTitle('');
      setNewTaskStart(newTaskDue);
      setNewTaskDue(addDays(parseDate(newTaskDue), 1).toISOString().split('T')[0]);
    } catch (error) {
      console.error("일정 저장 실패:", error);
    }
  };

  const deleteTask = async (id) => {
    try {
      await deleteTaskFromDB(id);
      setTasks(tasks.filter(t => t.id !== id));
    } catch (error) {
      console.error("일정 삭제 실패:", error);
    }
  };

  const toggleTaskStatus = async (id) => {
    const targetTask = tasks.find(t => t.id === id);
    if (!targetTask) return;

    const updatedTask = { ...targetTask, completed: !targetTask.completed };
    try {
      await saveTaskToDB(updatedTask);
      setTasks(tasks.map(t => t.id === id ? updatedTask : t));
    } catch (error) {
      console.error("일정 상태 변경 실패:", error);
    }
  };

  const startEdit = (task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditStart(task.startDate);
    setEditDue(task.dueDate);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id) => {
    if (!editTitle.trim()) return;
    if (new Date(editStart) > new Date(editDue)) {
      alert('시작일은 마감일보다 이전이어야 합니다.');
      return;
    }
    const targetTask = tasks.find(t => t.id === id);
    const updatedTask = { ...targetTask, title: editTitle, startDate: editStart, dueDate: editDue };
    try {
      await saveTaskToDB(updatedTask);
      setTasks(tasks.map(t => t.id === id ? updatedTask : t));
      setEditingId(null);
    } catch (error) {
      console.error("일정 수정 실패:", error);
    }
  };

  // 공통 이미지 생성 로직 (oklch 등 최신 CSS 지원을 위해 html2canvas-pro 사용)
  const getTimelineBlob = async () => {
    let h2c = window.html2canvas;
    // 기존에 로드된 html2canvas가 pro 버전이 아닐 수 있으므로 강제 로드 확인
    if (!h2c || !window.__isH2cPro) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/html2canvas-pro@1.5.3/dist/html2canvas-pro.min.js';
      await new Promise((resolve, reject) => {
        script.onload = () => {
          window.__isH2cPro = true;
          resolve();
        };
        script.onerror = reject;
        document.head.appendChild(script);
      });
      h2c = window.html2canvas;
    }

    const element = document.getElementById('timeline-chart-content');
    if (!element) throw new Error("타임라인 요소를 찾을 수 없습니다.");

    const canvas = await h2c(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: isDarkMode ? '#1e293b' : '#ffffff'
    });

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
  };

  // 이미지 클립보드 복사
  const copyTimelineAsImage = async () => {
    try {
      const blob = await getTimelineBlob();
      if (!blob) throw new Error("이미지 생성에 실패했습니다.");

      const item = new window.ClipboardItem({ "image/png": blob });
      await navigator.clipboard.write([item]);
      alert('타임라인 이미지가 클립보드에 복사되었습니다.');
    } catch (error) {
      console.error("이미지 복사 실패:", error);
      alert('클립보드 권한이 제한되어 있거나 지원하지 않는 환경입니다. 우측의 "이미지 저장" 버튼을 이용해 주십시오.');
    }
  };

  // 이미지 파일 저장 다운로드
  const saveTimelineAsImage = async () => {
    try {
      const blob = await getTimelineBlob();
      if (!blob) throw new Error("이미지 생성에 실패했습니다.");

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timeline_${getTodayStr()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("이미지 저장 실패:", error);
      alert("이미지 캡처 또는 저장에 실패했습니다.");
    }
  };

  const moveTask = async (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === tasks.length - 1) return;

    const newTasks = [...tasks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    // 배열 순서 교환
    const temp = newTasks[index];
    newTasks[index] = newTasks[targetIndex];
    newTasks[targetIndex] = temp;

    // order 속성 재할당
    newTasks[index].order = index;
    newTasks[targetIndex].order = targetIndex;

    try {
      // 변경된 순서를 DB에 저장
      await Promise.all([
        saveTaskToDB(newTasks[index]),
        saveTaskToDB(newTasks[targetIndex])
      ]);
      setTasks(newTasks);
    } catch (error) {
      console.error("순서 변경 실패:", error);
    }
  };

  const exportJSON = () => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'timeline-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedTasks = JSON.parse(event.target.result);
        if (!Array.isArray(importedTasks)) throw new Error("배열 형태가 아닙니다.");
        
        if (window.confirm('가져온 데이터로 기존 일정을 덮어쓰시겠습니까?')) {
          await clearDB();
          for (const t of importedTasks) {
            await saveTaskToDB(t);
          }
          setTasks(importedTasks);
        }
      } catch (err) {
        console.error("가져오기 실패:", err);
        alert('유효하지 않은 JSON 파일이거나 데이터 형식이 잘못되었습니다.');
      } finally {
        // 동일한 파일을 반복해서 선택할 수 있도록 input value 초기화
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const shareToHash = () => {
    if (tasks.length === 0) {
      alert('공유할 일정이 없습니다.');
      return;
    }
    
    try {
      const dataStr = JSON.stringify(tasks);
      // 유니코드 문자를 안전하게 Base64로 인코딩
      const base64 = btoa(encodeURIComponent(dataStr));
      const newUrl = `${window.location.origin}${window.location.pathname}#share=${base64}`;
      
      // iFrame 환경에서도 클립보드 복사가 잘 작동하도록 텍스트 에어리어 활용
      const textArea = document.createElement("textarea");
      textArea.value = newUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      alert('공유 링크가 클립보드에 복사되었습니다! 이 링크를 통해 다른 사람과 일정을 공유할 수 있습니다.');
    } catch (err) {
      console.error("공유 링크 생성 실패:", err);
      alert('공유 링크 생성 중 오류가 발생했습니다.');
    }
  };

  // 모달 열기 핸들러
  const openDatePicker = (field, currentDate) => {
    setDatePickerConfig({ isOpen: true, field, date: currentDate });
  };

  // 모달 날짜 선택 핸들러
  const handleDateSelect = (selectedDate) => {
    if (datePickerConfig.field === 'newStart') {
      setNewTaskStart(selectedDate);
      if (new Date(selectedDate) > new Date(newTaskDue)) setNewTaskDue(selectedDate);
    } else if (datePickerConfig.field === 'newDue') {
      setNewTaskDue(selectedDate);
    } else if (datePickerConfig.field === 'editStart') {
      setEditStart(selectedDate);
    } else if (datePickerConfig.field === 'editDue') {
      setEditDue(selectedDate);
    }
    setDatePickerConfig({ isOpen: false, field: null, date: '' });
  };

  // 퀵 툴바 날짜 설정 로직
  const setQuickStartDate = (daysToAdd) => {
    const newStart = addDays(new Date(), daysToAdd).toISOString().split('T')[0];
    setNewTaskStart(newStart);
    // 시작일이 마감일보다 늦어지면 마감일도 자동 보정
    if (new Date(newStart) > new Date(newTaskDue)) {
      setNewTaskDue(newStart);
    }
  };

  const setQuickDuration = (daysToAdd) => {
    const newDue = addDays(parseDate(newTaskStart), daysToAdd).toISOString().split('T')[0];
    setNewTaskDue(newDue);
  };

  const timelineData = useMemo(() => {
    if (tasks.length === 0) {
      const today = new Date();
      return {
        startDate: addDays(today, -1),
        endDate: addDays(today, 7),
        totalDays: 8,
        minDate: addDays(today, -1),
        days: Array.from({ length: 8 }, (_, i) => addDays(today, i - 1))
      };
    }

    const startDates = tasks.map(t => parseDate(t.startDate));
    const dueDates = tasks.map(t => parseDate(t.dueDate));
    
    let minDate = new Date(Math.min(...startDates));
    let maxDate = new Date(Math.max(...dueDates));

    minDate = addDays(minDate, -2);
    maxDate = addDays(maxDate, 3);

    const totalDays = getDaysBetween(minDate, maxDate) + 1;
    const days = Array.from({ length: totalDays }, (_, i) => addDays(minDate, i));

    return { minDate, maxDate, totalDays, days };
  }, [tasks]);

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center dark:bg-slate-900 dark:text-white">로딩 중...</div>;

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans p-4 md:p-8 transition-colors duration-200">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* 헤더 섹션 */}
          <header className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center space-x-3">
              <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">일정 타임라인 관리</h1>
            </div>
            <div className="flex items-center space-x-2">
              <input 
                type="file" 
                accept=".json" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={importJSON} 
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
                title="JSON 불러오기"
              >
                <Upload className="w-5 h-5" />
              </button>
              <button
                onClick={exportJSON}
                className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
                title="JSON 내보내기"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={shareToHash}
                className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors shrink-0"
                title="링크 복사 (공유)"
              >
                <Share2 className="w-5 h-5" />
              </button>
              
              <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>
              
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
                title="다크모드 토글"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 왼쪽 패널: 할 일 목록 및 추가 폼 */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* 할 일 추가 폼 */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 transition-colors">
                <h2 className="text-lg font-semibold mb-4 flex items-center text-slate-700 dark:text-slate-200">
                  <Plus className="w-5 h-5 mr-2 text-blue-500 dark:text-blue-400" />
                  새로운 일정 추가
                </h2>
                <form onSubmit={addTask} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">할 일 제목</label>
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="예: 기획 회의 진행"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 relative">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">시작일</label>
                      <button
                        type="button"
                        onClick={() => openDatePicker('newStart', newTaskStart)}
                        className="w-full px-3 py-2 text-left bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm flex justify-between items-center transition-shadow"
                      >
                        <span>{newTaskStart}</span>
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">마감일</label>
                      <button
                        type="button"
                        onClick={() => openDatePicker('newDue', newTaskDue)}
                        className="w-full px-3 py-2 text-left bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm flex justify-between items-center transition-shadow"
                      >
                        <span>{newTaskDue}</span>
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      </button>
                    </div>
                  </div>

                  {/* 날짜 빠른 설정 툴바 */}
                  <div>
                    <button 
                      type="button" 
                      onClick={() => setIsQuickToolsOpen(!isQuickToolsOpen)}
                      className="flex items-center space-x-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      <Zap className="w-3.5 h-3.5 shrink-0" />
                      <span>날짜 빠른 설정</span>
                      {isQuickToolsOpen ? <ChevronUp className="w-3.5 h-3.5 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                    
                    {isQuickToolsOpen && (
                      <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3 shadow-inner">
                        <div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">시작일 (오늘 기준)</span>
                          <div className="flex flex-wrap gap-1.5">
                            <button type="button" onClick={() => setQuickStartDate(0)} className="px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">오늘</button>
                            <button type="button" onClick={() => setQuickStartDate(1)} className="px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">내일</button>
                            <button type="button" onClick={() => setQuickStartDate(3)} className="px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">3일 후</button>
                            <button type="button" onClick={() => setQuickStartDate(7)} className="px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">1주 후</button>
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block font-medium">진행 기간 (시작일 기준)</span>
                          <div className="flex flex-wrap gap-1.5">
                            <button type="button" onClick={() => setQuickDuration(0)} className="px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">당일</button>
                            <button type="button" onClick={() => setQuickDuration(1)} className="px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">이틀</button>
                            <button type="button" onClick={() => setQuickDuration(2)} className="px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">사흘</button>
                            <button type="button" onClick={() => setQuickDuration(3)} className="px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">나흘</button>
                            <button type="button" onClick={() => setQuickDuration(6)} className="px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">1주일</button>
                            <button type="button" onClick={() => setQuickDuration(13)} className="px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">2주일</button>
                            <button type="button" onClick={() => setQuickDuration(20)} className="px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">3주</button>
                            <button type="button" onClick={() => setQuickDuration(27)} className="px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">4주</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center mt-2"
                  >
                    <Plus className="w-4 h-4 mr-1 shrink-0" />
                    일정 등록
                  </button>
                </form>
              </div>

              {/* 할 일 목록 */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 transition-colors">
                <h2 className="text-lg font-semibold mb-4 flex items-center text-slate-700 dark:text-slate-200">
                  <AlignLeft className="w-5 h-5 mr-2 text-blue-500 dark:text-blue-400" />
                  할 일 목록 ({tasks.length})
                </h2>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {tasks.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400 text-center py-6 text-sm">등록된 일정이 없습니다.</p>
                  ) : (
                    tasks.map((task, index) => (
                      <div 
                        key={task.id} 
                        className={`p-3 rounded-lg border transition-all ${
                          task.completed 
                            ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-70' 
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 shadow-sm'
                        }`}
                      >
                        {editingId === task.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full px-2 py-1 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <div className="flex space-x-2">
                              <button
                                type="button"
                                onClick={() => openDatePicker('editStart', editStart)}
                                className="w-1/2 px-2 py-1 text-xs text-left bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-blue-500 flex justify-between items-center"
                              >
                                <span>{editStart}</span>
                                <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openDatePicker('editDue', editDue)}
                                className="w-1/2 px-2 py-1 text-xs text-left bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-blue-500 flex justify-between items-center"
                              >
                                <span>{editDue}</span>
                                <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                              </button>
                            </div>
                            <div className="flex justify-end space-x-1 mt-2">
                              <button onClick={() => saveEdit(task.id)} className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-slate-700 rounded transition-colors" title="저장">
                                <Save className="w-4 h-4 shrink-0" />
                              </button>
                              <button onClick={cancelEdit} className="p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors" title="취소">
                                <X className="w-4 h-4 shrink-0" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 overflow-hidden">
                              <button 
                                onClick={() => toggleTaskStatus(task.id)}
                                className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                              >
                                {task.completed ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-500 dark:text-green-400" />
                                ) : (
                                  <Circle className="w-5 h-5" />
                                )}
                              </button>
                              <div className="min-w-0">
                                <h3 className={`font-medium truncate ${task.completed ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-slate-100'}`}>
                                  {task.title}
                                </h3>
                                <div className="flex items-center mt-1 text-xs text-slate-500 dark:text-slate-400 space-x-2">
                                  <span className="flex items-center">
                                    <Clock className="w-3 h-3 mr-1 shrink-0" />
                                    {task.startDate} ~ {task.dueDate}
                                  </span>
                                  <span className={`w-2 h-2 shrink-0 rounded-full ${task.color}`}></span>
                                </div>
                              </div>
                            </div>
                            <div className="shrink-0 flex items-center ml-2 space-x-1">
                              <button 
                                onClick={() => startEdit(task)}
                                className="text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors p-1"
                                title="수정"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <div className="flex flex-col border-l border-slate-200 dark:border-slate-600 pl-1 ml-1">
                                <button 
                                  onClick={() => moveTask(index, 'up')} 
                                  disabled={index === 0} 
                                  className="text-slate-400 hover:text-blue-500 disabled:opacity-30 disabled:hover:text-slate-400 p-0.5"
                                  title="위로 이동"
                                >
                                  <ChevronUp className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => moveTask(index, 'down')} 
                                  disabled={index === tasks.length - 1} 
                                  className="text-slate-400 hover:text-blue-500 disabled:opacity-30 disabled:hover:text-slate-400 p-0.5"
                                  title="아래로 이동"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </button>
                              </div>
                              <button 
                                onClick={() => deleteTask(task.id)}
                                className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 ml-1"
                                title="삭제"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* 오른쪽 패널: 타임라인 뷰 */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 overflow-hidden flex flex-col transition-colors">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h2 className="text-lg font-semibold flex items-center text-slate-700 dark:text-slate-200">
                  <Calendar className="w-5 h-5 mr-2 text-blue-500 dark:text-blue-400" />
                  타임라인
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={copyTimelineAsImage}
                    className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md transition-colors"
                    title="타임라인을 이미지로 복사"
                  >
                    <ImageIcon className="w-4 h-4 shrink-0" />
                    <span>이미지 복사</span>
                  </button>
                  <button
                    onClick={saveTimelineAsImage}
                    className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm"
                    title="타임라인을 파일로 저장"
                  >
                    <Download className="w-4 h-4 shrink-0" />
                    <span>이미지 저장</span>
                  </button>
                </div>
              </div>
              
              <div className="relative flex-1 overflow-x-auto overflow-y-auto border border-slate-100 dark:border-slate-700 rounded-lg custom-scrollbar">
                <div id="timeline-chart-content" className="min-w-max bg-white dark:bg-slate-800 pb-2">
                  
                  {/* 타임라인 헤더 (날짜) */}
                  <div className="flex border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-slate-50 dark:bg-slate-800 z-10">
                    <div className="w-48 shrink-0 border-r border-slate-200 dark:border-slate-700 p-3 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800">
                      일정 명
                    </div>
                    {timelineData.days.map((day, idx) => {
                      const isToday = day.toISOString().split('T')[0] === getTodayStr();
                      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                      return (
                        <div 
                          key={idx} 
                          className={`w-16 shrink-0 border-r border-slate-100 dark:border-slate-700 p-2 text-center flex flex-col items-center justify-center transition-colors
                            ${isToday 
                              ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold' 
                              : (isWeekend ? 'bg-slate-50/50 dark:bg-slate-800/50 text-red-400 dark:text-red-400' : 'text-slate-600 dark:text-slate-400')}
                          `}
                        >
                          <span className="text-[10px] uppercase">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day.getDay()]}</span>
                          <span className="text-sm">{formatDate(day)}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* 타임라인 바디 (일정 바) */}
                  <div className="relative pb-6">
                    {tasks.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                        왼쪽에서 일정을 추가하여 타임라인을 확인하세요.
                      </div>
                    ) : (
                      tasks.map((task) => {
                        const startOffsetDays = getDaysBetween(timelineData.minDate, task.startDate);
                        const durationDays = getDaysBetween(task.startDate, task.dueDate) + 1; 
                        
                        const width = durationDays * 64;

                        return (
                          <div key={task.id} className="flex border-b border-slate-100 dark:border-slate-700 relative group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            {/* 왼쪽 일정 이름 */}
                            <div className="w-48 shrink-0 border-r border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-800 group-hover:bg-slate-50 dark:group-hover:bg-slate-700/50 z-10 flex items-center transition-colors">
                              <span className={`text-sm truncate ${task.completed ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-200 font-medium'}`}>
                                {task.title}
                              </span>
                            </div>
                            
                            {/* 오른쪽 그리드 배경 */}
                            <div className="flex relative">
                              {timelineData.days.map((_, idx) => (
                                <div key={idx} className="w-16 shrink-0 border-r border-slate-100 dark:border-slate-700 h-14"></div>
                              ))}
                              
                              {/* 실제 타임라인 바 */}
                              <div 
                                className={`absolute top-1/2 -translate-y-1/2 h-8 rounded-md shadow-sm flex items-center px-3 overflow-hidden cursor-default transition-all opacity-90 hover:opacity-100 ${task.color} ${task.completed ? 'opacity-50 grayscale' : ''}`}
                                style={{ 
                                  left: `${startOffsetDays * 64}px`, 
                                  width: `${width - 4}px`,
                                  marginLeft: '2px' 
                                }}
                                title={`${task.title} (${task.startDate} ~ ${task.dueDate})`}
                              >
                                <span className="text-white text-xs font-semibold truncate">
                                  {durationDays}일
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    
                    {/* 오늘 날짜 표시선 */}
                    {timelineData.days.some(d => d.toISOString().split('T')[0] === getTodayStr()) && (
                      <div 
                        className="absolute top-0 bottom-0 border-l-2 border-blue-400 dark:border-blue-500 border-dashed pointer-events-none z-20"
                        style={{
                          left: `${192 + (getDaysBetween(timelineData.minDate, getTodayStr()) * 64) + 32}px`
                        }}
                      >
                        <div className="absolute -top-3 -translate-x-1/2 bg-blue-500 dark:bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                          오늘
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
              
            </div>
          </div>
        </div>

        {/* 커스텀 DatePicker 모달 렌더링 영역 */}
        <DatePickerModal 
          isOpen={datePickerConfig.isOpen} 
          onClose={() => setDatePickerConfig({ ...datePickerConfig, isOpen: false })}
          onSelect={handleDateSelect}
          initialDate={datePickerConfig.date}
        />

        {/* 스크롤바 커스텀 스타일 (다크모드 대응 포함) */}
        <style dangerouslySetInnerHTML={{__html: `
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
            height: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
          .dark .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #475569;
          }
          .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #64748b;
          }
        `}} />
      </div>
    </div>
  );
}
