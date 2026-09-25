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
} from 'lucide-react';
import { ProfileRow, GroupRow, NewsRow, AppNotificationRow, StudioRuleSection } from '@/types/database';

export default function ArvestiApp() {
  const supabase = createClient();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'news' | 'rules' | 'account'>('dashboard');

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [group, setGroup] = useState<GroupRow | null>(null);
  const [news, setNews] = useState<NewsRow[]>([]);
  const [notifications, setNotifications] = useState<AppNotificationRow[]>([]);
  const [rules, setRules] = useState<StudioRuleSection[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<string>('default');
  const [activeToast, setActiveToast] = useState<AppNotificationRow | null>(null);

  const [attendanceStatus, setAttendanceStatus] = useState<'going' | 'not_going' | 'unconfirmed'>('unconfirmed');
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  const [authMode, setAuthMode] = useState<'login' | 'register' | 'admin'>('login');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('+7 ');
  const [regGroup, setRegGroup] = useState('grp-1');
  const [regType, setRegType] = useState<'subscription' | 'drop_in'>('subscription');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPushSupported(true);
        setPushPermission(Notification.permission);
      }

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

      setCheckingSession(false);
    }

    checkAuth();
  }, [supabase]);

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

  const fetchStudioData = async (studentId: string) => {
    try {
      const [profileRes, newsRes, notifsRes, rulesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', studentId).maybeSingle(),
        supabase.from('news').select('*').order('created_at', { ascending: false }),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }),
        supabase.from('studio_rules').select('*').order('sort_order', { ascending: true }),
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

      if (newsRes.data && newsRes.data.length > 0) {
        setNews(newsRes.data as NewsRow[]);
      }
      if (notifsRes.data && notifsRes.data.length > 0) {
        setNotifications(notifsRes.data as AppNotificationRow[]);
      }
      if (rulesRes.data && rulesRes.data.length > 0) {
        setRules(rulesRes.data as StudioRuleSection[]);
      }
    } catch (e) {
      console.warn('Ошибка загрузки данных:', e);
    }
  };

  useEffect(() => {
    if (!profile?.id) return;

    const playChime = () => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } catch {}
    };

    const channel = supabase
      .channel('app_student_push')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const newNotif = payload.new as AppNotificationRow;
        if (!newNotif) return;

        if (newNotif.target_group_id === 'all' || newNotif.target_group_id === profile.group_id) {
          playChime();
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

  const handleSetAttendance = async (status: 'going' | 'not_going') => {
    if (!profile) return;
    setAttendanceLoading(true);
    setAttendanceStatus(status);

    const timeStr = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const dateStr = new Date().toLocaleDateString('ru-RU');
    const noteText = status === 'going' ? `Будет на занятии (${dateStr} ${timeStr})` : `Не сможет прийти (${dateStr} ${timeStr})`;

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

    if (authMode === 'login') {
      const cleanLogin = authUsername.trim().toLowerCase();
      try {
        const { data } = await supabase.from('profiles').select('*').eq('username', cleanLogin).maybeSingle();
        const st = data as ProfileRow | null;

        if (!st) {
          setAuthError('Ученица не найдена. Нажмите «Регистрация», чтобы записаться.');
          setAuthLoading(false);
          return;
        }

        if (st.password && st.password !== authPassword) {
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

    if (authMode === 'register') {
      const cleanLogin = authUsername.trim().toLowerCase();
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
          notes: 'Новая заявка',
        };

        const { error } = await supabase.from('profiles').insert([newStudent]);
        if (error) {
          setAuthError('Ошибка регистрации: ' + error.message);
          setAuthLoading(false);
          return;
        }

        setAuthSuccess('Заявка успешно отправлена руководителю! После одобрения вы сможете войти.');
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
    setAuthMode('login');
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

  if (!isLoggedIn) {
    return (
      <div className="space-y-8 py-8 max-w-sm mx-auto animate-fadeIn">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white text-black flex items-center justify-center font-black text-2xl shadow-lg">
            AR
          </div>
          <h1 className="text-3xl font-black tracking-widest text-white uppercase">ARVESTI</h1>
          <p className="text-xs text-neutral-400">Студия кавказских танцев в Пятигорске • ТРЦ «Арбат»</p>
        </div>

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
                  placeholder="Алина Григорян"
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
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Группа</label>
                <select
                  value={regGroup}
                  onChange={(e) => setRegGroup(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-white cursor-pointer"
                >
                  <option value="grp-1">ARVESTI 1.0 (Старшая, Чт/Сб 19:00)</option>
                  <option value="grp-2">ARVESTI 2.0 (Старшая, Сб/Вс 17:00)</option>
                  <option value="grp-3">ARVESTI 3.0 (Младшая, Сб/Вс 14:00)</option>
                  <option value="grp-4">ARVESTI 4.0 (Младшая, Сб/Вс 15:30)</option>
                </select>
              </div>
            )}

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

  return (
    <div className="space-y-4 pb-24 max-w-md mx-auto animate-fadeIn">
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

      {/* Шапка: логотип не сбрасывает сессию */}
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

      {pushSupported && pushPermission !== 'granted' && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <div>
              <p className="font-bold text-amber-300">Включите Push-уведомления</p>
              <p className="text-[11px] text-neutral-400">Оповещения об отменах занятий</p>
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

      {/* 1. ГЛАВНАЯ */}
      {activeTab === 'dashboard' && (() => {
        const activeCancellation = notifications.find(
          (n) => (n.type === 'urgent' || n.title.toLowerCase().includes('отмен')) &&
                 (n.target_group_id === 'all' || n.target_group_id === profile?.group_id)
        ) || news.find(
          (nw) => nw.title.toLowerCase().includes('отмен') || nw.content.toLowerCase().includes('отмен')
        );

        return (
          <div className="space-y-4">
            {/* Предупреждение об отмене */}
            {activeCancellation && (
              <div className="p-4 rounded-3xl bg-red-500/15 border-2 border-red-500 text-red-200 shadow-2xl space-y-2 animate-in fade-in slide-in-from-top duration-300">
                <div className="flex items-center gap-2.5">
                  <AlertOctagon className="w-5 h-5 text-red-400 shrink-0 animate-bounce" />
                  <h3 className="font-black text-sm text-red-400 uppercase tracking-wide">
                    Внимание: Занятие отменено!
                  </h3>
                </div>
                <p className="text-xs text-white leading-relaxed font-semibold">
                  {'message' in activeCancellation ? activeCancellation.message : activeCancellation.content}
                </p>
                <div className="p-2.5 rounded-xl bg-black/40 border border-red-500/30 text-[11px] text-red-200">
                  ✨ По правилам студии ARVESTI будет обязательно проведена отработка! Дату педагог Линда Азизян сообщит дополнительно.
                </div>
              </div>
            )}

            {/* Карточка 1: Абонемент (ВЫШЕ РАСПИСАНИЯ!) */}
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

            {/* Карточка 2: Следующее занятие (НИЖЕ!) */}
            <section className="p-5 rounded-3xl border border-neutral-800 bg-neutral-900/90 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white tracking-wide">
                  Следующее занятие
                </h2>
                {activeCancellation ? (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-red-600 text-white font-black uppercase">
                    Отменено
                  </span>
                ) : (
                  <span className="text-xs font-bold text-neutral-400">
                    {group?.name || 'ARVESTI'}
                  </span>
                )}
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
              {activeCancellation ? (
                <div className="pt-2 border-t border-neutral-800 space-y-2 text-center">
                  <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center justify-center gap-2">
                    <AlertOctagon className="w-4 h-4 shrink-0 text-red-400" />
                    <span>Занятие отменено педагогом. Отметка не требуется.</span>
                  </div>
                </div>
              ) : (
                <div className="pt-2 border-t border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">Вы планируете быть на занятии?</span>
                    <div>
                      {attendanceStatus === 'going' && (
                        <span className="text-emerald-400 font-bold flex items-center gap-1 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Смогу прийти
                        </span>
                      )}
                      {attendanceStatus === 'not_going' && (
                        <span className="text-red-400 font-bold flex items-center gap-1 text-xs">
                          <XCircle className="w-3.5 h-3.5" /> Не смогу прийти
                        </span>
                      )}
                      {attendanceStatus === 'unconfirmed' && (
                        <span className="text-neutral-500 text-xs">Не выбрано</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      disabled={attendanceLoading}
                      onClick={() => handleSetAttendance('going')}
                      className={`py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        attendanceStatus === 'going'
                          ? 'bg-emerald-500 text-black border-2 border-emerald-400 shadow-lg shadow-emerald-500/20'
                          : 'bg-neutral-950 hover:bg-neutral-800 text-white border border-neutral-800'
                      }`}
                    >
                      <Check className={`w-4 h-4 ${attendanceStatus === 'going' ? 'text-black stroke-[3]' : 'text-emerald-500'}`} />
                      <span>Смогу прийти</span>
                    </button>

                    <button
                      type="button"
                      disabled={attendanceLoading}
                      onClick={() => handleSetAttendance('not_going')}
                      className={`py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        attendanceStatus === 'not_going'
                          ? 'bg-red-600 text-white border-2 border-red-500 shadow-lg shadow-red-600/20'
                          : 'bg-neutral-950 hover:bg-neutral-800 text-white border border-neutral-800'
                      }`}
                    >
                      <X className="w-4 h-4 text-red-500" />
                      <span>Не смогу прийти</span>
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        );
      })()}

      {/* 2. НОВОСТИ */}
      {activeTab === 'news' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Newspaper className="w-4 h-4" />
              <span>Новости студии ARVESTI</span>
            </h2>
          </div>

          <div className="space-y-3">
            {news.map((item) => (
              <article key={item.id} className="p-4 rounded-3xl border border-neutral-800 bg-neutral-900/80 text-xs space-y-2">
                <h3 className="font-bold text-white text-sm">{item.title}</h3>
                <p className="text-neutral-300 leading-relaxed whitespace-pre-line">{item.content}</p>
                <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-1 border-t border-neutral-800/60">
                  <span>{item.author || 'Линда Азизян'}</span>
                  <span>{item.date}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* 3. ПРАВИЛА */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-neutral-800">
            <BookOpen className="w-4 h-4" />
            <span>Правила студии танцев ARVESTI</span>
          </h2>
          <div className="space-y-3 text-xs">
            {rules.map((section) => (
              <div key={section.id} className="p-4 rounded-3xl border border-neutral-800 bg-neutral-900/80 space-y-2.5">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  <span>{section.title}</span>
                </h3>
                <ul className="space-y-2 text-neutral-300 pl-1">
                  {section.items.map((it, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-neutral-500 font-mono text-[11px] mt-0.5">•</span>
                      <span className="leading-relaxed">{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. МОЙ АККАУНТ */}
      {activeTab === 'account' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-neutral-800">
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
                <span className="font-bold text-white">{group?.schedule} • {group?.time}</span>
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

      {/* НИЖНЯЯ СТРОКА: 4 РАЗДЕЛА */}
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
