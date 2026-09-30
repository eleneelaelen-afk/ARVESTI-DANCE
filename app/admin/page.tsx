'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  Users,
  CalendarCheck,
  Trash2,
  Check,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  AlertOctagon,
  LogOut,
  Send,
  Edit3,
  Lock,
  Bell,
  Settings,
  MapPin,
  Save,
  MessageCircle,
  Clock,
  UserCheck,
  BarChart3,
} from 'lucide-react';
import { ProfileRow, NewsRow, AppNotificationRow, StudioRuleSection } from '@/types/database';

export default function AdminPage() {
  const supabase = createClient();

  const [isAdminAuthorized, setIsAdminAuthorized] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // 5 разделов панели администратора
  const [activeSection, setActiveSection] = useState<'attendance' | 'students' | 'notifications' | 'requests' | 'settings'>('attendance');

  const [students, setStudents] = useState<ProfileRow[]>([]);
  const [news, setNews] = useState<NewsRow[]>([]);
  const [notifications, setNotifications] = useState<AppNotificationRow[]>([]);
  const [rules, setRules] = useState<StudioRuleSection[]>([]);
  const [loading, setLoading] = useState(true);

  // Настройки студии
  const [studioAddress, setStudioAddress] = useState('ТРЦ «Арбат», Октябрьская ул., 17, Пятигорск');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Расписание групп
  const [groups, setGroups] = useState([
    { id: 'grp-1', name: 'ARVESTI 1.0', age_category: 'Старшая', schedule: 'Четверг, Суббота', time: 'Чт — 19:00, Сб — 16:30' },
    { id: 'grp-2', name: 'ARVESTI 2.0', age_category: 'Старшая', schedule: 'Суббота и Воскресенье', time: '15:00' },
    { id: 'grp-3', name: 'ARVESTI 3.0', age_category: 'Младшая', schedule: 'Суббота и Воскресенье', time: '14:00' },
    { id: 'grp-4', name: 'ARVESTI 4.0', age_category: 'Младшая', schedule: 'Суббота и Воскресенье', time: '13:00' },
  ]);

  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [attendanceGroupId, setAttendanceGroupId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Уведомления
  const [notifTarget, setNotifTarget] = useState('all');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState<'reminder' | 'schedule' | 'urgent' | 'announcement'>('reminder');
  const [notifSentSuccess, setNotifSentSuccess] = useState('');

  // Персональное сообщение
  const [personalMsgStudent, setPersonalMsgStudent] = useState<ProfileRow | null>(null);
  const [personalMsgText, setPersonalMsgText] = useState('');

  // Модальные окна
  const [editingStudent, setEditingStudent] = useState<ProfileRow | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<ProfileRow | null>(null);

  // Фильтр посещаемости
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'going' | 'not_going' | 'unconfirmed'>('all');

  // Модальное окно отмены занятия
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelGroup, setCancelGroup] = useState('all');
  const [cancelDate, setCancelDate] = useState('Ближайшее занятие');
  const [cancelReason, setCancelReason] = useState('Болезнь педагога. Будет обязательно назначена отработка!');
  const [cancelNotice, setCancelNotice] = useState('');

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

  const fetchData = async () => {
    try {
      const savedAddress = typeof window !== 'undefined' ? localStorage.getItem('arvesti_studio_address') : null;
      if (savedAddress) setStudioAddress(savedAddress);

      const savedGroups = typeof window !== 'undefined' ? localStorage.getItem('arvesti_groups_schedule') : null;
      if (savedGroups) {
        try { setGroups(JSON.parse(savedGroups)); } catch {}
      }

      const [studentsRes, newsRes, notifsRes, rulesRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('news').select('*').order('created_at', { ascending: false }),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }),
        supabase.from('studio_rules').select('*').order('sort_order', { ascending: true }),
      ]);

      if (studentsRes.data) setStudents(studentsRes.data as ProfileRow[]);
      if (newsRes.data) setNews(newsRes.data as NewsRow[]);
      if (notifsRes.data) setNotifications(notifsRes.data as AppNotificationRow[]);
      if (rulesRes.data && rulesRes.data.length > 0) {
        setRules(rulesRes.data as StudioRuleSection[]);
      } else {
        setRules(defaultRules);
      }
    } catch (err: any) {
      console.warn('Ошибка загрузки:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const isAuth = typeof window !== 'undefined' && localStorage.getItem('arvesti_admin_authorized') === 'true';
    if (isAuth) {
      setIsAdminAuthorized(true);
      fetchData();
    } else {
      setLoading(false);
    }
  }, []);

  const handleVerifyAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    const pass = adminPasswordInput.trim();
    if (pass === 'ArvestiAdmin2026!' || pass === 'admin123456' || pass === 'admin') {
      if (typeof window !== 'undefined') {
        localStorage.setItem('arvesti_admin_authorized', 'true');
      }
      setIsAdminAuthorized(true);
      setAuthError('');
      fetchData();
    } else {
      setAuthError('Неверный пароль администратора студии.');
    }
  };

  const handleApproveStudent = async (studentId: string) => {
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, status: 'active' as const } : s)));
    try {
      await supabase.from('profiles').update({ status: 'active' }).eq('id', studentId);
    } catch {}
  };

  const handleConfirmDeleteStudent = async () => {
    if (!studentToDelete) return;
    const idToDelete = studentToDelete.id;
    setStudents((prev) => prev.filter((s) => s.id !== idToDelete));
    if (editingStudent?.id === idToDelete) setEditingStudent(null);
    setStudentToDelete(null);
    try {
      await supabase.from('profiles').delete().eq('id', idToDelete);
    } catch {}
  };

  const handleTogglePayment = async (studentId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'paid' ? 'overdue' : 'paid';
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, payment_status: nextStatus as any } : s)));
    try {
      await supabase.from('profiles').update({ payment_status: nextStatus }).eq('id', studentId);
    } catch {}
  };

  const handleSaveStudentEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setStudents((prev) => prev.map((s) => (s.id === editingStudent.id ? editingStudent : s)));
    try {
      await supabase.from('profiles').update({
        full_name: editingStudent.full_name,
        group_id: editingStudent.group_id,
        phone: editingStudent.phone,
        username: editingStudent.username,
        payment_status: editingStudent.payment_status,
        payment_due_date: editingStudent.payment_due_date,
      }).eq('id', editingStudent.id);
      setCancelNotice(`Данные ученицы ${editingStudent.full_name} успешно обновлены!`);
      setTimeout(() => setCancelNotice(''), 4000);
    } catch (err: any) {
      alert('Ошибка сохранения: ' + err.message);
    }
    setEditingStudent(null);
  };

  const handleCancelLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    const grp = groups.find((g) => g.id === cancelGroup);
    const targetTitle = cancelGroup === 'all' ? 'Все группы' : grp?.name || cancelGroup;

    const notif: any = {
      id: 'notif-' + Date.now(),
      target_group_id: cancelGroup,
      target_student_id: null,
      title: '🚨 ВНИМАНИЕ: ЗАНЯТИЕ ОТМЕНЕНО!',
      message: `Занятие (${targetTitle}, ${cancelDate}) отменено! Причина: ${cancelReason}. Студия ARVESTI гарантирует проведение отработки!`,
      type: 'urgent',
      created_at: new Date().toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
    };

    const newsPost: NewsRow = {
      id: 'news-' + Date.now(),
      title: `🚨 Отмена занятия (${targetTitle}, ${cancelDate})`,
      content: `Уважаемые ученицы и родители!\n\nЗанятие (${targetTitle}, ${cancelDate}) отменено преподавателем.\nПричина: ${cancelReason}\n\nПо правилам студии ARVESTI пропущенное занятие будет обязательно отработано. Дату и время педагог Линда Азизян сообщит дополнительно.`,
      category: 'schedule_change',
      pinned: true,
      author: 'Линда Азизян',
      date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
    };

    try {
      await Promise.all([
        supabase.from('notifications').insert([notif]),
        supabase.from('news').insert([newsPost]),
      ]);
      setNotifications((prev) => [notif, ...prev]);
      setNews((prev) => [newsPost, ...prev]);
      setIsCancelModalOpen(false);
      setCancelNotice('Занятие успешно отменено! Срочное Push-уведомление и новость опубликованы.');
      setTimeout(() => setCancelNotice(''), 5000);
    } catch (err: any) {
      alert('Ошибка отмены: ' + err.message);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;

    let targetGroupId = 'all';
    let targetStudentId: string | null = null;

    if (notifTarget.startsWith('student:')) {
      targetStudentId = notifTarget.replace('student:', '');
      const st = students.find((s) => s.id === targetStudentId);
      targetGroupId = st?.group_id || 'all';
    } else {
      targetGroupId = notifTarget;
    }

    const newNotif: any = {
      id: 'notif-' + Date.now(),
      target_group_id: targetGroupId,
      target_student_id: targetStudentId,
      title: notifTitle.trim(),
      message: notifMessage.trim(),
      type: notifType,
      created_at: new Date().toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
    };

    setNotifications([newNotif, ...notifications]);
    setNotifTitle('');
    setNotifMessage('');
    setNotifSentSuccess(targetStudentId ? 'Личное сообщение отправлено ученице!' : 'Уведомление отправлено!');
    setTimeout(() => setNotifSentSuccess(''), 4000);

    try {
      await supabase.from('notifications').insert([newNotif]);
    } catch {}
  };

  const handleSendQuickPersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personalMsgStudent || !personalMsgText.trim()) return;

    const newNotif: any = {
      id: 'notif-' + Date.now(),
      target_group_id: personalMsgStudent.group_id || 'all',
      target_student_id: personalMsgStudent.id,
      title: 'Личное сообщение от Линды Азизян',
      message: personalMsgText.trim(),
      type: 'reminder',
      created_at: new Date().toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
    };

    setNotifications([newNotif, ...notifications]);
    setPersonalMsgStudent(null);
    setPersonalMsgText('');
    setCancelNotice(`Личное сообщение отправлено ученице ${personalMsgStudent.full_name}!`);
    setTimeout(() => setCancelNotice(''), 4000);

    try {
      await supabase.from('notifications').insert([newNotif]);
    } catch {}
  };

  const handleSaveSettings = async () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('arvesti_studio_address', studioAddress);
      localStorage.setItem('arvesti_groups_schedule', JSON.stringify(groups));
    }

    try {
      for (const section of rules) {
        await supabase.from('studio_rules').upsert({
          id: section.id,
          title: section.title,
          items: section.items,
          sort_order: section.sort_order,
        });
      }
    } catch {}

    setSettingsSuccess('Настройки (адрес, расписание и правила) успешно сохранены!');
    setTimeout(() => setSettingsSuccess(''), 4000);
  };

  const pendingRequests = useMemo(() => students.filter((s) => s.status === 'pending'), [students]);
  const activeStudents = useMemo(() => students.filter((s) => s.status === 'active'), [students]);

  const groupStudents = useMemo(() => {
    let list = activeStudents;
    if (selectedGroupId !== 'all') list = list.filter((s) => s.group_id === selectedGroupId);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((s) => s.full_name.toLowerCase().includes(q) || s.phone.includes(q) || s.username?.toLowerCase().includes(q));
    }
    return list;
  }, [activeStudents, selectedGroupId, searchQuery]);

  const attendanceStudents = useMemo(() => {
    if (attendanceGroupId === 'all') return activeStudents;
    return activeStudents.filter((s) => s.group_id === attendanceGroupId);
  }, [activeStudents, attendanceGroupId]);

  const goingStudents = useMemo(
    () => attendanceStudents.filter((s) => s.attendance_status === 'going' || s.notes?.includes('Смогу прийти') || s.notes?.includes('Будет на занятии')),
    [attendanceStudents]
  );
  const notGoingStudents = useMemo(
    () => attendanceStudents.filter((s) => s.attendance_status === 'not_going' || s.notes?.includes('Не смогу прийти') || s.notes?.includes('Не сможет')),
    [attendanceStudents]
  );
  const unconfirmedStudents = useMemo(
    () => attendanceStudents.filter((s) => !goingStudents.includes(s) && !notGoingStudents.includes(s)),
    [attendanceStudents, goingStudents, notGoingStudents]
  );

  const filteredAttendanceStudents = useMemo(() => {
    if (attendanceFilter === 'going') return goingStudents;
    if (attendanceFilter === 'not_going') return notGoingStudents;
    if (attendanceFilter === 'unconfirmed') return unconfirmedStudents;
    return attendanceStudents;
  }, [attendanceFilter, goingStudents, notGoingStudents, unconfirmedStudents, attendanceStudents]);

  if (loading) {
    return <div className="py-20 text-center text-xs text-neutral-400">Загрузка панели руководителя...</div>;
  }

  if (!isAdminAuthorized) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-3xl border border-neutral-800 bg-neutral-900/90 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-white/10 flex items-center justify-center text-white">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-white">Панель руководителя ARVESTI</h2>
          <p className="text-xs text-neutral-400">Введите пароль руководителя</p>
        </div>

        {authError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleVerifyAdmin} className="space-y-4 text-xs">
          <div>
            <label className="block text-neutral-300 font-semibold mb-1">Пароль</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={adminPasswordInput}
              onChange={(e) => setAdminPasswordInput(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-white"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-neutral-200 text-black font-extrabold text-xs transition-all shadow cursor-pointer"
          >
            Войти
          </button>
        </form>

        <div className="text-center pt-2">
          <Link href="/" className="text-xs text-neutral-500 hover:text-white transition-colors">
            ← На главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 max-w-lg mx-auto">
      {/* Шапка админки (БЕЗ кнопки "В вид учениц") */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3 pt-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center font-black text-sm shadow">
            AR
          </div>
          <div>
            <h1 className="text-sm font-black text-white leading-tight">Кабинет руководителя ARVESTI</h1>
            <p className="text-[10px] text-neutral-400">Линда Азизян • Управление студией</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              localStorage.removeItem('arvesti_admin_authorized');
              setIsAdminAuthorized(false);
              window.location.href = '/';
            }}
            className="p-1.5 rounded-lg bg-red-600/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-1.5 cursor-pointer"
            title="Выйти из кабинета руководителя"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-[11px] font-semibold">Выйти</span>
          </button>
        </div>
      </div>

      {cancelNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{cancelNotice}</span>
        </div>
      )}

      {/* Навигация по 5 разделам */}
      <div className="grid grid-cols-5 gap-1 p-1 bg-neutral-900/90 rounded-2xl border border-neutral-800 text-center">
        <button
          onClick={() => setActiveSection('attendance')}
          className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
            activeSection === 'attendance' ? 'bg-white text-black shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Журнал
        </button>
        <button
          onClick={() => setActiveSection('students')}
          className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
            activeSection === 'students' ? 'bg-white text-black shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Ученицы
        </button>
        <button
          onClick={() => setActiveSection('notifications')}
          className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
            activeSection === 'notifications' ? 'bg-white text-black shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Push
        </button>
        <button
          onClick={() => setActiveSection('requests')}
          className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all relative cursor-pointer ${
            activeSection === 'requests' ? 'bg-white text-black shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Заявки
          {pendingRequests.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500" />
          )}
        </button>
        <button
          onClick={() => setActiveSection('settings')}
          className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
            activeSection === 'settings' ? 'bg-white text-black shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Инфо
        </button>
      </div>

      {/* 1. ПОСЕЩАЕМОСТЬ С ГРАФИКАМИ ПО ГРУППАМ */}
      {activeSection === 'attendance' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl border border-neutral-800 bg-neutral-900/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-emerald-400" />
                  <span>Журнал посещаемости</span>
                </h2>
                <p className="text-[11px] text-neutral-400">Ответы учениц на ближайший урок</p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={attendanceGroupId}
                  onChange={(e) => setAttendanceGroupId(e.target.value)}
                  className="bg-neutral-950 border border-neutral-800 rounded-xl py-1 px-2.5 text-xs text-white cursor-pointer"
                >
                  <option value="all">Все группы</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    setCancelGroup(attendanceGroupId);
                    setIsCancelModalOpen(true);
                  }}
                  className="py-1 px-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-400 text-xs font-bold flex items-center gap-1 cursor-pointer shadow"
                >
                  <AlertOctagon className="w-3.5 h-3.5" />
                  <span>Отменить урок</span>
                </button>
              </div>
            </div>

            {/* 3 Счётчика ответов */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <button
                type="button"
                onClick={() => setAttendanceFilter('going')}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  attendanceFilter === 'going' ? 'bg-emerald-500/25 border-emerald-400 shadow' : 'bg-emerald-500/10 border-emerald-500/30'
                }`}
              >
                <p className="text-2xl font-black text-emerald-400">{goingStudents.length}</p>
                <p className="text-[11px] font-bold text-emerald-300 mt-0.5">Смогут прийти</p>
              </button>

              <button
                type="button"
                onClick={() => setAttendanceFilter('not_going')}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  attendanceFilter === 'not_going' ? 'bg-red-500/25 border-red-400 shadow' : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <p className="text-2xl font-black text-red-400">{notGoingStudents.length}</p>
                <p className="text-[11px] font-bold text-red-300 mt-0.5">Не смогут</p>
              </button>

              <button
                type="button"
                onClick={() => setAttendanceFilter('unconfirmed')}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  attendanceFilter === 'unconfirmed' ? 'bg-neutral-800 border-neutral-600 shadow' : 'bg-neutral-950 border-neutral-800'
                }`}
              >
                <p className="text-2xl font-black text-neutral-400">{unconfirmedStudents.length}</p>
                <p className="text-[11px] font-bold text-neutral-400 mt-0.5">Не ответили</p>
              </button>
            </div>

            {/* ВИЗУАЛИЗАЦИЯ: ГРАФИК ПОСЕЩАЕМОСТИ КАЖДОЙ ГРУППЫ */}
            <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800/90 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-amber-400" />
                  <span>График явки по группам студии</span>
                </h3>
                <span className="text-[10px] text-neutral-400">Нажмите для фильтра</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {groups.map((grp) => {
                  const grpStudents = activeStudents.filter((s) => s.group_id === grp.id);
                  const total = grpStudents.length;
                  const going = grpStudents.filter((s) => s.attendance_status === 'going' || s.notes?.includes('Смогу прийти') || s.notes?.includes('Будет на занятии')).length;
                  const notGoing = grpStudents.filter((s) => s.attendance_status === 'not_going' || s.notes?.includes('Не смогу прийти') || s.notes?.includes('Не сможет')).length;
                  const unconf = Math.max(0, total - going - notGoing);
                  const pct = total > 0 ? Math.round((going / total) * 100) : 0;
                  const isSelected = attendanceGroupId === grp.id;

                  return (
                    <button
                      key={grp.id}
                      type="button"
                      onClick={() => setAttendanceGroupId(isSelected ? 'all' : grp.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-neutral-900 border-white shadow-lg ring-1 ring-white/20'
                          : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-xs">{grp.name}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-950 border border-neutral-800 text-neutral-400">
                            {grp.age_category}
                          </span>
                        </div>
                        <span className={`text-xs font-black ${pct >= 75 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : 'text-neutral-400'}`}>
                          {total > 0 ? `${pct}%` : '—'}
                        </span>
                      </div>

                      <p className="text-[10px] text-neutral-400 mb-2 font-mono">{grp.time}</p>

                      {/* Сегментированная цветная полоса */}
                      <div className="w-full h-2 rounded-full bg-neutral-950 overflow-hidden flex gap-0.5">
                        {total > 0 ? (
                          <>
                            <div
                              style={{ width: `${(going / total) * 100}%` }}
                              className="bg-emerald-500 h-full transition-all"
                              title={`Смогут: ${going}`}
                            />
                            <div
                              style={{ width: `${(notGoing / total) * 100}%` }}
                              className="bg-red-500 h-full transition-all"
                              title={`Не смогут: ${notGoing}`}
                            />
                            <div
                              style={{ width: `${(unconf / total) * 100}%` }}
                              className="bg-neutral-700 h-full transition-all"
                              title={`Без ответа: ${unconf}`}
                            />
                          </>
                        ) : (
                          <div className="w-full bg-neutral-800 h-full" />
                        )}
                      </div>

                      {/* Подписи под полосой */}
                      <div className="flex items-center justify-between text-[9px] text-neutral-400 mt-2">
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Смогут: {going}
                        </span>
                        <span className="text-red-400 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          Пропуск: {notGoing}
                        </span>
                        <span className="text-neutral-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
                          Ждут: {unconf}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Фильтры списков */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
              <button
                type="button"
                onClick={() => setAttendanceFilter('all')}
                className={`py-1 px-2.5 rounded-xl font-bold cursor-pointer border ${
                  attendanceFilter === 'all' ? 'bg-white text-black border-white' : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                }`}
              >
                Все ({attendanceStudents.length})
              </button>
              <button
                type="button"
                onClick={() => setAttendanceFilter('going')}
                className={`py-1 px-2.5 rounded-xl font-bold cursor-pointer border ${
                  attendanceFilter === 'going' ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-neutral-950 border-emerald-500/30 text-emerald-400'
                }`}
              >
                Смогут ({goingStudents.length})
              </button>
              <button
                type="button"
                onClick={() => setAttendanceFilter('not_going')}
                className={`py-1 px-2.5 rounded-xl font-bold cursor-pointer border ${
                  attendanceFilter === 'not_going' ? 'bg-red-500 text-white border-red-500' : 'bg-neutral-950 border-red-500/30 text-red-400'
                }`}
              >
                Не смогут ({notGoingStudents.length})
              </button>
              <button
                type="button"
                onClick={() => setAttendanceFilter('unconfirmed')}
                className={`py-1 px-2.5 rounded-xl font-bold cursor-pointer border ${
                  attendanceFilter === 'unconfirmed' ? 'bg-neutral-700 text-white border-neutral-600' : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                }`}
              >
                Без ответа ({unconfirmedStudents.length})
              </button>
            </div>

            {/* Список учениц (БЕЗ кнопок «В зале» и «Пропуск», только списки и кнопка «Написать») */}
            <div className="divide-y divide-neutral-800 pt-2">
              {filteredAttendanceStudents.length === 0 ? (
                <p className="text-neutral-500 text-center py-6 text-xs">В этом списке пока нет учениц</p>
              ) : (
                filteredAttendanceStudents.map((st) => {
                  const isGoing = st.attendance_status === 'going' || st.notes?.includes('Смогу прийти') || st.notes?.includes('Будет на занятии');
                  const isNotGoing = st.attendance_status === 'not_going' || st.notes?.includes('Не смогу прийти') || st.notes?.includes('Не сможет');

                  return (
                    <div key={st.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isGoing ? 'bg-emerald-500 text-black' : isNotGoing ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-400'
                        }`}>
                          {st.full_name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-sm">{st.full_name}</span>
                            <span className="text-[10px] text-neutral-400 font-mono">{st.phone}</span>
                          </div>
                          {st.notes && <p className="text-[10px] text-neutral-400 mt-0.5">{st.notes}</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {isGoing ? (
                          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black">
                            Сможет прийти
                          </span>
                        ) : isNotGoing ? (
                          <span className="px-2.5 py-1 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-black">
                            Не сможет прийти
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl bg-neutral-800 text-neutral-400 text-[10px]">
                            Не ответила
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => { setPersonalMsgStudent(st); setPersonalMsgText(''); }}
                          title="Написать личное сообщение ученице"
                          className="p-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>Написать</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. УЧЕНИЦЫ */}
      {activeSection === 'students' && (
        <div className="p-5 rounded-3xl border border-neutral-800 bg-neutral-900/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Список учениц ({groupStudents.length})</span>
              </h2>
              <p className="text-[11px] text-neutral-400">Управление абонементами и составом</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Поиск по имени..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-xl py-1 px-2.5 text-xs text-white w-36"
              />
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-xl py-1 px-2 text-xs text-white cursor-pointer"
              >
                <option value="all">Все</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="divide-y divide-neutral-800">
            {groupStudents.map((std) => (
              <div key={std.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-bold text-white text-sm">{std.full_name}</span>
                  <p className="text-neutral-400 font-mono text-[11px]">{std.phone} • @{std.username}</p>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    onClick={() => handleTogglePayment(std.id, std.payment_status)}
                    className={`py-1 px-2.5 rounded-xl font-bold text-[10px] cursor-pointer border ${
                      std.payment_status === 'paid'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}
                  >
                    {std.payment_status === 'paid' ? 'Оплачено' : 'Долг'}
                  </button>

                  <button
                    onClick={() => setEditingStudent(std)}
                    className="p-1.5 rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
                    title="Редактировать"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setStudentToDelete(std)}
                    className="p-1.5 rounded-lg border border-red-500/30 bg-red-600/10 text-red-400 hover:bg-red-600/20 ml-3 cursor-pointer"
                    title="Удалить"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. УВЕДОМЛЕНИЯ (PUSH) */}
      {activeSection === 'notifications' && (
        <div className="p-5 rounded-3xl border border-neutral-800 bg-neutral-900/80 space-y-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <span>Отправить PUSH-уведомление</span>
            </h2>
            <p className="text-[11px] text-neutral-400">Общие объявления, группе или персонально ученице</p>
          </div>

          {notifSentSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{notifSentSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSendNotification} className="space-y-3 text-xs">
            <div>
              <label className="block text-neutral-300 font-semibold mb-1">Кому отправить</label>
              <select
                value={notifTarget}
                onChange={(e) => setNotifTarget(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 text-white cursor-pointer"
              >
                <option value="all">📢 Всем ученицам студии ARVESTI</option>
                <optgroup label="По группам">
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>Группа: {g.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Персонально ученице">
                  {activeStudents.map((s) => (
                    <option key={s.id} value={`student:${s.id}`}>👤 {s.full_name} ({s.phone})</option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-neutral-300 font-semibold mb-1">Заголовок</label>
              <input
                type="text"
                required
                placeholder="Например: Важная новость от педагога"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 text-white"
              />
            </div>

            <div>
              <label className="block text-neutral-300 font-semibold mb-1">Текст сообщения</label>
              <textarea
                required
                rows={3}
                placeholder="Введите текст сообщения..."
                value={notifMessage}
                onChange={(e) => setNotifMessage(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-white hover:bg-neutral-200 text-black font-extrabold flex items-center justify-center gap-2 shadow cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Отправить уведомление</span>
            </button>
          </form>
        </div>
      )}

      {/* 4. ЗАЯВКИ НА РЕГИСТРАЦИЮ */}
      {activeSection === 'requests' && (
        <div className="p-5 rounded-3xl border border-neutral-800 bg-neutral-900/80 space-y-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>Заявки на регистрацию ({pendingRequests.length})</span>
            </h2>
            <p className="text-[11px] text-neutral-400">Новые ученицы, ожидающие подтверждения</p>
          </div>

          {pendingRequests.length === 0 ? (
            <p className="text-neutral-500 text-center py-6 text-xs">Новых заявок пока нет</p>
          ) : (
            <div className="divide-y divide-neutral-800">
              {pendingRequests.map((req) => (
                <div key={req.id} className="py-3 flex items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-bold text-white text-sm">{req.full_name}</span>
                    <p className="text-neutral-400 font-mono text-[11px]">{req.phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveStudent(req.id)}
                      className="py-1 px-3 rounded-xl bg-emerald-500 text-black font-extrabold flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Принять</span>
                    </button>
                    <button
                      onClick={() => setStudentToDelete(req)}
                      className="p-1 rounded-lg bg-red-600/10 border border-red-500/30 text-red-400 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. НАСТРОЙКИ */}
      {activeSection === 'settings' && (
        <div className="p-5 rounded-3xl border border-neutral-800 bg-neutral-900/80 space-y-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span>Настройки и правила студии</span>
            </h2>
            <p className="text-[11px] text-neutral-400">Адрес, расписание и кодекс ARVESTI</p>
          </div>

          {settingsSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{settingsSuccess}</span>
            </div>
          )}

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-neutral-300 font-semibold mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-400" />
                <span>Адрес студии</span>
              </label>
              <input
                type="text"
                value={studioAddress}
                onChange={(e) => setStudioAddress(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 text-white"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-neutral-800">
              <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Расписание 4-х групп студии</span>
              </h3>
              {groups.map((grp, idx) => (
                <div key={grp.id} className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{grp.name} ({grp.age_category})</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={grp.schedule}
                      onChange={(e) => {
                        const copy = [...groups];
                        copy[idx].schedule = e.target.value;
                        setGroups(copy);
                      }}
                      className="bg-neutral-900 border border-neutral-800 rounded-lg p-1.5 text-neutral-300"
                      placeholder="Дни недели"
                    />
                    <input
                      type="text"
                      value={grp.time}
                      onChange={(e) => {
                        const copy = [...groups];
                        copy[idx].time = e.target.value;
                        setGroups(copy);
                      }}
                      className="bg-neutral-900 border border-neutral-800 rounded-lg p-1.5 text-neutral-300"
                      placeholder="Время"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSaveSettings}
              className="w-full py-3 rounded-xl bg-white hover:bg-neutral-200 text-black font-extrabold flex items-center justify-center gap-2 shadow cursor-pointer mt-4"
            >
              <Save className="w-4 h-4" />
              <span>Сохранить настройки студии</span>
            </button>
          </div>
        </div>
      )}

      {/* Модальное окно личного сообщения */}
      {personalMsgStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-3xl border border-neutral-800 bg-neutral-900 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-purple-400">
              <MessageCircle className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Личное сообщение для {personalMsgStudent.full_name}</h3>
            </div>
            <form onSubmit={handleSendQuickPersonal} className="space-y-3 text-xs">
              <textarea
                required
                rows={3}
                placeholder="Текст сообщения..."
                value={personalMsgText}
                onChange={(e) => setPersonalMsgText(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 text-white"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPersonalMsgStudent(null)}
                  className="py-2 px-4 rounded-xl border border-neutral-700 text-neutral-300 cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer"
                >
                  Отправить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования ученицы */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-3xl border border-neutral-800 bg-neutral-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <h3 className="text-base font-bold text-white">Редактирование ученицы</h3>
              <button onClick={() => setEditingStudent(null)} className="text-neutral-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentEdit} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1 font-semibold">ФИО</label>
                <input
                  type="text"
                  required
                  value={editingStudent.full_name}
                  onChange={(e) => setEditingStudent({ ...editingStudent, full_name: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-1.5 px-3 text-white"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 font-semibold">Группа</label>
                <select
                  value={editingStudent.group_id || 'grp-1'}
                  onChange={(e) => setEditingStudent({ ...editingStudent, group_id: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-1.5 px-2 text-white cursor-pointer"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-neutral-400 mb-1 font-semibold">Телефон</label>
                  <input
                    type="text"
                    value={editingStudent.phone}
                    onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-1.5 px-3 text-white"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1 font-semibold">Логин (@ник)</label>
                  <input
                    type="text"
                    value={editingStudent.username || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, username: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-1.5 px-3 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-neutral-400 mb-1 font-semibold">Статус оплаты</label>
                  <select
                    value={editingStudent.payment_status || 'paid'}
                    onChange={(e) => setEditingStudent({ ...editingStudent, payment_status: e.target.value as any })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-1.5 px-2 text-white cursor-pointer"
                  >
                    <option value="paid">Оплачен</option>
                    <option value="overdue">Долг</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1 font-semibold">Срок абонемента</label>
                  <input
                    type="text"
                    value={editingStudent.payment_due_date || 'до 31.10.2026'}
                    onChange={(e) => setEditingStudent({ ...editingStudent, payment_due_date: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-1.5 px-3 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="py-2 px-4 rounded-xl border border-neutral-700 text-neutral-300 font-semibold cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-white hover:bg-neutral-200 text-black font-black cursor-pointer shadow"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно подтверждения удаления ученицы */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm p-6 rounded-3xl border border-neutral-800 bg-neutral-900 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-red-600/20 text-red-400 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Удалить ученицу?</h3>
            <p className="text-xs text-neutral-400">
              Вы действительно хотите удалить {studentToDelete.full_name}? Это действие нельзя отменить.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="py-2 px-4 rounded-xl border border-neutral-700 text-xs text-neutral-300 cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteStudent}
                className="py-2 px-5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer shadow"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно отмены занятия */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-3xl border border-neutral-800 bg-neutral-900 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-red-500">
              <AlertOctagon className="w-6 h-6" />
              <div>
                <h3 className="text-base font-bold text-white">Срочная отмена занятия</h3>
                <p className="text-xs text-neutral-400">Мгновенный Push и новость на Главной</p>
              </div>
            </div>

            <form onSubmit={handleCancelLesson} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Группа</label>
                <select
                  value={cancelGroup}
                  onChange={(e) => setCancelGroup(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 text-white cursor-pointer"
                >
                  <option value="all">Все группы студии ARVESTI</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Дата и время</label>
                <input
                  type="text"
                  required
                  value={cancelDate}
                  onChange={(e) => setCancelDate(e.target.value)}
                  placeholder="Сегодня в 19:00"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 text-white"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Причина</label>
                <textarea
                  required
                  rows={2}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="py-2 px-4 rounded-xl border border-neutral-700 text-xs text-neutral-300 cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-lg cursor-pointer"
                >
                  Отменить и отправить PUSH
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
