'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Home,
  Newspaper,
  BookOpen,
  User as UserIcon,
  CalendarCheck,
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
} from 'lucide-react';
import { ProfileRow, GroupRow, NewsRow, AppNotificationRow, StudioRuleSection } from '@/types/database';

export default function ArvestiApp() {
  const supabase = createClient();

  // Состояние авторизации
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Вкладки: Главная, Новости, Правила, Мой аккаунт
  const [activeTab, setActiveTab] = useState<'dashboard' | 'news' | 'rules' | 'account'>('dashboard');

  // Данные ученицы и студии
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [group, setGroup] = useState<GroupRow | null>(null);
  const [news, setNews] = useState<NewsRow[]>([]);
  const [notifications, setNotifications] = useState<AppNotificationRow[]>([]);
  const [rules, setRules] = useState<StudioRuleSection[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Push-уведомления
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<string>('default');
  const [activeToast, setActiveToast] = useState<AppNotificationRow | null>(null);

  // Посещаемость: 'going' (Смогу прийти), 'not_going' (Не смогу прийти), 'unconfirmed'
  const [attendanceStatus, setAttendanceStatus] = useState<'going' | 'not_going' | 'unconfirmed'>('unconfirmed');
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Форма входа / регистрации (до входа)
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'admin'>('login');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('+7 ');
  const [regGroup, setRegGroup] = useState('grp-1');
  const [regType, setRegType] = useState<'subscription' | 'drop_in'>('subscription');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // 1. Проверка сессии при загрузке: сессия сохраняется НАВСЕГДА
  useEffect(() => {
    async function checkAuth() {
      if (typeof window === 'undefined') return;

      if ('Notification' in window) {
        setPushSupported(true);
        setPushPermission(Notification.permission);
      }

      // Проверяем сохраненную сессию ученицы
      const saved = localStorage.getItem('arvesti_current_student');
      let st: ProfileRow | null = null;
      if (saved) {
        try {
          st = JSON.parse(saved);
        } catch {}
      }

      // Если в localStorage нет, проверяем cookie
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

      setCheckingSession(false);
    }

    checkAuth();
  }, [supabase]);

  // Настройка группы
  const setupGroup = (grpId?: string | null) => {
    const id = grpId || 'grp-1';
    setGroup({
      id: id,
      name: id === 'grp-2' ? 'ARVESTI 2.0' : id === 'grp-3' ? 'ARVESTI 3.0' : id === 'grp-4' ? 'ARVESTI 4.0' : 'ARVESTI 1.0',
      age_category: id === 'grp-3' || id === 'grp-4' ? 'Младшая группа' : 'Старшая группа',
      schedule: id === 'grp-1' ? 'Четверг, Суббота' : 'Суббота, Воскресенье',
      time: id === 'grp-1' ? '19:00 - 20:30' : id === 'grp-2' ? '17:00 - 18:30' : id === 'grp-3' ? '14:00 - 15:30' : '15:30 - 17:00',
      days_of_week: ['Чт', 'Сб'],
    });
  };

  // Загрузка новостей, правил, отметок из Supabase (НЕ УДАЛЯЯ ДАННЫЕ)
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
        } else if (fresh.notes?.includes('Будет на занятии')) {
          setAttendanceStatus('going');
        } else if (fresh.notes?.includes('Не сможет')) {
          setAttendanceStatus('not_going');
        }
      }

      if (attendRes?.data?.status) {
        setAttendanceStatus(attendRes.data.status as any);
      }

      if (newsRes.data && newsRes.data.length > 0) {
        setNews(newsRes.data as NewsRow[]);
      } else {
        setNews([
          {
            id: 'news-1',
            title: 'Открытие осеннего сезона в ARVESTI',
            content: 'Ждем всех на занятиях кавказскими танцами в ТРЦ «Арбат». Набор в младшую и старшую группы открыт!',
            date: '25 сентября 2026',
            author: 'Линда Азизян',
            category: 'announcement',
            pinned: true,
          },
        ]);
      }

      if (notifsRes.data) {
        setNotifications(notifsRes.data as AppNotificationRow[]);
      }

      if (rulesRes.data && rulesRes.data.length > 0) {
        setRules(rulesRes.data as StudioRuleSection[]);
      } else {
        setRules([
          {
            id: 1,
            title: 'Общие правила студии ARVESTI',
            items: [
              'Вход в танцевальный зал строго в сменной чистой обуви (балетки, чешки или носочки).',
              'Приходить на занятие необходимо за 10–15 минут до начала для спокойной подготовки и переодевания.',
              'Во время занятия телефоны должны быть переведены в бесшумный режим.',
              'Бережно относиться к имуществу зала, зеркалам и реквизиту студии.',
            ],
            sort_order: 1,
          },
          {
            id: 2,
            title: 'Посещение и отметки («Смогу прийти» / «Не смогу прийти»)',
            items: [
              'При невозможности посетить тренировку необходимо предупредить педагога заранее через личный кабинет (кнопка «Не смогу прийти»).',
              'Пропущенные по уважительной причине занятия можно отработать с параллельной группой в течение текущего месяца.',
              'В случае отмены занятия педагогом, студия назначает дату полноценной отработки.',
            ],
            sort_order: 2,
          },
          {
            id: 3,
            title: 'Оплата абонементов и расчётный период',
            items: [
              'Оплата абонемента производится строго с 27 числа текущего месяца до конца месяца на следующий расчётный период.',
              'В случае задержки оплаты место в группе не гарантируется.',
              'Разовые посещения осуществляются только по предварительной заявке при наличии свободных мест.',
            ],
            sort_order: 3,
          },
        ]);
      }
    } catch (e) {
      console.warn('Ошибка загрузки данных:', e);
    }
  };

  // Realtime Push-уведомления
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel('app_student_push')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const newNotif = payload.new as AppNotificationRow;
        if (!newNotif) return;

        if (newNotif.target_group_id === 'all' || newNotif.target_group_id === profile.group_id) {
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(newNotif.title, { body: newNotif.message, icon: '/favicon.ico' });
            } catch {}
          }
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            try { navigator.vibrate([200, 100, 200]); } catch {}
          }
          setActiveToast(newNotif);
          setNotifications((prev) => [newNotif, ...prev]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, profile?.group_id, supabase]);

  // Запрос Push-уведомлений
  const handleRequestPush = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setPushPermission(perm);
        if (perm === 'granted') {
          new Notification('Студия ARVESTI', {
            body: 'Push-уведомления включены! Вы будете мгновенно получать новости и переносы занятий.',
            icon: '/favicon.ico',
          });
        }
      } catch {}
    }
  };

  // ДВЕ КНОПКИ: «Смогу прийти» / «Не смогу прийти»
  const handleSetAttendance = async (status: 'going' | 'not_going') => {
    if (!profile) return;
    setAttendanceLoading(true);
    setAttendanceStatus(status);

    const timeStr = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const dateStr = new Date().toLocaleDateString('ru-RU');
    const noteText = status === 'going' ? `Будет на занятии (отмечено ${dateStr} ${timeStr})` : `Не сможет прийти (отмечено ${dateStr} ${timeStr})`;

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
    } catch (e) {
      console.warn('Ошибка сохранения отметки:', e);
    }

    const updated = { ...profile, notes: noteText, attendance_status: status };
    setProfile(updated);
    localStorage.setItem('arvesti_current_student', JSON.stringify(updated));
    setAttendanceLoading(false);
  };

  // Вход / Регистрация учениц
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    // Вход как администратор
    if (authMode === 'admin') {
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

    // Вход ученицы
    if (authMode === 'login') {
      const cleanLogin = authUsername.trim().toLowerCase();
      if (!cleanLogin) {
        setAuthError('Введите логин ученицы.');
        setAuthLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.from('profiles').select('*').eq('username', cleanLogin).maybeSingle();
        const st = data as ProfileRow | null;

        if (!st) {
          setAuthError('Ученица с таким логином не найдена. Нажмите «Регистрация», чтобы записаться.');
          setAuthLoading(false);
          return;
        }

        if (st.password && st.password !== authPassword) {
          setAuthError('Неверный пароль.');
          setAuthLoading(false);
          return;
        }

        if (st.status === 'pending') {
          setAuthError('Ваша заявка ожидает подтверждения руководителем студии Линдой Азизян.');
          setAuthLoading(false);
          return;
        }

        // Сохраняем сессию НАВСЕГДА
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
        setAuthError('Ошибка входа: ' + (err.message || 'попробуйте позже'));
      } finally {
        setAuthLoading(false);
      }
      return;
    }

    // Регистрация новой ученицы
    if (authMode === 'register') {
      const cleanLogin = authUsername.trim().toLowerCase();
      if (!regFullName.trim()) {
        setAuthError('Укажите ФИО ученицы.');
        setAuthLoading(false);
        return;
      }
      if (!cleanLogin || cleanLogin.length < 3) {
        setAuthError('Логин должен содержать от 3 символов.');
        setAuthLoading(false);
        return;
      }
      if (authPassword.length < 4) {
        setAuthError('Пароль должен содержать от 4 символов.');
        setAuthLoading(false);
        return;
      }

      try {
        const newStudent = {
          id: 'student-' + Date.now(),
          username: cleanLogin,
          password: authPassword,
          full_name: regFullName.trim(),
          phone: regPhone.trim(),
          role: 'student',
          group_id: regGroup,
          account_type: regType,
          payment_status: 'paid',
          payment_due_date: 'до 31.10.2026',
          status: 'pending',
          notes: 'Новая заявка через сайт',
        };

        const { error } = await supabase.from('profiles').insert([newStudent]);
        if (error) {
          if (error.message?.includes('duplicate key') || error.code === '23505') {
            setAuthError('Ученица с таким логином уже есть. Пожалуйста, придумайте другой логин.');
            setAuthLoading(false);
            return;
          }
          setAuthError('Ошибка регистрации: ' + error.message);
          setAuthLoading(false);
          return;
        }

        setAuthSuccess('Заявка успешно отправлена руководителю! После одобрения вы сможете войти.');
        setAuthMode('login');
      } catch (err: any) {
        setAuthError(err.message || 'Ошибка регистрации');
      } finally {
        setAuthLoading(false);
      }
    }
  };

  // Выход из аккаунта (только на вкладке Мой аккаунт)
  const handleLogout = () => {
    localStorage.removeItem('arvesti_current_student');
    if (typeof document !== 'undefined') {
      document.cookie = 'arvesti_student_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
    setProfile(null);
    setIsLoggedIn(false);
    setAuthMode('login');
  };

  // Клик по надписи ARVESTI: НЕ СБРАСЫВАЕТ ВХОД, а переключает на «Главная»
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
  // ЭКРАН ДО ВХОДА (НЕТ ПРАВИЛ СВЕРХУ, НЕТ ВЫХОДА, НЕТ АДМИНКИ СВЕРХУ)
  // =========================================================================
  if (!isLoggedIn) {
    return (
      <div className="space-y-8 py-8 max-w-sm mx-auto animate-fadeIn">
        {/* Чистая шапка студии (без кнопок сверху) */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white text-black flex items-center justify-center font-black text-2xl shadow-lg">
            AR
          </div>
          <h1 className="text-3xl font-black tracking-widest text-white uppercase">
            ARVESTI
          </h1>
          <p className="text-xs text-neutral-400">
            Студия кавказских танцев в Пятигорске • ТРЦ «Арбат»
          </p>
        </div>

        {/* Карточка авторизации */}
        <div className="p-6 rounded-3xl border border-neutral-800 bg-neutral-900/90 shadow-2xl space-y-5">
          {authMode !== 'admin' && (
            <div className="flex rounded-2xl bg-neutral-950 p-1 border border-neutral-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }}
                className={`flex-1 py-2.5 rounded-xl transition-all ${
                  authMode === 'login' ? 'bg-white text-black font-bold shadow' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Вход
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setAuthError(''); setAuthSuccess(''); }}
                className={`flex-1 py-2.5 rounded-xl transition-all ${
                  authMode === 'register' ? 'bg-white text-black font-bold shadow' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Регистрация
              </button>
            </div>
          )}

          {authMode === 'admin' && (
            <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
              <p className="font-bold text-xs text-white">Вход для руководителя</p>
              <p className="text-[10px] text-neutral-400">Линда Азизян • ARVESTI</p>
            </div>
          )}

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
            {authMode === 'register' && (
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">ФИО Ученицы</label>
                <input
                  type="text"
                  required
                  placeholder="Например: Алина Григорян"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-white"
                />
              </div>
            )}

            <div>
              <label className="block text-neutral-300 font-semibold mb-1">
                {authMode === 'admin' ? 'Логин' : 'Логин ученицы'}
              </label>
              <input
                type="text"
                required
                placeholder={authMode === 'admin' ? 'admin' : 'username'}
                value={authUsername}
                onChange={(e) => setAuthUsername(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-white"
              />
            </div>

            {authMode === 'register' && (
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Номер телефона</label>
                <input
                  type="tel"
                  required
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 text-white font-mono focus:outline-none focus:border-white"
                />
              </div>
            )}

            <div>
              <label className="block text-neutral-300 font-semibold mb-1">Пароль</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-white"
              />
            </div>

            {authMode === 'register' && (
              <>
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Группа обучения</label>
                  <select
                    value={regGroup}
                    onChange={(e) => setRegGroup(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-white"
                  >
                    <option value="grp-1">ARVESTI 1.0 (Старшая, Чт/Сб)</option>
                    <option value="grp-2">ARVESTI 2.0 (Старшая, Сб/Вс)</option>
                    <option value="grp-3">ARVESTI 3.0 (Младшая, Сб/Вс)</option>
                    <option value="grp-4">ARVESTI 4.0 (Младшая, Сб/Вс)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Формат</label>
                  <select
                    value={regType}
                    onChange={(e: any) => setRegType(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-white"
                  >
                    <option value="subscription">Месячный абонемент</option>
                    <option value="drop_in">Разовые визиты</option>
                  </select>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-neutral-200 text-black font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow disabled:opacity-50 mt-2"
            >
              {authLoading ? 'Обработка...' : authMode === 'register' ? 'Зарегистрироваться' : 'Войти в личный кабинет'}
            </button>
          </form>
        </div>

        {/* В САМОМ НИЗУ: ВХОД КАК АДМИНИСТРАТОР (И БОЛЬШЕ НИЧЕГО ЛИШНЕГО) */}
        <div className="text-center pt-2">
          {authMode !== 'admin' ? (
            <button
              type="button"
              onClick={() => { setAuthMode('admin'); setAuthError(''); setAuthPassword(''); setAuthUsername('admin'); }}
              className="text-neutral-500 hover:text-neutral-300 text-xs flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-neutral-500" />
              <span>Вход как администратор</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setAuthError(''); setAuthPassword(''); setAuthUsername(''); }}
              className="text-neutral-400 hover:text-white text-xs transition-colors cursor-pointer"
            >
              ← Вернуться ко входу для учениц
            </button>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // ОСНОВНОЙ ЭКРАН ПОСЛЕ АВТОРИЗАЦИИ (С НИЖНИМИ 4 РАЗДЕЛАМИ)
  // =========================================================================
  return (
    <div className="space-y-4 pb-24 max-w-md mx-auto animate-fadeIn">
      {/* Всплывающее Push-уведомление */}
      {activeToast && (
        <div className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto p-4 rounded-2xl bg-white text-black shadow-2xl border border-neutral-200 animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-xl bg-black text-white shrink-0">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <p className="font-black text-[10px] uppercase tracking-wider text-neutral-500">Студия ARVESTI</p>
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

      {/* Верхняя строка: Клик по ARVESTI переводит на Главную, НЕ ВЫБРАСЫВАЯ из аккаунта */}
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

      {/* Включение Push-уведомлений */}
      {pushSupported && pushPermission !== 'granted' && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <div>
              <p className="font-bold text-amber-300">Включите Push-уведомления</p>
              <p className="text-[11px] text-neutral-400">Мгновенные оповещения об отменах и переносах</p>
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

      {/* Выпадающий список уведомлений */}
      {showNotifications && (
        <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900 space-y-3 shadow-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-white" />
              <span>Уведомления студии</span>
            </h3>
            <button onClick={() => setShowNotifications(false)} className="text-[11px] text-neutral-500 hover:text-white">
              Закрыть
            </button>
          </div>
          {notifications.length === 0 ? (
            <p className="text-xs text-neutral-400 py-2">Новых уведомлений нет.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {notifications.map((n) => (
                <div key={n.id} className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs space-y-1">
                  <p className="font-bold text-white">{n.title}</p>
                  <p className="text-neutral-400">{n.message}</p>
                  <p className="text-[10px] text-neutral-500">{n.created_at}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 1. ВКЛАДКА: ГЛАВНАЯ */}
      {/* ===================================================================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-4">
          {/* КАРТОЧКА 1: АБОНЕМЕНТ (ВЫШЕ РАСПИСАНИЯ!) */}
          <section className="p-5 rounded-3xl border border-neutral-800 bg-neutral-900/90 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <CreditCard className="w-4 h-4 text-white" />
                <span>Абонемент</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                profile?.payment_status === 'paid'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {profile?.payment_status === 'paid' ? 'Оплачен' : 'Задолженность'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-800">
              <span className="text-neutral-400">Срок действия:</span>
              <span className="font-bold text-white">{profile?.payment_due_date || 'до 31.10.2026'}</span>
            </div>

            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Оплата абонементов производится с 27 числа до конца месяца за следующий расчётный период.
            </p>
          </section>

          {/* КАРТОЧКА 2: СЛЕДУЮЩЕЕ ЗАНЯТИЕ (НИЖЕ! НАПИСАНО ТОЛЬКО «Следующее занятие») */}
          <section className="p-5 rounded-3xl border border-neutral-800 bg-neutral-900/90 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white tracking-wide">
                Следующее занятие
              </h2>
              <span className="text-xs font-bold text-neutral-400">
                {group?.name || 'ARVESTI'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1">
                <p className="text-neutral-500 text-[10px]">Дни и время:</p>
                <p className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{group?.schedule} • {group?.time}</span>
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1">
                <p className="text-neutral-500 text-[10px]">Место проведения:</p>
                <p className="font-bold text-white text-xs flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                  <span>ТРЦ «Арбат», 17</span>
                </p>
              </div>
            </div>

            {/* ДВЕ КНОПКИ: «Смогу прийти» И «Не смогу прийти» */}
            <div className="pt-2 border-t border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-neutral-300">
                  Вы планируете быть на занятии?
                </p>
                {attendanceStatus === 'going' && (
                  <span className="text-[11px] font-black text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Смогу прийти
                  </span>
                )}
                {attendanceStatus === 'not_going' && (
                  <span className="text-[11px] font-black text-red-400 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Не смогу прийти
                  </span>
                )}
                {attendanceStatus === 'unconfirmed' && (
                  <span className="text-[11px] text-neutral-500">
                    Не выбрано
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={attendanceLoading}
                  onClick={() => handleSetAttendance('going')}
                  className={`py-3 px-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                    attendanceStatus === 'going'
                      ? 'bg-emerald-500 border-emerald-400 text-black shadow-lg shadow-emerald-500/20'
                      : 'bg-neutral-950 border-neutral-800 text-white hover:border-neutral-700 hover:bg-neutral-800/80'
                  }`}
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Смогу прийти</span>
                </button>

                <button
                  type="button"
                  disabled={attendanceLoading}
                  onClick={() => handleSetAttendance('not_going')}
                  className={`py-3 px-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                    attendanceStatus === 'not_going'
                      ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/20'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 hover:bg-neutral-800/80'
                  }`}
                >
                  <X className="w-4 h-4 stroke-[3]" />
                  <span>Не смогу прийти</span>
                </button>
              </div>

              {attendanceStatus !== 'unconfirmed' && (
                <p className="text-[11px] text-neutral-400 text-center">
                  Педагог видит ваш ответ. Вы можете изменить решение в любое время.
                </p>
              )}
            </div>
          </section>

          {/* Важные новости на главной */}
          {news.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  <span>Важные новости</span>
                </h3>
                <button
                  onClick={() => setActiveTab('news')}
                  className="text-[11px] text-neutral-400 hover:text-white cursor-pointer"
                >
                  Все новости →
                </button>
              </div>

              <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-xs">{news[0].title}</h4>
                  <span className="text-[10px] text-neutral-500">{news[0].date}</span>
                </div>
                <p className="text-xs text-neutral-400 line-clamp-2">{news[0].content}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. ВКЛАДКА: НОВОСТИ */}
      {/* ===================================================================== */}
      {activeTab === 'news' && (
        <div className="space-y-4">
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-white" />
            <span>Новости студии ({news.length})</span>
          </h2>

          <div className="space-y-3">
            {news.map((item) => (
              <div key={item.id} className="p-5 rounded-3xl border border-neutral-800 bg-neutral-900/90 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-white text-sm">{item.title}</h3>
                  {item.pinned && (
                    <span className="px-2 py-0.5 rounded bg-white text-black font-bold text-[10px] shrink-0">
                      Закреплено
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-line">
                  {item.content}
                </p>
                <p className="text-[10px] text-neutral-500 pt-1">
                  {item.date} • {item.author}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. ВКЛАДКА: ПРАВИЛА */}
      {/* ===================================================================== */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-white" />
            <span>Правила студии ARVESTI</span>
          </h2>

          <div className="space-y-4">
            {rules.map((sec) => (
              <div key={sec.id} className="p-5 rounded-3xl border border-neutral-800 bg-neutral-900/90 space-y-3">
                <h3 className="font-bold text-white text-sm">{sec.title}</h3>
                <ul className="space-y-2 text-xs text-neutral-300 list-disc pl-4 leading-relaxed">
                  {sec.items.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. ВКЛАДКА: МОЙ АККАУНТ (БЫВШИЙ КАБИНЕТ УЧЕНИЦЫ) */}
      {/* ===================================================================== */}
      {activeTab === 'account' && (
        <div className="space-y-4">
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-white" />
            <span>Мой аккаунт</span>
          </h2>

          <div className="p-6 rounded-3xl border border-neutral-800 bg-neutral-900/90 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-neutral-800">
              <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center font-black text-lg">
                {profile?.full_name?.charAt(0) || 'У'}
              </div>
              <div>
                <h3 className="font-bold text-white text-base">{profile?.full_name}</h3>
                <p className="text-xs text-neutral-400">Логин: @{profile?.username}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1">
                <span className="text-neutral-400">Номер телефона:</span>
                <span className="font-mono font-semibold text-white">{profile?.phone}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-400">Группа обучения:</span>
                <span className="font-semibold text-white">{group?.name}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-400">Расписание:</span>
                <span className="text-neutral-200">{group?.schedule} • {group?.time}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-400">Статус абонемента:</span>
                <span className={`font-bold ${profile?.payment_status === 'paid' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {profile?.payment_status === 'paid' ? 'Оплачен' : 'Задолженность'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-400">Срок действия:</span>
                <span className="text-white">{profile?.payment_due_date || 'до конца месяца'}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-800">
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

      {/* ===================================================================== */}
      {/* ФИКСИРОВАННАЯ СТРОКА РАЗДЕЛОВ ВНИЗУ (4 КНОПКИ ВСЕГДА ВНИЗУ) */}
      {/* ===================================================================== */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-md border-t border-neutral-800 safe-bottom">
        <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center w-full h-full py-1 transition-colors cursor-pointer ${
              activeTab === 'dashboard' ? 'text-white font-bold' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Home className={`w-5 h-5 transition-transform ${activeTab === 'dashboard' ? 'scale-110 text-white' : ''}`} />
            <span className="text-[10px] mt-1">Главная</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('news')}
            className={`flex flex-col items-center justify-center w-full h-full py-1 transition-colors cursor-pointer ${
              activeTab === 'news' ? 'text-white font-bold' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Newspaper className={`w-5 h-5 transition-transform ${activeTab === 'news' ? 'scale-110 text-white' : ''}`} />
            <span className="text-[10px] mt-1">Новости</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`flex flex-col items-center justify-center w-full h-full py-1 transition-colors cursor-pointer ${
              activeTab === 'rules' ? 'text-white font-bold' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <BookOpen className={`w-5 h-5 transition-transform ${activeTab === 'rules' ? 'scale-110 text-white' : ''}`} />
            <span className="text-[10px] mt-1">Правила</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`flex flex-col items-center justify-center w-full h-full py-1 transition-colors cursor-pointer ${
              activeTab === 'account' ? 'text-white font-bold' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <UserIcon className={`w-5 h-5 transition-transform ${activeTab === 'account' ? 'scale-110 text-white' : ''}`} />
            <span className="text-[10px] mt-1">Мой аккаунт</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
