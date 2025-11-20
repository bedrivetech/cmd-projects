import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, Clock, FileText, AlertCircle, Briefcase, Building, 
  Filter, PieChart, Sparkles, X, Loader2, Mail, Copy, Check, Plus, Save, Pencil, Layers, Trash2, Database
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, writeBatch 
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';

// --- Configuration ---
const apiKey = "AIzaSyDRVla9f593dBhdLLSZhhv1v7V7DeejUuE"; 

// --- Firebase Setup ---
// --- Firebase Setup ---
// انسخ هذه البيانات من: Project Settings -> General -> Your apps -> SDK setup/configuration
const firebaseConfig = {
  apiKey: "AIzaSyAz7JADQ0I-GS_Yq9AhCoAQgK_Vo6a9L4c",
  authDomain: "cmdec-reg.firebaseapp.com",
  projectId: "cmdec-reg",
  storageBucket: "cmdec-reg.firebasestorage.app",
  messagingSenderId: "875783460810",
  appId: "1:875783460810:web:f31056c9c70ad219d3a133"
};

const app = initializeApp(firebaseConfig);
const appId = "my-dashboard-app"; // يمكنك وضع أي اسم تريده هنا
const auth = getAuth(app);
const db = getFirestore(app);

// --- Initial Data for Seeding ---
const SEED_DATA = [
    { platform: 'سابك (SABIC)', status: 'مسجل', type: 'complete', category: 'office' },
    { platform: 'لوبرف (Luberef)', status: 'مسجل', type: 'complete', category: 'office' },
    { platform: 'هاليبورتون (Halliburton)', status: 'مسجل', type: 'complete', category: 'office' },
    { platform: 'السعودية (Saudia)', status: 'مسجل', type: 'complete', category: 'office' },
    { platform: 'المياه (NWC)', status: 'الاوراق تحت المراجعة', type: 'pending', category: 'office' },
    { platform: 'نيوم (NEOM)', status: 'التسجيل', type: 'pending', category: 'office' },
    { platform: 'وزارة الثقافة', status: 'مسجل', type: 'complete', category: 'office' },
    { platform: 'وزارة الطاقة', status: 'مسجل', type: 'complete', category: 'office' },
    { platform: 'لجام (Leejam)', status: 'مسجل', type: 'complete', category: 'office' },
    { platform: 'ياسرف (Yasref)', status: 'الاوراق تحت المراجعة', type: 'pending', category: 'office' },
    { platform: 'أرامكو (Aramco)', status: 'بانتظار الشهادة والعمل عليها', type: 'in_progress', category: 'office' },
    { platform: 'أمانة المدينة', status: 'تم التسجيل', type: 'complete', category: 'office' },
    { platform: 'منصة خبير', status: 'تم التسجيل', type: 'complete', category: 'office' },
    { platform: 'وزارة الدفاع', status: 'الاوراق تحت المراجعة', type: 'pending', category: 'office' },
    { platform: 'بوابة الترفيه', status: 'جاري العمل على اكمال التسجيل', type: 'in_progress', category: 'office' },
    { platform: 'Sabic portal', status: 'تم التسجيل', type: 'complete', category: 'office' },
    { platform: 'الهيئة الملكية للجبيل وينبع', status: 'مسجلة', type: 'complete', category: 'office' },
    { platform: 'بوابة الدرعية', status: 'غير محدد', type: 'unknown', category: 'office' },
    { platform: 'بوابة القدية', status: 'غير محدد', type: 'unknown', category: 'office' },
    { platform: 'سامرف (SAMREF)', status: 'مسجلة', type: 'complete', category: 'company' },
    { platform: 'لوبرف (Luberef)', status: 'مسجلة', type: 'complete', category: 'company' },
    { platform: 'بترو رابغ', status: 'مسجلة', type: 'complete', category: 'company' },
    { platform: 'السعودية (Saudia)', status: 'مسجلة', type: 'complete', category: 'company' },
    { platform: 'أرامكو (Aramco)', status: 'بانتظار الأمن السيبراني / مراجعة العرض', type: 'in_progress', category: 'company' },
    { platform: 'الشركة السعودية للكهرباء', status: 'تم اضافة الأوراق وباقي ورقة الملاك', type: 'in_progress', category: 'company' },
    { platform: 'ياسرف (Yasref)', status: 'تم التقديم', type: 'pending', category: 'company' },
    { platform: 'وزارة الطاقة', status: 'تم تقديم الاوراق', type: 'pending', category: 'company' },
    { platform: 'شركة المياه', status: 'قيد التسجيل', type: 'in_progress', category: 'sinoma' },
];

// --- Category Labels ---
const CATEGORY_LABELS = {
  office: 'التسجيلات الخاصة بالمكتب',
  company: 'التسجيلات الخاصة بالشركة',
  sinoma: 'تسجيلات شركة سينوما'
};

const getCategoryLabel = (key) => CATEGORY_LABELS[key] || key;

// --- AI Helper Function ---
async function generateContent(prompt) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    if (!response.ok) throw new Error('AI Request failed');
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "تعذر الحصول على رد.";
  } catch (error) {
    console.error(error);
    return "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي. يرجى المحاولة لاحقاً.";
  }
}

// --- Components ---

const StatusBadge = ({ type, text }) => {
  const styles = {
    complete: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
    unknown: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  const icons = {
    complete: <CheckCircle className="w-3 h-3 ml-1" />,
    pending: <Clock className="w-3 h-3 ml-1" />,
    in_progress: <FileText className="w-3 h-3 ml-1" />,
    unknown: <AlertCircle className="w-3 h-3 ml-1" />,
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center w-fit ${styles[type] || styles.unknown}`}>
      {icons[type]}
      {text}
    </span>
  );
};

const TransactionModal = ({ isOpen, onClose, onSave, onDelete, initialData, categories, isSaving }) => {
  const [formData, setFormData] = useState({
    id: null, platform: '', category: 'office', status: '', type: 'pending'
  });
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData(initialData);
        setIsNewCategory(false);
        setNewCategoryName('');
      } else {
        setFormData({
          id: null, platform: '', category: categories[0] || 'office', status: '', type: 'pending'
        });
        setIsNewCategory(false);
        setNewCategoryName('');
      }
    }
  }, [isOpen, initialData, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    let finalCategory = formData.category;
    if (isNewCategory && newCategoryName.trim()) {
      finalCategory = newCategoryName.trim();
    }
    onSave({ ...formData, category: finalCategory });
  };

  const isEditing = !!initialData;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-800 p-4 flex justify-between items-center">
          <h3 className="text-white font-bold flex items-center gap-2">
            {isEditing ? <Pencil className="w-5 h-5 text-amber-400" /> : <Plus className="w-5 h-5 text-emerald-400" />}
            {isEditing ? 'تعديل المعاملة' : 'إضافة معاملة جديدة'}
          </h3>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">اسم المنصة</label>
            <input 
              required type="text" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-right"
              value={formData.platform} onChange={(e) => setFormData({...formData, platform: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">الفئة</label>
            {!isNewCategory ? (
              <div className="flex gap-2">
                <select 
                  className="flex-1 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-right bg-white"
                  value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                  ))}
                </select>
                <button type="button" onClick={() => setIsNewCategory(true)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-lg text-xs font-bold border border-slate-300 whitespace-nowrap">
                  + فئة
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input 
                  required type="text" className="w-full p-2 border border-emerald-500 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-right"
                  placeholder="اسم الفئة الجديدة..." value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} autoFocus
                />
                <button type="button" onClick={() => setIsNewCategory(false)} className="text-xs text-red-500 underline hover:text-red-700">إلغاء</button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">وصف الحالة</label>
            <input 
              required type="text" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-right"
              value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">نوع الحالة (التصنيف)</label>
            <select 
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-right bg-white"
              value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}
            >
              <option value="complete">مكتمل / تم التسجيل</option>
              <option value="pending">قيد الانتظار / معلق</option>
              <option value="in_progress">جاري العمل / تحت الإجراء</option>
              <option value="unknown">غير محدد</option>
            </select>
          </div>

          <div className="pt-4 flex gap-2">
            <button 
              type="submit" disabled={isSaving}
              className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />}
              {isEditing ? 'حفظ التعديلات' : 'حفظ'}
            </button>
            {isEditing && onDelete && (
                <button 
                type="button" disabled={isSaving}
                onClick={() => { if(window.confirm('هل أنت متأكد من حذف هذه المعاملة؟')) onDelete(initialData.id); }}
                className="bg-red-50 text-red-600 py-2 px-3 rounded-lg hover:bg-red-100 transition-colors"
                >
                <Trash2 className="w-5 h-5" />
                </button>
            )}
            <button type="button" onClick={onClose} disabled={isSaving} className="flex-1 bg-slate-100 text-slate-700 py-2 px-4 rounded-lg hover:bg-slate-200 transition-colors font-medium">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AIModal = ({ isOpen, onClose, title, content, isLoading }) => {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-4 flex justify-between items-center">
          <h3 className="text-white font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-300" /> {title}
          </h3>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
              <p className="text-slate-500 animate-pulse">جاري المعالجة بواسطة Gemini...</p>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">{content}</div>
          )}
        </div>
        {!isLoading && content && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
            <button onClick={handleCopy} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm font-medium">
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />} {copied ? "تم النسخ" : "نسخ النص"}
            </button>
            <button onClick={onClose} className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium">إغلاق</button>
          </div>
        )}
      </div>
    </div>
  );
};

const SectionCard = ({ title, categoryKey, icon: Icon, data, filter, onDraftEmail, onEdit }) => {
  const filteredData = data.filter(item => filter === 'all' || item.type === filter);
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm"><Icon className="w-5 h-5 text-slate-600" /></div>
          <div><h3 className="font-bold text-lg text-slate-800">{title}</h3><p className="text-xs text-slate-500">إجمالي المنصات: {data.length}</p></div>
        </div>
        <div className="flex gap-2">
            <div className="text-center px-3 py-1 bg-emerald-50 rounded border border-emerald-100"><span className="block text-xs text-emerald-600 font-bold">تم</span><span className="text-lg font-bold text-emerald-700 leading-none">{data.filter(i => i.type === 'complete').length}</span></div>
            <div className="text-center px-3 py-1 bg-amber-50 rounded border border-amber-100"><span className="block text-xs text-amber-600 font-bold">جاري</span><span className="text-lg font-bold text-amber-700 leading-none">{data.filter(i => i.type !== 'complete' && i.type !== 'unknown').length}</span></div>
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {filteredData.length > 0 ? (
          filteredData.map((item) => (
            <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 group">
              <div className="font-medium text-slate-700">{item.platform}</div>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <StatusBadge type={item.type} text={item.status} />
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <button onClick={() => onEdit(item, categoryKey)} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-md" title="تعديل"><Pencil className="w-4 h-4" /></button>
                    {item.type !== 'complete' && item.type !== 'unknown' && !item.status.includes('تحت المراجعة') && (
                    <button onClick={() => onDraftEmail(item)} className="p-1.5 text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-md flex items-center gap-1 text-xs font-medium" title="صياغة بريد متابعة"><Sparkles className="w-3 h-3" /><span className="hidden sm:inline">إيميل</span><Mail className="w-3 h-3 sm:hidden" /></button>
                    )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-slate-400 text-sm">لا توجد بيانات تطابق الفلتر المحدد</div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, colorClass, icon: Icon }) => (
  <div className={`bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4`}>
    <div className={`p-3 rounded-full ${colorClass} bg-opacity-10`}><Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} /></div>
    <div><p className="text-sm text-slate-500">{label}</p><p className="text-2xl font-bold text-slate-800">{value}</p></div>
  </div>
);

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const [filter, setFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isTransModalOpen, setIsTransModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Auth Setup
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 2. Data Fetching & Seeding
  useEffect(() => {
    if (!user) return;

    const collectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'transactions');
    const q = query(collectionRef); // Simple query as per rules

    const unsubscribe = onSnapshot(q, async (snapshot) => {
        if (snapshot.empty && !snapshot.metadata.hasPendingWrites) {
            // Seed Data ONLY if empty and not currently writing
            // Check one more time to be safe (avoid infinite loops in some edge cases)
            // For this demo, we'll seed only if absolutely 0 docs
            const batch = writeBatch(db);
            SEED_DATA.forEach(item => {
                const docRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'transactions'));
                batch.set(docRef, { ...item, createdAt: new Date().toISOString() });
            });
            await batch.commit();
            console.log("Database seeded with initial data");
        } else {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTransactions(items);
            setIsLoadingData(false);
        }
    }, (error) => {
        console.error("Error fetching transactions:", error);
        setIsLoadingData(false);
    });

    return () => unsubscribe();
  }, [user]);

  // --- Processing Data for View ---
  // Group flat transactions list into categories
  const groupedData = React.useMemo(() => {
      const groups = {};
      // Ensure we have at least the default categories initialized
      Object.keys(CATEGORY_LABELS).forEach(key => groups[key] = []);
      
      transactions.forEach(item => {
          const cat = item.category || 'office';
          if (!groups[cat]) groups[cat] = [];
          groups[cat].push(item);
      });
      return groups;
  }, [transactions]);

  const allCategories = Object.keys(groupedData);
  const total = transactions.length;
  const completed = transactions.filter(i => i.type === 'complete').length;
  const pending = transactions.filter(i => i.type === 'pending' || i.type === 'in_progress').length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // --- Handlers ---

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsTransModalOpen(true);
  };

  const handleOpenEdit = (item, category) => {
    setEditingItem({ ...item, category });
    setIsTransModalOpen(true);
  };

  const handleDeleteTransaction = async (id) => {
    if (!user) return;
    try {
        setIsSaving(true);
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'transactions', id));
        setIsTransModalOpen(false);
    } catch (e) {
        console.error(e);
        alert("حدث خطأ أثناء الحذف");
    } finally {
        setIsSaving(false);
    }
  };

  const handleSaveTransaction = async (formData) => {
    if (!user) return;
    const { id, ...itemData } = formData;
    
    try {
        setIsSaving(true);
        if (id) {
            // Update
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'transactions', id), itemData);
        } else {
            // Add
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'transactions'), {
                ...itemData,
                createdAt: new Date().toISOString()
            });
        }
        setIsTransModalOpen(false);
    } catch (e) {
        console.error(e);
        alert("حدث خطأ أثناء الحفظ");
    } finally {
        setIsSaving(false);
    }
  };

  const handleGlobalAnalysis = async () => {
    setModalTitle("تحليل تنفيذي شامل");
    setModalContent("");
    setModalOpen(true);
    setIsAiLoading(true);

    const summaryData = {
      stats: { total, completed, pending, completionRate },
      pendingItems: transactions.filter(i => i.type !== 'complete').map(i => `${i.platform}: ${i.status}`)
    };

    const prompt = `
      أنت مساعد إداري ذكي. قم بتحليل بيانات تسجيل المنصات التالية واكتب ملخصاً تنفيذياً باللغة العربية للمدير العام.
      البيانات: ${JSON.stringify(summaryData)}
      المطلوب في الملخص: 1. نظرة عامة على مستوى الإنجاز. 2. أهم المعوقات. 3. توصيات.
    `;

    const result = await generateContent(prompt);
    setModalContent(result);
    setIsAiLoading(false);
  };

  const handleDraftEmail = async (item) => {
    setModalTitle(`مسودة بريد متابعة - ${item.platform}`);
    setModalContent("");
    setModalOpen(true);
    setIsAiLoading(true);

    const prompt = `
      قم بصياغة بريد إلكتروني رسمي لمتابعة حالة التسجيل في منصة "${item.platform}".
      الحالة الحالية: "${item.status}".
      الموضوع: استفسار بخصوص حالة تسجيل المورد.
    `;

    const result = await generateContent(prompt);
    setModalContent(result);
    setIsAiLoading(false);
  };

  if (isLoadingData) {
      return <div className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl"><div className="text-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto mb-4"/><p className="text-slate-600">جاري تحميل قاعدة البيانات...</p></div></div>
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans" dir="rtl">
      <div className="max-w-5xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                لوحة متابعة تسجيل المنصات
                <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full flex items-center gap-1 border border-emerald-200">
                    <Database className="w-3 h-3" /> متصل بقاعدة البيانات
                </span>
            </h1>
            <p className="text-slate-500">نظرة عامة على حالة تسجيل الموردين للمكتب والشركة</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={handleOpenAdd} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-800 text-white px-5 py-3 rounded-xl shadow-lg hover:bg-slate-700 transition-all">
                <Plus className="w-5 h-5" /><span className="font-bold">إضافة معاملة</span>
            </button>
            <button onClick={handleGlobalAnalysis} className="flex-1 md:flex-none group flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-3 rounded-xl shadow-lg hover:shadow-indigo-200 transition-all hover:-translate-y-0.5">
                <Sparkles className="w-5 h-5 text-yellow-300 group-hover:animate-spin-slow" /><span className="font-bold">تحليل ذكي</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard label="إجمالي المنصات" value={total} icon={Building} colorClass="bg-slate-600" />
          <StatCard label="تم التسجيل" value={completed} icon={CheckCircle} colorClass="bg-emerald-600" />
          <StatCard label="قيد الإجراء / المراجعة" value={pending} icon={Clock} colorClass="bg-amber-600" />
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-8">
            <div className="flex justify-between items-end mb-2">
                <span className="font-medium text-slate-700">نسبة الإنجاز الكلية</span>
                <span className="text-2xl font-bold text-emerald-600">{completionRate}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${completionRate}%` }}></div>
            </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${filter === 'all' ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}><Filter className="w-4 h-4" />الكل</button>
          <button onClick={() => setFilter('complete')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${filter === 'complete' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-emerald-50 border border-slate-200'}`}><CheckCircle className="w-4 h-4" />مكتمل</button>
          <button onClick={() => setFilter('pending')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${filter === 'pending' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-amber-50 border border-slate-200'}`}><Clock className="w-4 h-4" />قيد الانتظار / العمل</button>
        </div>

        <div className="space-y-2">
            {allCategories.map(catKey => (
                <SectionCard 
                    key={catKey}
                    title={getCategoryLabel(catKey)} 
                    categoryKey={catKey}
                    icon={Layers}
                    data={groupedData[catKey]}
                    filter={filter}
                    onDraftEmail={handleDraftEmail}
                    onEdit={handleOpenEdit}
                />
            ))}
        </div>
      </div>

      <TransactionModal 
        isOpen={isTransModalOpen}
        onClose={() => setIsTransModalOpen(false)}
        onSave={handleSaveTransaction}
        onDelete={handleDeleteTransaction}
        initialData={editingItem}
        categories={allCategories}
        isSaving={isSaving}
      />
      <AIModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={modalTitle} content={modalContent} isLoading={isAiLoading} />
    </div>
  );
}
