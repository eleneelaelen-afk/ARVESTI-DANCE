'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Home,
  Newspaper,
  BookOpen,
  User as UserIcon,
  Check,
  X,
  CheckCircle2,
  XCircle,
  Bell,
  CreditCard,
  MapPin,
  Clock,
  Sparkles,
  Lock,
  LogOut,
  AlertCircle,
  AlertOctagon,
  MessageCircle,
} from 'lucide-react';
import { ProfileRow, GroupRow, NewsRow, AppNotificationRow, StudioRuleSection } from '@/types/database';

export default function ArvestiApp() {
  const supabase = createClient();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'news' | 'rules' | 'account'>('dashboard');

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [group, setGroup] = useState<GroupRow | null>(null);
  const [studioAddress, setStudioAddress] = useState('ТРЦ «Арбат», Октябрьская ул., 17, Пятигорск');
  const [news, setNews] = useState<NewsRow[]>([]);
  const [notifications, setNotifications] = useState<AppNotificationRow[]>([]);
  const [rules, setRules] = useState<StudioRuleSection[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<string>('default');
  const [activeToast, setActiveToast] = useState<AppNotificationRow | null>(null);

  const [attendanceStatus, setAttendanceStatus] = useState<'going' | 'not_going' | 'unconfirmed'>('unconfirmed');
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Два варианта входа на первой странице: 'choose' (выбор), 'student' (ученица), 'admin' (руководитель)
  const [authRole, setAuthRole] = useState<'choose' | 'student' | 'admin'>('choose');
  const [availableStudents, setAvailableStudents] = useState<ProfileRow[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [showPwaTip, setShowPwaTip] = useState(true);

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('+7 ');
  const [regGroup, setRegGroup] = useState('grp-1');
  const [regType, setRegType] = useState<'subscription' | 'drop_in'>('subscription');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Канонические правила студии ARVESTI
  const defaultRules: StudioRuleSection[] = [
    {
      id: 1,
      title: 'Оплата',
      items: [
        'Оплата вносится с 27-го по последнее число текущего месяца за следующий месяц.',
        'К 1-му числу у всех уже должно быть всё оплачено, чтобы ваше место было за вами закреплено.',
      ],
      sort_order: 1,
    },
    {
      id: 2,
      title: 'Пропуски',
      items: [
        'Пропущенное занятие не переносится и не компенсируется (урок считается проведённым, так как педагог и зал были готовы).',
      ],
      sort_order: 2,
    },
    {
      id: 3,
      title: 'Предупреждение – это уважение',
      items: [
        'Если вы не придёте, пожалуйста, сообщите за 2 часа до начала занятия.',
        'Я волнуюсь за каждого ученика, и это помогает мне скорректировать план урока.',
      ],
      sort_order: 3,
    },
    {
      id: 4,
      title: 'Если пропускаю я (педагог)',
      items: [
        'По болезни, отъезду или форс-мажору я обязательно проведу отработку или сделаю перерасчёт за этот урок.',
      ],
      sort_order: 4,
    },
    {
      id: 5,
      title: 'Опоздания',
      items: [
        'Пожалуйста, приходите заранее. Без разминки выходить на занятие травмоопасно.',
      ],
      sort_order: 5,
    },
    {
      id: 6,
      title: 'Поведение на уроке',
      items: [
        'На занятии мы работаем – разговоры, телефоны и жевательная резинка исключены.',
        'Мы уважаем друг друга: доброжелательная атмосфера – основа нашего творчества.',
      ],
      sort_order: 6,
    },
    {
      id: 7,
      title: 'Внешний вид',
      items: [
        'Форма одежды: боди, лонгслив / лосины с юбкой либо расклешенные штаны / балетки / собранные волосы.',
      ],
      sort_order: 7,
    },
  ];

  useEffect(() => {
    async function checkAuth() {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPushSupported(true);
        setPushPermission(Notification.permission);
      }

      // Проверяем сохраненный адрес студии
      const savedAddress = typeof window !== 'undefined' ? localStorage.getItem('arvesti_studio_address') : null;
      if (savedAddress) setStudioAddress(savedAddress);

      let st: ProfileRow | null = null;
      const saved = typeof window !== 'undefined' ? localStorage.getItem('arvesti_current_student') : null;
      if (saved) {
        try {
          st = JSON.parse(saved);
        } catch {}
      }

      if (!st) {
        const match = document.cookie.match(/arvesti_student_id=([^;]+)/);
        if (match && match[1]) {
          try {
            const { data } = await supabase.from('profiles').select('*').eq('id', match[1]).maybeSingle();
            if (data) st = data as ProfileRow;
          } catch {}
        }
      }

      if (st && st.id) {
        setProfile(st);
        setIsLoggedIn(true);
        setupGroup(st.group_id);
        fetchStudioData(st.id);
      }

      // Загружаем список учениц для быстрого входа в 1 клик
      try {
        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('*')
          .order('full_name', { ascending: true });
        if (allProfiles && allProfiles.length > 0) {
          setAvailableStudents(allProfiles as ProfileRow[]);
        }
      } catch {}

      setCheckingSession(false);
    }

    checkAuth();
  }, [supabase]);

  const fetchStudioData = async (studentId: string) => {
    try {
      const [profileRes, newsRes, notifsRes, rulesRes, attendRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', studentId).maybeSingle(),
        supabase.from('news').select('*').order('created_at', { ascending: false }),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }),
        supabase.from('studio_rules').select('*').order('sort_order', { ascending: true }),
        supabase.from('attendance').select('*').eq('student_id', studentId).maybeSingle(),
      ]);

      if (profileRes.data) {
        const fresh = profileRes.data as ProfileRow;
        setProfile(fresh);
        localStorage.setItem('arvesti_current_student', JSON.stringify(fresh));

        if (fresh.attendance_status) {
          setAttendanceStatus(fresh.attendance_status as any);
        } else if (fresh.notes?.includes('Смогу прийти') || fresh.notes?.includes('Будет на занятии')) {
          setAttendanceStatus('going');
        } else if (fresh.notes?.includes('Не смогу')) {
          setAttendanceStatus('not_going');
        }
      }

      if (attendRes?.data?.status) {
        setAttendanceStatus(attendRes.data.status as any);
      }

      if (newsRes.data && newsRes.data.length > 0) {
        setNews(newsRes.data as NewsRow[]);
      }

      if (notifsRes.data) {
        const allNotifs = notifsRes.data as AppNotificationRow[];
        const forStudent = allNotifs.filter(
          (n) => n.target_student_id === studentId ||
                 (!n.target_student_id && (n.target_group_id === 'all' || n.target_group_id === profile?.group_id))
        );
        setNotifications(forStudent);
      }

      if (rulesRes.data && rulesRes.data.length > 0) {
        setRules(rulesRes.data as StudioRuleSection[]);
      } else {
        setRules(defaultRules);
      }
    } catch (e) {
      console.warn('Ошибка загрузки данных:', e);
    }
  };

  const handleRequestPush = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setPushPermission(perm);
        if (perm === 'granted') {
          new Notification('Студия ARVESTI', {
            body: 'Уведомления успешно подключены! Теперь вы будете первыми узнавать об отменах и новостях студии.',
            icon: '/favicon.ico',
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const setupGroup = (groupId?: string | null) => {
    const savedGroups = typeof window !== 'undefined' ? localStorage.getItem('arvesti_groups_schedule') : null;
    let customGroups: any[] = [];
    if (savedGroups) {
      try { customGroups = JSON.parse(savedGroups); } catch {}
    }

    const defaultGroups = [
      {
        id: 'grp-1',
        name: 'ARVESTI 1.0',
        age_category: 'Старшая группа',
        schedule: 'Четверг, Суббота',
        time: 'Чт — 19:00, Сб — 16:30',
        studio_room: 'Большой зал',
      },
      {
        id: 'grp-2',
        name: 'ARVESTI 2.0',
        age_category: 'Старшая группа',
        schedule: 'Суббота и Воскресенье',
        time: '15:00',
        studio_room: 'Большой зал',
      },
      {
        id: 'grp-3',
        name: 'ARVESTI 3.0',
        age_category: 'Младшая группа',
        schedule: 'Суббота и Воскресенье',
        time: '14:00',
        studio_room: 'Малый зал',
      },
      {
        id: 'grp-4',
        name: 'ARVESTI 4.0',
        age_category: 'Младшая группа',
        schedule: 'Суббота и Воскресенье',
        time: '13:00',
        studio_room: 'Малый зал',
      },
    ];

    const source = customGroups.length > 0 ? customGroups : defaultGroups;
    const found = source.find((g) => g.id === groupId);
    if (found) {
      setGroup({
        id: found.id,
        name: found.name,
        age_category: found.age_category,
        schedule: found.schedule,
        time: found.time,
        studio_room: found.studio_room || 'Большой зал',
      });
    } else {
      setGroup(defaultGroups[0]);
    }
  };

  // ДВЕ КНОПКИ: «Смогу прийти» / «Не смогу прийти»
  const handleSetAttendance = async (status: 'going' | 'not_going') => {
    if (!profile) return;
    setAttendanceLoading(true);
    setAttendanceStatus(status);

    const timeStr = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const dateStr = new Date().toLocaleDateString('ru-RU');
    const noteText = status === 'going' ? `Смогу прийти (${dateStr} ${timeStr})` : `Не смогу прийти (${dateStr} ${timeStr})`;

    try {
      await supabase.from('profiles').update({ notes: noteText, attendance_status: status }).eq('id', profile.id);
      await supabase.from('attendance').upsert({
        id: `att-${profile.id}`,
        student_id: profile.id,
        student_name: profile.full_name,
        group_id: profile.group_id || 'grp-1',
        status: status,
        date: dateStr,
        confirmed_at: new Date().toISOString(),
      });
    } catch {}

    const updated = { ...profile, notes: noteText, attendance_status: status };
    setProfile(updated);
    localStorage.setItem('arvesti_current_student', JSON.stringify(updated));
    setAttendanceLoading(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    // 1. ВХОД РУКОВОДИТЕЛЯ
    if (authRole === 'admin') {
      const pass = authPassword.trim();
      if (pass === 'ArvestiAdmin2026!' || pass === 'admin123456' || pass === 'admin') {
        if (typeof window !== 'undefined') {
          localStorage.setItem('arvesti_admin_authorized', 'true');
          window.location.href = '/admin';
        }
        return;
      }
      setAuthError('Неверный пароль администратора.');
      setAuthLoading(false);
      return;
    }

    // 2. ВХОД УЧЕНИЦЫ
    if (authMode === 'login') {
      try {
        let st: ProfileRow | null = null;

        // Если выбрана из выпадающего списка
        if (selectedStudentId) {
          st = availableStudents.find((s) => s.id === selectedStudentId) || null;
        }

        // Если введен номер телефона, логин или ФИО
        if (!st && authUsername.trim()) {
          const inputClean = authUsername.trim();
          const inputDigits = inputClean.replace(/[^0-9]/g, '');

          // Поиск по номеру телефона
          if (inputDigits.length >= 6) {
            st = availableStudents.find((s) => {
              const sDigits = s.phone.replace(/[^0-9]/g, '');
              return sDigits.includes(inputDigits) || inputDigits.includes(sDigits);
            }) || null;
          }

          // Поиск по логину
          if (!st) {
            st = availableStudents.find((s) => s.username?.toLowerCase() === inputClean.toLowerCase()) || null;
          }

          // Поиск по ФИО
          if (!st) {
            st = availableStudents.find((s) => s.full_name.toLowerCase().includes(inputClean.toLowerCase())) || null;
          }

          // Поиск в базе Supabase
          if (!st) {
            const { data } = await supabase.from('profiles').select('*');
            if (data) {
              const all = data as ProfileRow[];
              st = all.find((p) => {
                const pDigits = p.phone.replace(/[^0-9]/g, '');
                return (
                  (inputDigits.length >= 6 && pDigits.includes(inputDigits)) ||
                  p.username?.toLowerCase() === inputClean.toLowerCase() ||
                  p.full_name.toLowerCase().includes(inputClean.toLowerCase())
                );
              }) || null;
            }
          }
        }

        if (!st) {
          setAuthError('Ученица не найдена. Проверьте номер телефона или выберите себя из списка ниже.');
          setAuthLoading(false);
          return;
        }

        // Проверка пароля (если пароль задан у ученицы)
        if (st.password && authPassword && st.password !== authPassword.trim()) {
          setAuthError('Неверный пароль.');
          setAuthLoading(false);
          return;
        }

        localStorage.setItem('arvesti_current_student', JSON.stringify(st));
        if (typeof document !== 'undefined') {
          document.cookie = `arvesti_student_id=${st.id}; path=/; max-age=315360000; SameSite=Lax`;
        }

        setProfile(st);
        setIsLoggedIn(true);
        setupGroup(st.group_id);
        fetchStudioData(st.id);
        setActiveTab('dashboard');
      } catch (err: any) {
        setAuthError('Ошибка входа: ' + err.message);
      } finally {
        setAuthLoading(false);
      }
      return;
    }

    // 3. РЕГИСТРАЦИЯ НОВОЙ УЧЕНИЦЫ
    if (authMode === 'register') {
      try {
        const cleanLogin = (authUsername.trim() || regFullName.trim().toLowerCase().replace(/\s+/g, '_'));
        const newStudent = {
          id: 'student-' + Date.now(),
          username: cleanLogin,
          password: authPassword || '123456',
          full_name: regFullName.trim(),
          phone: regPhone.trim(),
          role: 'student',
          group_id: regGroup,
          account_type: regType,
          payment_status: 'paid',
          payment_due_date: 'до 31.10.2026',
          status: 'pending',
          notes: 'Новая заявка',
        };

        const { error } = await supabase.from('profiles').insert([newStudent]);
        if (error) {
          setAuthError('Ошибка регистрации: ' + error.message);
          setAuthLoading(false);
          return;
        }

        setAuthSuccess('Заявка успешно отправлена! Руководитель Линда Азизян подтвердит запись.');
        setAuthMode('login');
      } catch (err: any) {
        setAuthError(err.message || 'Ошибка');
      } finally {
        setAuthLoading(false);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('arvesti_current_student');
    if (typeof document !== 'undefined') {
      document.cookie = 'arvesti_student_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
    setProfile(null);
    setIsLoggedIn(false);
    setAuthRole('choose');
    setAuthMode('login');
    setSelectedStudentId('');
    setAuthUsername('');
    setAuthPassword('');
  };

  const handleLogoClick = () => {
    if (isLoggedIn) {
      setActiveTab('dashboard');
    }
  };

  if (checkingSession) {
    return (
      <div className="py-32 text-center space-y-3">
        <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-neutral-400">Вход в студию ARVESTI...</p>
      </div>
    );
  }

  // =========================================================================
  // ЭКРАН ДО ВХОДА: ДВА ВАРИАНТА ВХОДА (УЧЕНИЦА ИЛИ РУКОВОДИТЕЛЬ)
  // =========================================================================
  if (!isLoggedIn) {
    // 1. НАЧАЛЬНЫЙ ЭКРАН: ВЫБОР РОЛИ (УЧЕНИЦА / РУКОВОДИТЕЛЬ)
    if (authRole === 'choose') {
      return (
        <div className="space-y-6 py-8 max-w-sm mx-auto animate-fadeIn">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-white text-black flex items-center justify-center font-black text-2xl shadow-xl">
              AR
            </div>
            <h1 className="text-3xl font-black tracking-widest text-white uppercase">ARVESTI</h1>
            <p className="text-xs text-neutral-300 font-medium">Женская студия кавказских танцев</p>
            <p className="text-[11px] text-neutral-500">{studioAddress}</p>
          </div>

          <div className="space-y-3 pt-2">
            <p className="text-center text-xs font-semibold text-neutral-400">Выберите вариант входа:</p>

            {/* ВАРИАНТ 1: Я УЧЕНИЦА */}
            <button
              type="button"
              onClick={() => { setAuthRole('student'); setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }}
              className="w-full p-5 rounded-3xl bg-neutral-900/90 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-left transition-all shadow-xl group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                  💃
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white">Я ученица</h3>
                    <span className="text-neutral-500 text-sm group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Личный кабинет: расписание, отметки посещаемости, новости и абонемент
                  </p>
                </div>
              </div>
            </button>

            {/* ВАРИАНТ 2: РУКОВОДИТЕЛЬ */}
            <button
              type="button"
              onClick={() => { setAuthRole('admin'); setAuthError(''); setAuthPassword(''); }}
              className="w-full p-5 rounded-3xl bg-neutral-900/90 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-left transition-all shadow-xl group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                  👑
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white">Руководитель (Линда Азизян)</h3>
                    <span className="text-neutral-500 text-sm group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Журнал посещаемости, список учениц, Push-уведомления и настройки
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Инструкция как убрать адресную строку на телефоне */}
          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-[11px] text-neutral-400 space-y-1.5">
            <p className="font-bold text-neutral-300 flex items-center gap-1.5">
              <span>📱</span>
              <span>Как убрать адресную строку на телефоне:</span>
            </p>
            <p className="leading-relaxed">
              Внизу Safari нажмите значок <strong>«Поделиться» ⬆️</strong> и выберите <strong>«На экран „Домой“»</strong>. Приложение откроется на весь экран как из App Store без адресной строки!
            </p>
          </div>
        </div>
      );
    }

    // 2. ЭКРАН ВХОДА РУКОВОДИТЕЛЯ
    if (authRole === 'admin') {
      return (
        <div className="space-y-6 py-8 max-w-sm mx-auto animate-fadeIn">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-2xl shadow-lg">
              👑
            </div>
            <h2 className="text-xl font-black text-white">Вход для руководителя</h2>
            <p className="text-xs text-neutral-400">Линда Азизян • Панель управления ARVESTI</p>
          </div>

          <div className="p-6 rounded-3xl border border-neutral-800 bg-neutral-900/90 shadow-2xl space-y-4">
            {authError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Пароль руководителя</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-white"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-neutral-200 text-black font-extrabold text-xs transition-all shadow-lg cursor-pointer"
              >
                {authLoading ? 'Проверка...' : 'Войти в панель управления'}
              </button>
            </form>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => { setAuthRole('choose'); setAuthError(''); setAuthPassword(''); }}
              className="text-neutral-400 hover:text-white text-xs transition-colors cursor-pointer"
            >
              ← Назад к выбору варианта входа
            </button>
          </div>
        </div>
      );
    }

    // 3. ЭКРАН ВХОДА / РЕГИСТРАЦИИ УЧЕНИЦЫ
    return (
      <div className="space-y-6 py-6 max-w-sm mx-auto animate-fadeIn">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white text-black flex items-center justify-center font-black text-2xl shadow-lg">
            AR
          </div>
          <h2 className="text-xl font-black text-white">Кабинет ученицы ARVESTI</h2>
          <p className="text-xs text-neutral-400">Вход по телефону или выбор из списка</p>
        </div>

        <div className="p-6 rounded-3xl border border-neutral-800 bg-neutral-900/90 shadow-2xl space-y-5">
          <div className="flex rounded-2xl bg-neutral-950 p-1 border border-neutral-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }}
              className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${
                authMode === 'login' ? 'bg-white text-black font-bold shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Вход
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setAuthError(''); setAuthSuccess(''); }}
              className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${
                authMode === 'register' ? 'bg-white text-black font-bold shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Регистрация
            </button>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{authSuccess}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-3.5 text-xs">
            {authMode === 'register' ? (
              <>
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">ФИО Ученицы</label>
                  <input
                    type="text"
                    required
                    placeholder="Алина Григорян"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Номер телефона</label>
                  <input
                    type="tel"
                    required
                    placeholder="+7 999 123 45 67"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 text-white font-mono focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Группа</label>
                  <select
                    value={regGroup}
                    onChange={(e) => setRegGroup(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-white cursor-pointer"
                  >
                    <option value="grp-1">ARVESTI 1.0 (Старшая, Чт 19:00, Сб 16:30)</option>
                    <option value="grp-2">ARVESTI 2.0 (Старшая, Сб/Вс 15:00)</option>
                    <option value="grp-3">ARVESTI 3.0 (Младшая, Сб/Вс 14:00)</option>
                    <option value="grp-4">ARVESTI 4.0 (Младшая, Сб/Вс 13:00)</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                {/* Быстрый выбор из списка зарегистрированных учениц */}
                {availableStudents.length > 0 && (
                  <div>
                    <label className="block text-neutral-300 font-semibold mb-1">
                      Быстрый выбор из списка учениц:
                    </label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setSelectedStudentId(id);
                        const st = availableStudents.find((s) => s.id === id);
                        if (st) {
                          setAuthUsername(st.phone || st.username || '');
                        }
                      }}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-white cursor-pointer"
                    >
                      <option value="">-- Выберите своё имя из списка --</option>
                      {availableStudents.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.full_name} ({st.phone})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">
                    Или введите номер телефона / логин
                  </label>
                  <input
                    type="text"
                    required={!selectedStudentId}
                    placeholder="+7 999 123 45 67 или username"
                    value={authUsername}
                    onChange={(e) => {
                      setAuthUsername(e.target.value);
                      if (selectedStudentId) setSelectedStudentId('');
                    }}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-white"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-neutral-300 font-semibold mb-1">
                Пароль {authMode === 'login' && <span className="text-neutral-500 font-normal">(если задан)</span>}
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-white"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-neutral-200 text-black font-extrabold text-xs transition-all shadow-lg cursor-pointer mt-2"
            >
              {authLoading ? 'Обработка...' : authMode === 'register' ? 'Зарегистрироваться' : 'Войти в личный кабинет'}
            </button>
          </form>
        </div>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => { setAuthRole('choose'); setAuthError(''); }}
            className="text-neutral-400 hover:text-white text-xs transition-colors cursor-pointer"
          >
            ← Назад к выбору варианта входа
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // ОСНОВНОЙ ЭКРАН УЧЕНИЦЫ С 4 РАЗДЕЛАМИ ВНИЗУ
  // =========================================================================
  return (
    <div className="space-y-4 pb-24 max-w-md mx-auto animate-fadeIn">
      {/* Всплывающее Push-уведомление */}
      {activeToast && (
        <div className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto p-4 rounded-2xl bg-white text-black shadow-2xl border border-neutral-200 animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className={`p-2 rounded-xl text-white shrink-0 ${activeToast.target_student_id ? 'bg-purple-600' : 'bg-black'}`}>
                {activeToast.target_student_id ? <MessageCircle className="w-4 h-4 animate-bounce" /> : <Bell className="w-4 h-4 animate-bounce" />}
              </div>
              <div>
                <p className="font-black text-[10px] uppercase tracking-wider text-neutral-500">
                  {activeToast.target_student_id ? '💌 Личное сообщение от педагога' : 'Студия ARVESTI'}
                </p>
                <h4 className="font-bold text-sm leading-tight text-black mt-0.5">{activeToast.title}</h4>
                <p className="text-xs text-neutral-700 mt-1">{activeToast.message}</p>
              </div>
            </div>
            <button onClick={() => setActiveToast(null)} className="p-1 text-neutral-400 hover:text-black">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Верхняя строка: логотип и колокольчик */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3 pt-1">
        <button
          type="button"
          onClick={handleLogoClick}
          className="flex items-center gap-2.5 cursor-pointer text-left focus:outline-none"
        >
          <div className="w-9 h-9 rounded-2xl bg-white text-black flex items-center justify-center font-black text-base shadow">
            AR
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-white tracking-wider text-sm">ARVESTI</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-900 border border-neutral-700 font-bold uppercase text-neutral-300">
                Studio
              </span>
            </div>
            <p className="text-[10px] text-neutral-400">Кавказские танцы • Пятигорск</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          {notifications.length > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
          )}
        </button>
      </div>

      {showPwaTip && (
        <div className="p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800 text-[11px] text-neutral-300 flex items-start justify-between gap-2 shadow">
          <div className="flex items-start gap-2">
            <span className="text-base shrink-0">📱</span>
            <p className="leading-tight">
              <strong>Совет для телефона:</strong> чтобы скрыть адресную строку Safari, нажмите значок <strong>«Поделиться» ⬆️</strong> внизу экрана и выберите <strong>«На экран „Домой“»</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPwaTip(false)}
            className="text-neutral-500 hover:text-white p-1 shrink-0 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {pushSupported && pushPermission !== 'granted' && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <div>
              <p className="font-bold text-amber-300">Включите Push-уведомления</p>
              <p className="text-[11px] text-neutral-400">Оповещения об отменах и личные сообщения</p>
            </div>
          </div>
          <button
            onClick={handleRequestPush}
            className="py-1.5 px-3.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-extrabold text-xs transition-colors shrink-0 shadow cursor-pointer"
          >
            Включить
          </button>
        </div>
      )}

      {showNotifications && (
        <div className="p-4 rounded-3xl border border-neutral-800 bg-neutral-900 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs text-white flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Уведомления студии</span>
            </h3>
            <button onClick={() => setShowNotifications(false)} className="text-neutral-400 hover:text-white text-xs">
              Закрыть
            </button>
          </div>
          {notifications.length === 0 ? (
            <p className="text-neutral-500 text-xs text-center py-4">Нет новых уведомлений</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 rounded-2xl border ${
                    n.target_student_id
                      ? 'border-purple-500/40 bg-purple-500/10'
                      : n.type === 'urgent'
                      ? 'border-red-500/40 bg-red-500/10'
                      : 'border-neutral-800 bg-neutral-950'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-bold ${n.target_student_id ? 'text-purple-300' : n.type === 'urgent' ? 'text-red-400' : 'text-white'}`}>
                      {n.target_student_id ? '💌 ' + n.title : n.title}
                    </span>
                    <span className="text-[9px] text-neutral-500">{n.created_at}</span>
                  </div>
                  <p className="text-neutral-300 mt-1 text-[11px] leading-relaxed">{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 1. ГЛАВНАЯ В ДАШБОРДЕ */}
      {activeTab === 'dashboard' && (
        <div className="space-y-4">
          {/* Карточка ближайшего занятия */}
          <div className="p-5 rounded-3xl border border-neutral-800 bg-neutral-900/90 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Ближайшее занятие</span>
                <h2 className="text-lg font-black text-white mt-0.5">{group?.name || 'ARVESTI'}</h2>
                <p className="text-xs text-neutral-400">{group?.age_category} • {group?.time}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-neutral-400 block">Дни занятий</span>
                <span className="text-xs font-bold text-white">{group?.schedule}</span>
              </div>
            </div>

            {/* Две главные кнопки: «Смогу прийти» и «Не смогу прийти» */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-neutral-300">Подтвердите ваше присутствие на уроке:</p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={attendanceLoading}
                  onClick={() => handleSetAttendance('going')}
                  className={`py-3.5 px-3 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                    attendanceStatus === 'going'
                      ? 'bg-emerald-500 text-black ring-2 ring-emerald-400 scale-[1.02]'
                      : 'bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300'
                  }`}
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Смогу прийти</span>
                </button>

                <button
                  type="button"
                  disabled={attendanceLoading}
                  onClick={() => handleSetAttendance('not_going')}
                  className={`py-3.5 px-3 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                    attendanceStatus === 'not_going'
                      ? 'bg-red-600 text-white ring-2 ring-red-400 scale-[1.02]'
                      : 'bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300'
                  }`}
                >
                  <X className="w-4 h-4 stroke-[3]" />
                  <span>Не смогу прийти</span>
                </button>
              </div>

              {profile?.notes && (
                <p className="text-[11px] text-neutral-400 text-center pt-1 font-mono">
                  {profile.notes}
                </p>
              )}
            </div>

            {/* Статус абонемента */}
            <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-neutral-400" />
                <span className="text-neutral-300">Абонемент:</span>
              </div>
              <span className={`font-black px-2.5 py-1 rounded-xl text-[10px] ${
                profile?.payment_status === 'paid'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/15 text-red-400 border border-red-500/30'
              }`}>
                {profile?.payment_status === 'paid' ? 'Оплачен' : 'Требуется оплата'}
              </span>
            </div>

            {/* Адрес студии */}
            <div className="pt-2 border-t border-neutral-800 flex items-start gap-2 text-xs text-neutral-400">
              <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{studioAddress}</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. НОВОСТИ */}
      {activeTab === 'news' && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-1.5 px-1">
            <Newspaper className="w-4 h-4" />
            <span>Новости и объявления студии</span>
          </h2>

          {news.length === 0 ? (
            <div className="p-8 text-center rounded-3xl border border-neutral-800 bg-neutral-900/60 text-neutral-500 text-xs">
              Новостей пока нет
            </div>
          ) : (
            news.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-3xl border ${
                  item.pinned
                    ? 'border-amber-500/40 bg-amber-500/5'
                    : 'border-neutral-800 bg-neutral-900/80'
                } space-y-2`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white">{item.title}</h3>
                  {item.pinned && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[9px] font-bold">
                      Закреплено
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-300 whitespace-pre-line leading-relaxed">{item.content}</p>
                <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-2 border-t border-neutral-800/60">
                  <span>{item.author || 'Линда Азизян'}</span>
                  <span>{item.date}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 3. ПРАВИЛА */}
      {activeTab === 'rules' && (
        <div className="space-y-3">
          <div className="p-4 rounded-3xl border border-neutral-800 bg-neutral-900/80 space-y-1">
            <h2 className="text-sm font-black text-white flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Правила студии ARVESTI</span>
            </h2>
            <p className="text-xs text-neutral-400">
              Руководитель Линда Азизян • ТРЦ «Арбат», Пятигорск
            </p>
          </div>

          <div className="space-y-2.5">
            {rules.map((rule) => (
              <div key={rule.id} className="p-4 rounded-3xl border border-neutral-800 bg-neutral-900/60 space-y-2">
                <h3 className="font-bold text-xs text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-lg bg-neutral-800 text-white flex items-center justify-center text-[10px] font-mono">
                    {rule.sort_order || rule.id}
                  </span>
                  <span>{rule.title}</span>
                </h3>
                <div className="space-y-1 pl-7 text-xs text-neutral-300 leading-relaxed">
                  {rule.items.map((item, idx) => (
                    <p key={idx}>{item}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. МОЙ АККАУНТ */}
      {activeTab === 'account' && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-1.5 px-1">
            <UserIcon className="w-4 h-4" />
            <span>Мой аккаунт</span>
          </h2>

          <div className="p-5 rounded-3xl border border-neutral-800 bg-neutral-900/90 shadow-xl space-y-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center font-black text-lg shadow">
                {profile?.full_name ? profile.full_name.charAt(0) : 'A'}
              </div>
              <div>
                <h3 className="text-base font-black text-white">{profile?.full_name}</h3>
                <p className="text-neutral-400 font-mono">@{profile?.username}</p>
              </div>
            </div>

            <div className="divide-y divide-neutral-800 pt-2 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-neutral-400">Телефон:</span>
                <span className="font-mono text-white font-bold">{profile?.phone}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-neutral-400">Группа:</span>
                <span className="font-bold text-white">{group?.name || 'ARVESTI'}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-neutral-400">Расписание:</span>
                <span className="font-bold text-white">{group?.time}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-neutral-400">Статус абонемента:</span>
                <span className={`font-bold ${profile?.payment_status === 'paid' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {profile?.payment_status === 'paid' ? 'Оплачен' : 'Задолженность'}
                </span>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-3 px-4 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Выйти из учетной записи</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* НИЖНЯЯ ПАНЕЛЬ С 4 РАЗДЕЛАМИ */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-md border-t border-neutral-800 safe-bottom">
        <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center w-full h-full py-1 transition-colors cursor-pointer ${
              activeTab === 'dashboard' ? 'text-white font-bold' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Home className={`w-5 h-5 ${activeTab === 'dashboard' ? 'scale-110 text-white' : ''}`} />
            <span className="text-[10px] mt-1">Главная</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('news')}
            className={`flex flex-col items-center justify-center w-full h-full py-1 transition-colors cursor-pointer ${
              activeTab === 'news' ? 'text-white font-bold' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Newspaper className={`w-5 h-5 ${activeTab === 'news' ? 'scale-110 text-white' : ''}`} />
            <span className="text-[10px] mt-1">Новости</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`flex flex-col items-center justify-center w-full h-full py-1 transition-colors cursor-pointer ${
              activeTab === 'rules' ? 'text-white font-bold' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <BookOpen className={`w-5 h-5 ${activeTab === 'rules' ? 'scale-110 text-white' : ''}`} />
            <span className="text-[10px] mt-1">Правила</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`flex flex-col items-center justify-center w-full h-full py-1 transition-colors cursor-pointer ${
              activeTab === 'account' ? 'text-white font-bold' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <UserIcon className={`w-5 h-5 ${activeTab === 'account' ? 'scale-110 text-white' : ''}`} />
            <span className="text-[10px] mt-1">Мой аккаунт</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
