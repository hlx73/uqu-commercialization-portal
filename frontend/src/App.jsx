import React, { useState, useEffect } from 'react';

const API_BASE = 'https://uqu-commercialization-portal.onrender.com/api';
function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [language, setLanguage] = useState('en');
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    sectors: {},
    trls: {},
    tracks: {},
    recent_pending: []
  });
  
  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    sector: '',
    type: '',
    trl: '',
    status: '',
    track: ''
  });

  // Selected project for Drawer / Brief view
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  // New project upload form
  const [uploadText, setUploadText] = useState('');
  const [uploadAuthorEn, setUploadAuthorEn] = useState('');
  const [uploadAuthorAr, setUploadAuthorAr] = useState('');
  const [uploadType, setUploadType] = useState('Paper');
  const [uploadDept, setUploadDept] = useState('Computer Science');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Admin Editing / Reviewing
  const [editingProject, setEditingProject] = useState(null);
  
  // API Key Settings
  const [geminiKeyModalOpen, setGeminiKeyModalOpen] = useState(false);
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('GEMINI_API_KEY') || '');
  
  // Status states
  const [backendError, setBackendError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch initial data
  useEffect(() => {
    fetchStats();
    fetchProjects();
  }, [filters]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setBackendError(false);
      } else {
        setBackendError(true);
      }
    } catch (e) {
      setBackendError(true);
    }
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.append('q', searchQuery);
      if (filters.sector) queryParams.append('sector', filters.sector);
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.trl) queryParams.append('trl', filters.trl);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.track) queryParams.append('track', filters.track);

      const res = await fetch(`${API_BASE}/projects?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        setBackendError(false);
      }
    } catch (e) {
      setBackendError(true);
    } finally {
      setLoading(false);
    }
  };

  // Trigger search on query change
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchProjects();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Fetch detailed project
  const loadProjectDetails = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/projects/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedProject(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      loadProjectDetails(selectedProjectId);
    } else {
      setSelectedProject(null);
    }
  }, [selectedProjectId]);

  // Save API Key
  const handleSaveApiKey = () => {
    localStorage.setItem('GEMINI_API_KEY', geminiKey);
    setGeminiKeyModalOpen(false);
    showNotification(language === 'en' ? 'API Key saved successfully' : 'تم حفظ مفتاح API بنجاح');
    fetchStats();
  };

  // Show dynamic notification helper
  const showNotification = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // Submit and analyze paper
  const handleAnalyzeText = async (e) => {
    e.preventDefault();
    if (!uploadText.trim()) return;
    setAnalyzing(true);
    setAnalysisResult(null);
    try {
      const headers = { 'Content-Type': 'application/json' };
      const savedKey = localStorage.getItem('GEMINI_API_KEY');
      if (savedKey) {
        headers['X-Gemini-Key'] = savedKey;
      }

      const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text: uploadText,
          author_en: uploadAuthorEn || 'UQU Researcher',
          author_ar: uploadAuthorAr || 'باحث جامعة أم القرى',
          type: uploadType,
          department: uploadDept
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAnalysisResult(data);
        showNotification(language === 'en' ? 'Analysis complete! Awaiting Analyst Review.' : 'اكتمل التحليل المبدئي! في انتظار مراجعة المحلل.');
        fetchStats();
        fetchProjects();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  // Approve project (with edits)
  const handleApproveProject = async (id, updatedData) => {
    try {
      const res = await fetch(`${API_BASE}/projects/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (res.ok) {
        showNotification(language === 'en' ? 'Project approved and brief generated!' : 'تم اعتماد المشروع وتوليد الملخص الاستثماري بنجاح!');
        setEditingProject(null);
        fetchStats();
        fetchProjects();
        // Automatically view the brief
        setSelectedProjectId(id);
        setActiveTab('brief');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm(language === 'en' ? 'Are you sure you want to delete this record?' : 'هل أنت متأكد من رغبتك في حذف هذا المشروع؟')) return;
    try {
      const res = await fetch(`${API_BASE}/projects/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showNotification(language === 'en' ? 'Project deleted' : 'تم حذف المشروع');
        setSelectedProjectId(null);
        fetchStats();
        fetchProjects();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // UI Translation Dictionary
  const t = {
    en: {
      appName: "Wadi Makkah Portal",
      appSubtitle: "UQU Commercialization Hub",
      dashboard: "Overview Dashboard",
      explorer: "Semantic Search",
      analyze: "Submit & Analyze",
      review: "Analyst Review Hub",
      brief: "Commercialization Brief",
      totalIndexed: "Total Academic Records",
      approvedRecords: "Commercial Ready (Approved)",
      pendingReview: "Awaiting Review",
      recentSubmissions: "Recent Submissions",
      searchPlaceholder: "Search research by title, abstract keywords in English or Arabic...",
      sectorFilter: "Select Strategic Sector",
      trlFilter: "Select TRL Level",
      statusFilter: "Select Status",
      typeFilter: "Document Type",
      noResults: "No research records found matching criteria.",
      trl: "Technology Readiness Level",
      track: "Recommended Incubator Track",
      author: "Researcher / Team",
      department: "UQU Department",
      date: "Submission Date",
      status: "Status",
      commercialApps: "Possible Commercial Applications",
      targetCustomers: "Potential Customers & Partners",
      matchedStartups: "Similar Startups & Products",
      roadmap: "Suggested Commercialization Pathway",
      analystNotes: "Wadi Makkah Analyst Review Notes",
      submitButton: "Analyze Paper",
      pasteAbstract: "Paste Academic Research Abstract / Patent Description / Project Details",
      metaAuthorsEn: "Authors (English)",
      metaAuthorsAr: "Authors (Arabic)",
      metaDept: "Faculty / Department",
      metaType: "Submission Type",
      paperType: "Research Paper",
      patentType: "Patent Draft",
      projectType: "Graduation Project",
      reviewAction: "Review Analysis",
      approveAction: "Approve & Issue Brief",
      saving: "Processing...",
      apiKeyConfig: "Gemini AI Config",
      apiKeyStatus: "Gemini LLM Status",
      apiKeyStatusConnected: "Gemini Connected",
      apiKeyStatusFallback: "Using Local Fallback NLP",
      saveKey: "Save Settings",
      enterKey: "Enter Gemini API Key (saved locally in your browser):",
      printBrief: "Print Official Brief",
      viewBrief: "View Brief",
      close: "Close",
      editTitleEn: "Title (English)",
      editTitleAr: "Title (Arabic)",
      editAbstractEn: "Abstract Summary (English)",
      editAbstractAr: "Abstract Summary (Arabic)"
    },
    ar: {
      appName: "بوابة وادي مكة",
      appSubtitle: "مركز تسويق بحوث جامعة أم القرى",
      dashboard: "لوحة التحكم العامة",
      explorer: "البحث الدلالي والاستكشاف",
      analyze: "تقديم وتحليل البحوث",
      review: "مركز مراجعة المحللين",
      brief: "ملخص التسويق الاستثماري",
      totalIndexed: "إجمالي السجلات الأكاديمية",
      approvedRecords: "جاهز للتسويق (معتمد)",
      pendingReview: "في انتظار المراجعة",
      recentSubmissions: "أحدث الطلبات المقدمة",
      searchPlaceholder: "ابحث في البحوث بالعنوان، الملخص، الكلمات الدلالية بالإنجليزية أو العربية...",
      sectorFilter: "اختر القطاع الاستراتيجي",
      trlFilter: "اختر مستوى جاهزية التقنية (TRL)",
      statusFilter: "اختر حالة المشروع",
      typeFilter: "نوع المستند",
      noResults: "لم يتم العثور على سجلات أكاديمية تطابق معايير البحث.",
      trl: "مستوى جاهزية التقنية (TRL)",
      track: "مسار الاحتضان والتمويل المقترح",
      author: "الباحث / فريق العمل",
      department: "القسم / الكلية بجامعة أم القرى",
      date: "تاريخ التقديم",
      status: "حالة الاعتماد",
      commercialApps: "التطبيقات التجارية الممكنة للمنتج",
      targetCustomers: "العملاء والجهات الشريكة المستهدفة",
      matchedStartups: "الشركات الناشئة والحلول المماثلة",
      roadmap: "مسار الترويج والتسويق المقترح",
      analystNotes: "ملاحظات وتوصيات محلل وادي مكة",
      submitButton: "تحليل المستند",
      pasteAbstract: "قم بلصق ملخص البحث الأكاديمي أو وصف براءة الاختراع أو تفاصيل مشروع التخرج هنا",
      metaAuthorsEn: "أسماء المؤلفين (بالإنجليزية)",
      metaAuthorsAr: "أسماء المؤلفين (بالعربية)",
      metaDept: "الكلية / القسم الأكاديمي",
      metaType: "تصنيف التقديم",
      paperType: "ورقة بحثية علمية",
      patentType: "براءة اختراع مسجلة/مقدمة",
      projectType: "مشروع تخرج طلابي",
      reviewAction: "مراجعة واعتماد التحليل",
      approveAction: "اعتماد وإصدار الملخص",
      saving: "جاري المعالجة...",
      apiKeyConfig: "إعدادات ذكاء Gemini",
      apiKeyStatus: "حالة اتصال Gemini LLM",
      apiKeyStatusConnected: "متصل بـ Gemini AI",
      apiKeyStatusFallback: "يعمل بالمعالجة المحلية البديلة",
      saveKey: "حفظ الإعدادات",
      enterKey: "أدخل مفتاح واجهة برمجة تطبيقات Gemini (يتم حفظه محلياً في متصفحك):",
      printBrief: "طباعة الملخص الرسمي",
      viewBrief: "عرض الملخص",
      close: "إغلاق",
      editTitleEn: "العنوان (بالإنجليزية)",
      editTitleAr: "العنوان (بالعربية)",
      editAbstractEn: "ملخص الدراسة (بالإنجليزية)",
      editAbstractAr: "ملخص الدراسة (بالعربية)"
    }
  };

  const curr = t[language];

  // Helper rendering for TRL blocks
  const renderTrlMatrix = (currentTrl) => {
    return (
      <div className="trl-indicator-grid">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => {
          let nodeClass = 'trl-node';
          if (lvl === currentTrl) {
            if (lvl <= 3) nodeClass += ' active-low';
            else if (lvl <= 6) nodeClass += ' active-mid';
            else nodeClass += ' active-high';
          }
          return (
            <div key={lvl} className={nodeClass} title={`TRL ${lvl}`}>
              T{lvl}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`app-container ${language === 'ar' ? 'rtl-layout' : ''}`}>
      
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-container">UQU</div>
          <div className="logo-text">
            <span className="logo-title">{curr.appName}</span>
            <span className="logo-subtitle">{curr.appSubtitle}</span>
          </div>
        </div>

        <nav className="nav-menu">
          <li 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setActiveTab('dashboard'); setSelectedProjectId(null); }}
          >
            <span className="nav-icon">📊</span>
            <span>{curr.dashboard}</span>
          </li>
          <li 
            className={`nav-item ${activeTab === 'explorer' ? 'active' : ''}`}
            onClick={() => { setActiveTab('explorer'); setSelectedProjectId(null); }}
          >
            <span className="nav-icon">🔍</span>
            <span>{curr.explorer}</span>
          </li>
          <li 
            className={`nav-item ${activeTab === 'analyze' ? 'active' : ''}`}
            onClick={() => { setActiveTab('analyze'); setSelectedProjectId(null); }}
          >
            <span className="nav-icon">📤</span>
            <span>{curr.analyze}</span>
          </li>
          <li 
            className={`nav-item ${activeTab === 'review' ? 'active' : ''}`}
            onClick={() => { setActiveTab('review'); setSelectedProjectId(null); }}
          >
            <span className="nav-icon">🛡️</span>
            <span>{curr.review}</span>
            {stats.pending > 0 && (
              <span className="badge badge-pending" style={{ marginLeft: 'auto', marginRight: language === 'ar' ? 'auto' : '0' }}>
                {stats.pending}
              </span>
            )}
          </li>
          {selectedProjectId && selectedProject && selectedProject.status === 'Approved' && (
            <li 
              className={`nav-item ${activeTab === 'brief' ? 'active' : ''}`}
              onClick={() => setActiveTab('brief')}
            >
              <span className="nav-icon">📄</span>
              <span>{curr.brief}</span>
            </li>
          )}
        </nav>

        <div className="sidebar-footer">
          <div 
            className="nav-item" 
            onClick={() => setGeminiKeyModalOpen(true)}
            style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
          >
            <span className="nav-icon">⚙️</span>
            <span style={{ fontSize: '12px' }}>{curr.apiKeyConfig}</span>
            <span 
              className="status-dot" 
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: localStorage.getItem('GEMINI_API_KEY') ? '#10b981' : '#f59e0b',
                marginLeft: 'auto',
                boxShadow: localStorage.getItem('GEMINI_API_KEY') ? '0 0 8px #10b981' : '0 0 8px #f59e0b'
              }}
            />
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="main-content">
        
        {/* Top Header */}
        <header className="top-header">
          <h2 className="page-title">
            {activeTab === 'dashboard' && curr.dashboard}
            {activeTab === 'explorer' && curr.explorer}
            {activeTab === 'analyze' && curr.analyze}
            {activeTab === 'review' && curr.review}
            {activeTab === 'brief' && curr.brief}
          </h2>

          <div className="header-actions">
            {/* Backend Connection Warning */}
            {backendError && (
              <span style={{ color: '#ef4444', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                ⚠️ Server Offline
              </span>
            )}

            {/* Language Switch */}
            <button 
              className="lang-toggle" 
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            >
              {language === 'en' ? 'العربية' : 'English'}
            </button>
          </div>
        </header>

        {/* Dynamic Status Notifications */}
        {successMessage && (
          <div style={{
            position: 'absolute',
            top: '80px',
            right: language === 'en' ? '32px' : 'auto',
            left: language === 'ar' ? '32px' : 'auto',
            padding: '12px 24px',
            backgroundColor: 'rgba(16, 185, 129, 0.95)',
            color: 'white',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            fontSize: '14px',
            fontWeight: '600',
            animation: 'slideUp 0.3s ease'
          }}>
            ✓ {successMessage}
          </div>
        )}

        {/* Scrollable Work View */}
        <div className="page-container">
          
          {/* ==================== DASHBOARD VIEW ==================== */}
          {activeTab === 'dashboard' && (
            <div>
              <div className="stat-grid">
                <div className="card stat-card card-gold">
                  <span className="stat-label">{curr.totalIndexed}</span>
                  <span className="stat-value">{stats.total}</span>
                  <span className="stat-change up">↑ UQU Central Archive</span>
                </div>
                <div className="card stat-card" style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}>
                  <span className="stat-label">{curr.approvedRecords}</span>
                  <span className="stat-value" style={{ color: '#10b981' }}>{stats.approved}</span>
                  <span className="stat-change up" style={{ color: '#10b981' }}>
                    {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}% Transfer Rate
                  </span>
                </div>
                <div className="card stat-card" style={{ borderColor: 'rgba(245, 158, 11, 0.4)' }}>
                  <span className="stat-label">{curr.pendingReview}</span>
                  <span className="stat-value" style={{ color: '#f59e0b' }}>{stats.pending}</span>
                  <span className="stat-change down" style={{ color: '#f59e0b' }}>Pending Decision</span>
                </div>
              </div>

              <div className="grid-2col-equal" style={{ marginBottom: '32px' }}>
                {/* Sector Alignment chart */}
                <div className="card">
                  <h3 style={{ marginBottom: '20px', fontSize: '16px' }}>
                    {language === 'en' ? 'Alignment by Industry Sector' : 'التوافق مع القطاعات الاستراتيجية'}
                  </h3>
                  <div className="chart-widget">
                    {Object.entries(stats.sectors || {}).map(([sec, count]) => {
                      const max = Math.max(...Object.values(stats.sectors));
                      const percentage = max > 0 ? (count / max) * 100 : 0;
                      return (
                        <div key={sec} className="bar-row">
                          <div className="bar-label-row">
                            <span>{sec}</span>
                            <span style={{ fontWeight: '700' }}>{count}</span>
                          </div>
                          <div className="bar-bg">
                            <div className="bar-fill" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* TRL split chart */}
                <div className="card">
                  <h3 style={{ marginBottom: '20px', fontSize: '16px' }}>
                    {language === 'en' ? 'Technology Readiness Distribution (TRL)' : 'توزيع مستويات جاهزية التقنية (TRL)'}
                  </h3>
                  <div className="chart-widget">
                    {Object.entries(stats.trls || {}).map(([range, count]) => {
                      const max = Math.max(...Object.values(stats.trls));
                      const percentage = max > 0 ? (count / max) * 100 : 0;
                      
                      let label = '';
                      if (range === '1-2') label = language === 'en' ? 'TRL 1-2: Basic / Idea' : 'مستويات 1-2: أبحاث أساسية ومفاهيم';
                      if (range === '3-4') label = language === 'en' ? 'TRL 3-4: Proof of Concept / Lab' : 'مستويات 3-4: إثبات المفهوم والتحقق المعملي';
                      if (range === '5-6') label = language === 'en' ? 'TRL 5-6: Working Prototype' : 'مستويات 5-6: نموذج أولي قيد الاختبار';
                      if (range === '7-9') label = language === 'en' ? 'TRL 7-9: Market Pilot / Deployment' : 'مستويات 7-9: منتج ريادي وتطبيق ميداني جاهز';

                      return (
                        <div key={range} className="bar-row">
                          <div className="bar-label-row">
                            <span>{label}</span>
                            <span style={{ fontWeight: '700' }}>{count}</span>
                          </div>
                          <div className="bar-bg">
                            <div className="bar-fill" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Pending reviews list */}
              <div className="card">
                <h3 style={{ marginBottom: '20px', fontSize: '16px' }}>{curr.recentSubmissions}</h3>
                <div className="list-container">
                  {stats.recent_pending && stats.recent_pending.length > 0 ? (
                    stats.recent_pending.map((p) => (
                      <div key={p.id} className="list-item">
                        <div>
                          <span className="badge badge-pending" style={{ marginBottom: '6px' }}>{p.id}</span>
                          <h4 style={{ fontSize: '15px', fontWeight: '600' }}>
                            {language === 'en' ? p.title_en : p.title_ar}
                          </h4>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {language === 'en' ? p.author_en : p.author_ar} • {p.submission_date}
                          </span>
                        </div>
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => {
                            setEditingProject(p);
                            setActiveTab('review');
                          }}
                        >
                          🛡️ {curr.reviewAction}
                        </button>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '24px' }}>
                      {language === 'en' ? 'No pending documents awaiting review.' : 'لا توجد طلبات معلقة في انتظار المراجعة حالياً.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}


          {/* ==================== EXPLORER / SEARCH VIEW ==================== */}
          {activeTab === 'explorer' && (
            <div>
              {/* Search Control inputs */}
              <div className="search-wrapper">
                <div className="search-input-container">
                  <span className="search-icon-inside">🔍</span>
                  <input
                    type="text"
                    className="search-input"
                    placeholder={curr.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Filter controls */}
              <div className="filters-bar">
                <select 
                  className="filter-select"
                  value={filters.sector}
                  onChange={(e) => setFilters({ ...filters, sector: e.target.value })}
                >
                  <option value="">{curr.sectorFilter}</option>
                  <option value="Hajj & Umrah Tech">Hajj & Umrah Tech / تقنية الحج والعمرة</option>
                  <option value="HealthTech & Biotech">HealthTech / التقنية الصحية</option>
                  <option value="Clean Energy & Environment">Clean Energy / الطاقة النظيفة</option>
                  <option value="Smart Infrastructure & IoT">Smart Infrastructure / البنية التحتية</option>
                  <option value="Islamic Finance & Digital Economy">Fintech / الاقتصاد الرقمي</option>
                </select>

                <select 
                  className="filter-select"
                  value={filters.trl}
                  onChange={(e) => setFilters({ ...filters, trl: e.target.value })}
                >
                  <option value="">{curr.trlFilter}</option>
                  {[1,2,3,4,5,6,7,8,9].map(i => (
                    <option key={i} value={i}>TRL {i}</option>
                  ))}
                </select>

                <select 
                  className="filter-select"
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                >
                  <option value="">{curr.typeFilter}</option>
                  <option value="Paper">{language === 'en' ? 'Research Paper' : 'ورقة بحثية'}</option>
                  <option value="Patent">{language === 'en' ? 'Patent' : 'براءة اختراع'}</option>
                  <option value="Graduation Project">{language === 'en' ? 'Graduation Project' : 'مشروع تخرج'}</option>
                </select>

                <select 
                  className="filter-select"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="">{curr.statusFilter}</option>
                  <option value="Approved">{language === 'en' ? 'Approved' : 'معتمد'}</option>
                  <option value="Pending">{language === 'en' ? 'Pending Review' : 'تحت المراجعة'}</option>
                </select>
              </div>

              {/* Main List results & Drawer layout */}
              <div className="grid-2col">
                
                {/* Result cards list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {loading ? (
                    <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>
                      {language === 'en' ? 'Searching UQU Central Index...' : 'جاري البحث في فهرس جامعة أم القرى الأكاديمي...'}
                    </div>
                  ) : projects.length > 0 ? (
                    projects.map((p) => (
                      <div 
                        key={p.id} 
                        className={`card ${selectedProjectId === p.id ? 'card-gold' : ''}`}
                        style={{ cursor: 'pointer', padding: '20px' }}
                        onClick={() => setSelectedProjectId(p.id)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <span className={`badge ${p.status === 'Approved' ? 'badge-approved' : 'badge-pending'}`}>
                            {p.id} • {p.status === 'Approved' ? (language === 'en' ? 'Approved' : 'معتمد') : (language === 'en' ? 'Pending' : 'قيد المراجعة')}
                          </span>
                          <span className="badge badge-trl">TRL {p.trl}</span>
                        </div>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', lineHeight: '1.4' }}>
                          {language === 'en' ? p.title_en : p.title_ar}
                        </h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {language === 'en' ? p.abstract_en : p.abstract_ar}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                          <span>👥 {language === 'en' ? p.author_en : p.author_ar}</span>
                          <span>🏢 {p.sector}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>
                      {curr.noResults}
                    </div>
                  )}
                </div>

                {/* Detail View Drawer */}
                <div style={{ position: 'sticky', top: '20px' }}>
                  {selectedProjectId && selectedProject ? (
                    <div className="card card-gold">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <button className="btn btn-secondary" onClick={() => setSelectedProjectId(null)}>{curr.close}</button>
                        {selectedProject.status === 'Approved' && (
                          <button 
                            className="btn btn-gold"
                            onClick={() => setActiveTab('brief')}
                          >
                            📄 {curr.viewBrief}
                          </button>
                        )}
                      </div>

                      <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-primary)' }}>
                        {language === 'en' ? selectedProject.title_en : selectedProject.title_ar}
                      </h2>

                      {/* TRL matrix UI */}
                      <div style={{ margin: '16px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                          <span>{curr.trl}: <strong>TRL {selectedProject.trl}</strong></span>
                        </div>
                        {renderTrlMatrix(selectedProject.trl)}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                        <div><strong>{curr.author}:</strong> {language === 'en' ? selectedProject.author_en : selectedProject.author_ar}</div>
                        <div><strong>{curr.department}:</strong> {selectedProject.department}</div>
                        <div><strong>{curr.track}:</strong> {selectedProject.track}</div>
                      </div>

                      {/* Description tabs */}
                      <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '16px', paddingTop: '16px' }}>
                        <h4 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--color-secondary)' }}>
                          {language === 'en' ? 'Study Summary' : 'ملخص البحث'}
                        </h4>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', maxHeight: '180px', overflowY: 'auto' }}>
                          {language === 'en' ? selectedProject.abstract_en : selectedProject.abstract_ar}
                        </p>
                      </div>

                      {/* Target customer tags */}
                      <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '16px', paddingTop: '16px' }}>
                        <h4 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--color-secondary)' }}>
                          {curr.targetCustomers}
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {(language === 'en' ? selectedProject.customers_en : selectedProject.customers_ar || []).map((c, i) => (
                            <span key={i} className="badge badge-trl" style={{ textTransform: 'none' }}>{c}</span>
                          ))}
                        </div>
                      </div>

                      {/* Similar startups */}
                      {selectedProject.startups && selectedProject.startups.length > 0 && (
                        <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '16px', paddingTop: '16px' }}>
                          <h4 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--color-secondary)' }}>
                            {curr.matchedStartups}
                          </h4>
                          <ul style={{ paddingLeft: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                            {selectedProject.startups.map((s, i) => (
                              <li key={i} style={{ marginBottom: '4px' }}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Roadmap */}
                      <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '16px', paddingTop: '16px' }}>
                        <h4 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--color-secondary)' }}>
                          {curr.roadmap}
                        </h4>
                        <ol style={{ paddingLeft: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {(language === 'en' ? selectedProject.roadmap_en : selectedProject.roadmap_ar || []).map((step, i) => (
                            <li key={i} style={{ marginBottom: '6px' }}>{step}</li>
                          ))}
                        </ol>
                      </div>

                      {/* Delete project button */}
                      <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '16px', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }}
                          onClick={() => handleDeleteProject(selectedProject.id)}
                        >
                          🗑️ {language === 'en' ? 'Delete Record' : 'حذف السجل'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="card" style={{ borderStyle: 'dashed', textAlign: 'center', padding: '60px var(--radius-lg)', color: 'var(--text-muted)' }}>
                      <span>🗂️</span>
                      <p style={{ marginTop: '12px', fontSize: '14px' }}>
                        {language === 'en' ? 'Select any research record from the list to view its complete commercialization analysis.' : 'اختر أي بحث من القائمة لعرض تقييم الجدوى الاستثمارية والتحليل الكامل له.'}
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}


          {/* ==================== SUBMIT & ANALYZE VIEW ==================== */}
          {activeTab === 'analyze' && (
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div className="card">
                <h3 style={{ marginBottom: '20px', fontSize: '18px' }}>
                  {language === 'en' ? 'Upload Research for Commercial Analysis' : 'تقديم دراسة بحثية للتحليل الاستثماري'}
                </h3>
                
                <form onSubmit={handleAnalyzeText}>
                  <div className="form-group">
                    <label className="form-label">{curr.pasteAbstract}</label>
                    <textarea 
                      className="form-textarea"
                      placeholder={language === 'en' ? 'E.g., A patent description for high efficiency solar desalting cells or computer vision crowd estimation methods...' : 'مثال: نظام يعتمد على الذكاء الاصطناعي لفحص السكري أو خوارزميات إدارة الحشود...'}
                      value={uploadText}
                      onChange={(e) => setUploadText(e.target.value)}
                      required
                      style={{ minHeight: '180px' }}
                    />
                  </div>

                  <div className="grid-2col-equal" style={{ marginBottom: '20px' }}>
                    <div className="form-group">
                      <label className="form-label">{curr.metaAuthorsEn}</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Dr. Ahmed Al-Ghamdi"
                        value={uploadAuthorEn}
                        onChange={(e) => setUploadAuthorEn(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{curr.metaAuthorsAr}</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="د. أحمد الغامدي"
                        value={uploadAuthorAr}
                        onChange={(e) => setUploadAuthorAr(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid-2col-equal" style={{ marginBottom: '24px' }}>
                    <div className="form-group">
                      <label className="form-label">{curr.metaDept}</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Computer Science"
                        value={uploadDept}
                        onChange={(e) => setUploadDept(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{curr.metaType}</label>
                      <select 
                        className="form-input"
                        value={uploadType}
                        onChange={(e) => setUploadType(e.target.value)}
                      >
                        <option value="Paper">{curr.paperType}</option>
                        <option value="Patent">{curr.patentType}</option>
                        <option value="Graduation Project">{curr.projectType}</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-gold" 
                    disabled={analyzing}
                    style={{ width: '100%', height: '48px', fontSize: '15px' }}
                  >
                    {analyzing ? curr.saving : `🚀 ${curr.submitButton}`}
                  </button>
                </form>
              </div>

              {/* Real-time preview of the analyzed model */}
              {analysisResult && (
                <div className="card card-gold" style={{ marginTop: '32px' }}>
                  <h3 style={{ marginBottom: '16px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ✓ {language === 'en' ? 'Analysis Complete & Registered' : 'اكتمل التحليل الفوري للمشروع'}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <strong>{language === 'en' ? 'Title' : 'عنوان المشروع'}:</strong>
                      <p style={{ color: 'var(--text-primary)', marginTop: '4px' }}>{language === 'en' ? analysisResult.title_en : analysisResult.title_ar}</p>
                    </div>
                    <div>
                      <strong>{curr.trl}:</strong>
                      <div style={{ marginTop: '8px' }}>{renderTrlMatrix(analysisResult.trl)}</div>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Recommended Track: {analysisResult.track}</span>
                    </div>
                    <div>
                      <strong>{curr.commercialApps}:</strong>
                      <ul style={{ paddingLeft: '16px', fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {(language === 'en' ? analysisResult.commercial_apps_en : analysisResult.commercial_apps_ar || []).map((app, i) => (
                          <li key={i} style={{ marginBottom: '4px' }}>{app}</li>
                        ))}
                      </ul>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button 
                        className="btn btn-primary"
                        onClick={() => {
                          setEditingProject(analysisResult);
                          setActiveTab('review');
                        }}
                      >
                        🛡️ {language === 'en' ? 'Go to Review Hub' : 'الانتقال لمركز الاعتماد والمراجعة'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}


          {/* ==================== ANALYST REVIEW / APPROVAL HUB ==================== */}
          {activeTab === 'review' && (
            <div>
              {editingProject ? (
                // Interactive edit/review screen
                <div className="card card-gold" style={{ maxWidth: '900px', margin: '0 auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '18px' }}>
                      🛡️ {language === 'en' ? `Analyst Verification: ${editingProject.id}` : `اعتماد المحلل وتقييم الجدوى: ${editingProject.id}`}
                    </h3>
                    <button className="btn btn-secondary" onClick={() => setEditingProject(null)}>{curr.close}</button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Titles editing */}
                    <div className="grid-2col-equal">
                      <div className="form-group">
                        <label className="form-label">{curr.editTitleEn}</label>
                        <input
                          type="text"
                          className="form-input"
                          value={editingProject.title_en}
                          onChange={(e) => setEditingProject({ ...editingProject, title_en: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">{curr.editTitleAr}</label>
                        <input
                          type="text"
                          className="form-input"
                          value={editingProject.title_ar}
                          onChange={(e) => setEditingProject({ ...editingProject, title_ar: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Abstracts editing */}
                    <div className="grid-2col-equal">
                      <div className="form-group">
                        <label className="form-label">{curr.editAbstractEn}</label>
                        <textarea
                          className="form-textarea"
                          value={editingProject.abstract_en}
                          onChange={(e) => setEditingProject({ ...editingProject, abstract_en: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">{curr.editAbstractAr}</label>
                        <textarea
                          className="form-textarea"
                          value={editingProject.abstract_ar}
                          onChange={(e) => setEditingProject({ ...editingProject, abstract_ar: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* TRL evaluation and track */}
                    <div className="grid-2col" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                      <div className="form-group">
                        <label className="form-label">{curr.trl} (TRL 1 - TRL 9)</label>
                        <input
                          type="range"
                          min="1"
                          max="9"
                          step="1"
                          style={{ width: '100%', accentColor: 'var(--color-primary)' }}
                          value={editingProject.trl}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            // Auto map tracks based on trl
                            let trackName = "Nomow Incubator (حاضنة نمو)";
                            if (val <= 2) trackName = "Masar Training Program (برنامج مسار التأهيلي)";
                            else if (val <= 4) trackName = "Nomow Incubator (حاضنة نمو)";
                            else if (val <= 6) trackName = "Wadi Makkah Accelerator (مسرعة وادي مكة)";
                            else trackName = "Wadi Makkah Ventures Fund (صندوق الاستثمار)";

                            setEditingProject({
                              ...editingProject,
                              trl: val,
                              track: trackName
                            });
                          }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          <span>1: Basic research</span>
                          <span><strong>Current: TRL {editingProject.trl}</strong></span>
                          <span>9: Commercial launch</span>
                        </div>
                        {renderTrlMatrix(editingProject.trl)}
                      </div>

                      <div className="form-group">
                        <label className="form-label">{curr.track}</label>
                        <input
                          type="text"
                          className="form-input"
                          value={editingProject.track}
                          disabled
                        />
                      </div>
                    </div>

                    {/* Sector selection */}
                    <div className="form-group">
                      <label className="form-label">{curr.sectorFilter}</label>
                      <select
                        className="form-input"
                        value={editingProject.sector}
                        onChange={(e) => setEditingProject({ ...editingProject, sector: e.target.value })}
                      >
                        <option value="Hajj & Umrah Tech">Hajj & Umrah Tech</option>
                        <option value="HealthTech & Biotech">HealthTech & Biotech</option>
                        <option value="Clean Energy & Environment">Clean Energy & Environment</option>
                        <option value="Smart Infrastructure & IoT">Smart Infrastructure & IoT</option>
                        <option value="Islamic Finance & Digital Economy">Islamic Finance & Digital Economy</option>
                      </select>
                    </div>

                    {/* Editable Commercial Applications */}
                    <div className="grid-2col-equal" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                      <div className="form-group">
                        <label className="form-label">{curr.commercialApps} (English)</label>
                        {editingProject.commercial_apps_en.map((app, idx) => (
                          <input
                            key={idx}
                            type="text"
                            className="form-input"
                            style={{ marginBottom: '6px' }}
                            value={app}
                            onChange={(e) => {
                              const copy = [...editingProject.commercial_apps_en];
                              copy[idx] = e.target.value;
                              setEditingProject({ ...editingProject, commercial_apps_en: copy });
                            }}
                          />
                        ))}
                      </div>
                      <div className="form-group">
                        <label className="form-label">{curr.commercialApps} (Arabic)</label>
                        {editingProject.commercial_apps_ar.map((app, idx) => (
                          <input
                            key={idx}
                            type="text"
                            className="form-input"
                            style={{ marginBottom: '6px' }}
                            value={app}
                            onChange={(e) => {
                              const copy = [...editingProject.commercial_apps_ar];
                              copy[idx] = e.target.value;
                              setEditingProject({ ...editingProject, commercial_apps_ar: copy });
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Target Customers */}
                    <div className="grid-2col-equal">
                      <div className="form-group">
                        <label className="form-label">{curr.targetCustomers} (English)</label>
                        {editingProject.customers_en.map((cust, idx) => (
                          <input
                            key={idx}
                            type="text"
                            className="form-input"
                            style={{ marginBottom: '6px' }}
                            value={cust}
                            onChange={(e) => {
                              const copy = [...editingProject.customers_en];
                              copy[idx] = e.target.value;
                              setEditingProject({ ...editingProject, customers_en: copy });
                            }}
                          />
                        ))}
                      </div>
                      <div className="form-group">
                        <label className="form-label">{curr.targetCustomers} (Arabic)</label>
                        {editingProject.customers_ar.map((cust, idx) => (
                          <input
                            key={idx}
                            type="text"
                            className="form-input"
                            style={{ marginBottom: '6px' }}
                            value={cust}
                            onChange={(e) => {
                              const copy = [...editingProject.customers_ar];
                              copy[idx] = e.target.value;
                              setEditingProject({ ...editingProject, customers_ar: copy });
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Analyst notes */}
                    <div className="form-group" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                      <label className="form-label">{curr.analystNotes}</label>
                      <textarea
                        className="form-textarea"
                        placeholder="Write evaluation summary, legal recommendations or next steps..."
                        value={editingProject.analyst_notes}
                        onChange={(e) => setEditingProject({ ...editingProject, analyst_notes: e.target.value })}
                      />
                    </div>

                    <button
                      className="btn btn-gold"
                      style={{ height: '48px', fontSize: '15px' }}
                      onClick={() => handleApproveProject(editingProject.id, editingProject)}
                    >
                      ✓ {curr.approveAction}
                    </button>
                  </div>
                </div>
              ) : (
                // Pending list view
                <div>
                  <h3 style={{ marginBottom: '16px' }}>
                    {language === 'en' ? 'Proposals Awaiting Human Approval' : 'مقترحات براءات الاختراع والبحوث بانتظار الاعتماد'}
                  </h3>
                  <div className="list-container">
                    {projects.filter(p => p.status === 'Pending').length > 0 ? (
                      projects.filter(p => p.status === 'Pending').map((p) => (
                        <div key={p.id} className="list-item">
                          <div>
                            <span className="badge badge-pending" style={{ marginBottom: '6px' }}>{p.id}</span>
                            <h4 style={{ fontSize: '16px', fontWeight: '600' }}>
                              {language === 'en' ? p.title_en : p.title_ar}
                            </h4>
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              👤 {language === 'en' ? p.author_en : p.author_ar} • 🏢 {p.department} • 📅 {p.submission_date}
                            </p>
                          </div>
                          <button 
                            className="btn btn-primary"
                            onClick={() => setEditingProject(p)}
                          >
                            🛡️ {curr.reviewAction}
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="card" style={{ borderStyle: 'dashed', textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                        {language === 'en' ? 'Excellent! All projects are reviewed and approved.' : 'رائع! تم تدقيق واعتماد كافة البحوث المسجلة في النظام.'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}


          {/* ==================== PRINT-READY 2-PAGE COMMERCIALIZATION BRIEF ==================== */}
          {activeTab === 'brief' && selectedProjectId && selectedProject && (
            <div className="brief-preview-container">
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginBottom: '16px' }} className="settings-panel">
                <button className="btn btn-secondary" onClick={() => setActiveTab('explorer')}>🗂️ {language === 'en' ? 'Back to search' : 'العودة للمستندات'}</button>
                <button className="btn btn-primary" onClick={() => window.print()}>🖨️ {curr.printBrief}</button>
              </div>

              {/* PAGE 1: Technology transfer overview */}
              <div className="brief-page">
                <div className="brief-header">
                  <div className="brief-logo-area">
                    <div className="brief-logo">W</div>
                    <div>
                      <h4 style={{ fontSize: '14px', color: '#006c35', fontWeight: '700' }}>Wadi Makkah</h4>
                      <span style={{ fontSize: '9px', color: '#6b7280' }}>Umm Al-Qura University</span>
                    </div>
                  </div>
                  <div className="brief-org">
                    <div>جامعة أم القرى - شركة وادي مكة للتقنية</div>
                    <div>مكتب نقل التقنية والملكية الفكرية</div>
                    <div style={{ fontSize: '8px', color: '#9ca3af' }}>Ref: {selectedProject.id}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <span className="badge badge-approved" style={{ color: '#006c35', borderColor: '#006c35', textTransform: 'none' }}>
                    {language === 'en' ? 'CONFIDENTIAL - COMMERCIALIZATION BRIEF' : 'سري للغاية - ملخص الجدوى الاستثمارية والترويج'}
                  </span>
                  <span style={{ fontSize: '11px', color: '#6b7280' }}>
                    {selectedProject.approval_date}
                  </span>
                </div>

                <h1 className="brief-title">
                  {language === 'en' ? selectedProject.title_en : selectedProject.title_ar}
                </h1>

                <div className="brief-metadata-grid">
                  <div className="brief-metadata-item">
                    <span className="brief-meta-label">{language === 'en' ? 'Originator / Lead' : 'المبتكر / الباحث الرئيسي'}</span>
                    <span className="brief-meta-val">{language === 'en' ? selectedProject.author_en : selectedProject.author_ar}</span>
                  </div>
                  <div className="brief-metadata-item">
                    <span className="brief-meta-label">{language === 'en' ? 'Faculty / Division' : 'القسم والكلية الأكاديمية'}</span>
                    <span className="brief-meta-val">{selectedProject.department}</span>
                  </div>
                  <div className="brief-metadata-item">
                    <span className="brief-meta-label">{language === 'en' ? 'Document Category' : 'تصنيف المستند'}</span>
                    <span className="brief-meta-val">{selectedProject.type}</span>
                  </div>
                  <div className="brief-metadata-item">
                    <span className="brief-meta-label">{language === 'en' ? 'Strategic Industry' : 'القطاع الاستراتيجي'}</span>
                    <span className="brief-meta-val" style={{ color: '#006c35', fontWeight: '600' }}>{selectedProject.sector}</span>
                  </div>
                </div>

                <h3 className="brief-section-title">{language === 'en' ? '1. Technical Executive Summary' : '١. الخلاصة التنفيذية والوصف الفني'}</h3>
                <p className="brief-body-text">
                  {selectedProject.abstract_en}
                </p>
                <p className="brief-body-text" style={{ direction: 'rtl', fontFamily: 'var(--font-ar)', marginTop: '8px' }}>
                  {selectedProject.abstract_ar}
                </p>

                <h3 className="brief-section-title">{language === 'en' ? '2. Technology Readiness Level' : '٢. مستوى جاهزية التقنية للإنتاج'}</h3>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '16px', backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #f3f4f6' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#006c35', fontFamily: 'var(--font-heading)' }}>TRL {selectedProject.trl}</div>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#6b7280' }}>Maturity Level</span>
                  </div>
                  <div style={{ flexGrow: 1 }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                      {language === 'en' ? 'Target Support Track:' : 'مسار الاستثمار والاحتضان المعتمد:'}
                    </span>
                    <p style={{ fontSize: '13px', color: '#006c35', fontWeight: '700', marginTop: '2px' }}>
                      {selectedProject.track}
                    </p>
                    <div style={{ marginTop: '8px' }}>{renderTrlMatrix(selectedProject.trl)}</div>
                  </div>
                </div>

                <div className="brief-footer">
                  <span>Wadi Makkah Technology Co. © 2026</span>
                  <span>Page 1 of 2</span>
                </div>
              </div>

              {/* PAGE 2: Commercial value propositions, roadmap, and approvals */}
              <div className="brief-page">
                <div className="brief-header">
                  <div className="brief-logo-area">
                    <div className="brief-logo">W</div>
                    <div>
                      <h4 style={{ fontSize: '14px', color: '#006c35', fontWeight: '700' }}>Wadi Makkah</h4>
                    </div>
                  </div>
                  <div className="brief-org">
                    <div>Ref: {selectedProject.id}</div>
                  </div>
                </div>

                <h3 className="brief-section-title">{language === 'en' ? '3. Commercial Applications & Use Cases' : '٣. تطبيقات السوق وحالات الاستخدام التجاري'}</h3>
                <ul className="brief-bullet-list">
                  {(language === 'en' ? selectedProject.commercial_apps_en : selectedProject.commercial_apps_ar || []).map((app, i) => (
                    <li key={i} className="brief-bullet-item">{app}</li>
                  ))}
                </ul>

                <h3 className="brief-section-title">{language === 'en' ? '4. Potential Customers & Government Targets' : '٤. العملاء المستهدفون والشراكات المقترحة'}</h3>
                <ul className="brief-bullet-list">
                  {(language === 'en' ? selectedProject.customers_en : selectedProject.customers_ar || []).map((cust, i) => (
                    <li key={i} className="brief-bullet-item"><strong>{cust}</strong></li>
                  ))}
                </ul>

                <h3 className="brief-section-title">{language === 'en' ? '5. Suggested Commercialization Path' : '٥. خارطة طريق التسويق ونقل التقنية'}</h3>
                <ol style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '16px', marginBottom: '24px', fontSize: '13.5px', color: '#374151' }}>
                  {(language === 'en' ? selectedProject.roadmap_en : selectedProject.roadmap_ar || []).map((step, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>{step}</li>
                  ))}
                </ol>

                <h3 className="brief-section-title">{language === 'en' ? '6. Evaluator Verdict & Licensing Notes' : '٦. توصية محلل الاستثمار والترخيص'}</h3>
                <p className="brief-body-text" style={{ fontStyle: 'italic', backgroundColor: '#fffbeb', border: '1px solid #fef3c7', padding: '16px', borderRadius: '8px', color: '#b45309' }}>
                  "{selectedProject.analyst_notes || 'Approved for technology licensing and incubator boarding in cooperation with Umm Al-Qura University IPO.'}"
                </p>

                {/* Print Signatures block */}
                <div className="brief-signature-area">
                  <div className="brief-sig-box">
                    <div style={{ fontSize: '12px', fontWeight: '600' }}>UQU IPO Director</div>
                    <div className="brief-sig-line">Dr. Yasser Al-Sudairi</div>
                  </div>
                  <div className="brief-sig-box">
                    <div style={{ fontSize: '12px', fontWeight: '600' }}>Wadi Makkah VC Analyst</div>
                    <div className="brief-sig-line">Eng. Abdulrahman Qarni</div>
                  </div>
                </div>

                <div className="brief-footer">
                  <span>Wadi Makkah Technology Co. © 2026</span>
                  <span>Page 2 of 2</span>
                </div>
              </div>

            </div>
          )}

        </div>
      </main>

      {/* ==================== SETTINGS MODAL ==================== */}
      {geminiKeyModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">⚙️ {curr.apiKeyConfig}</h3>
            
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.4' }}>
              {curr.apiKeyStatus}: <strong>{geminiKey ? curr.apiKeyStatusConnected : curr.apiKeyStatusFallback}</strong>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">{curr.enterKey}</label>
              <input
                type="password"
                className="form-input"
                placeholder="AIzaSy..."
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Your API key is stored safely only in your browser storage and sent directly to Gemini endpoints.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setGeminiKeyModalOpen(false)}>{curr.close}</button>
              <button className="btn btn-gold" onClick={handleSaveApiKey}>{curr.saveKey}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
