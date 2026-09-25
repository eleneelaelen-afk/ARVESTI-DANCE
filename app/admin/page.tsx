'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  Users,
  UserPlus,
  CalendarCheck,
  Trash2,
  Check,
  X,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertOctagon,
  LogOut,
  Send,
  Newspaper,
  Phone,
  Clock,
  Edit3,
  Shield,
  Lock,
  Bell,
} from 'lucide-react';
import { ProfileRow, NewsRow, AppNotificationRow, StudioRuleSection } from '@/types/database';

export default function AdminPage() {
  const supabase = createClient();

  const [isAdminAuthorized, setIsAdminAuthorized] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  const [activeSection, setActiveSection] = useState<'attendance' | 'requests' | 'students' | 'news' | 'notifications'>('attendance');

  const [students, setStudents] = useState<ProfileRow[]>([]);
  const [news, setNews] = useState<NewsRow[]>([]);
  const [notifications, setNotifications] = useState<AppNotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [attendanceGroupId, setAttendanceGroupId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Форма новостей
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsPinned, setNewsPinned] = useState(false);

  // Форма уведомлений
  const [notifTargetGroup, setNotifTargetGroup] = useState('all');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState<'reminder' | 'schedule' | 'urgent' | 'announcement'>('reminder');
  const [notifSentSuccess, setNotifSentSuccess] = useState('');

  // Модальные окна
  const [editingStudent, setEditingStudent] = useState<ProfileRow | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<ProfileRow | null>(null);

  // Фильтр журнала посещаемости
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'going' | 'not_going' | 'unconfirmed'>('all');

  // Модальное окно срочной отмены занятия
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelGroup, setCancelGroup] = useState('all');
  const [cancelDate, setCancelDate] = useState('Ближайшее занятие');
  const [cancelReason, setCancelReason] = useState('Болезнь педагога. Будет обязательно назначена отработка!');
  const [cancelNotice, setCancelNotice] = useState('');

  const groups = [
    { id: 'grp-1', name: 'ARVESTI 1.0', age_category: 'Старшая', schedule: 'Чт/Сб 19:00' },
    { id: 'grp-2', name: 'ARVESTI 2.0', age_category: 'Старшая', schedule: 'Сб/Вс 17:00' },
    { id: 'grp-3', name: 'ARVESTI 3.0', age_category: 'Младшая', schedule: 'Сб/Вс 14:00' },
    { id: 'grp-4', name: 'ARVESTI 4.0', age_category: 'Младшая', schedule: 'Сб/Вс 15:30' },
  ];

  const fetchData = async () => {
    try {
      const [studentsRes, newsRes, notifsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('news').select('*').order('created_at', { ascending: false }),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }),
      ]);

      if (studentsRes.error || newsRes.error || notifsRes.error) {
        setDbError('Ошибка соединения с базой Supabase');
      } else {
        setDbError(null);
      }

      if (studentsRes.data) setStudents(studentsRes.data as ProfileRow[]);
      if (newsRes.data) setNews(newsRes.data as NewsRow[]);
      if (notifsRes.data) setNotifications(notifsRes.data as AppNotificationRow[]);
    } catch (err: any) {
      setDbError(err?.message || 'Ошибка соединения');
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
      await supabase.from('profiles').update(editingStudent).eq('id', editingStudent.id);
    } catch {}
    setEditingStudent(null);
  };

  const handleCancelLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    const grp = groups.find((g) => g.id === cancelGroup);
    const targetTitle = cancelGroup === 'all' ? 'Все группы' : grp?.name || cancelGroup;

    const notif: AppNotificationRow = {
      id: 'notif-' + Date.now(),
      target_group_id: cancelGroup,
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

  const handleMarkActualAttendance = async (studentId: string, isPresent: boolean) => {
    const timeStr = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const markNote = isPresent ? `Была в зале (${timeStr})` : `Пропуск (${timeStr})`;

    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, notes: markNote } : s))
    );

    try {
      await supabase.from('profiles').update({ notes: markNote }).eq('id', studentId);
      await supabase.from('attendance').upsert({
        id: `att-${studentId}`,
        student_id: studentId,
        status: isPresent ? 'going' : 'not_going',
        actual_present: isPresent,
        confirmed_at: new Date().toISOString(),
      });
    } catch {}
  };

  const applyNotifTemplate = (templateType: 'cancellation' | 'reschedule' | 'payment' | 'event') => {
    if (templateType === 'cancellation') {
      setNotifType('urgent');
      setNotifTitle('🚨 Отмена сегодняшнего занятия');
      setNotifMessage('Внимание! Сегодняшнее занятие отменено. Будет назначена дата отработки!');
    } else if (templateType === 'reschedule') {
      setNotifType('schedule');
      setNotifTitle('⏰ Перенос времени тренировки');
      setNotifMessage('Обратите внимание: время занятия перенесено. Ждем всех вовремя!');
    } else if (templateType === 'payment') {
      setNotifType('reminder');
      setNotifTitle('💳 Оплата абонемента на следующий месяц');
      setNotifMessage('Напоминаем: оплата абонементов производится с 27 числа до конца месяца для сохранения места в группе.');
    } else if (templateType === 'event') {
      setNotifType('announcement');
      setNotifTitle('🎉 Открытый урок и съемка танца');
      setNotifMessage('В субботу состоится съемка хореографии! Просьба быть в танцевальной форме и без опозданий.');
    }
  };

  const handleAddNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle.trim() || !newsContent.trim()) return;

    const newPost: NewsRow = {
      id: 'news-' + Date.now(),
      title: newsTitle.trim(),
      content: newsContent.trim(),
      category: 'announcement',
      pinned: newsPinned,
      author: 'Линда Азизян',
      date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
    };

    await supabase.from('news').insert([newPost]);
    setNews([newPost, ...news]);
    setNewsTitle('');
    setNewsContent('');
    setNewsPinned(false);
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;

    const newNotif: AppNotificationRow = {
      id: 'notif-' + Date.now(),
      target_group_id: notifTargetGroup,
      title: notifTitle.trim(),
      message: notifMessage.trim(),
      type: notifType,
      created_at: new Date().toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
    };

    setNotifications([newNotif, ...notifications]);
    setNotifTitle('');
    setNotifMessage('');
    setNotifSentSuccess('Уведомление отправлено ученицам!');
    setTimeout(() => setNotifSentSuccess(''), 4000);

    try {
      await supabase.from('notifications').insert([newNotif]);
    } catch {}
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
    () => attendanceStudents.filter((s) => s.attendance_status === 'going' || s.notes?.includes('Будет на занятии')),
    [attendanceStudents]
  );
  const notGoingStudents = useMemo(
    () => attendanceStudents.filter((s) => s.attendance_status === 'not_going' || s.notes?.includes('Не сможет')),
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
    <div className="space-y-6 pb-12">
      {/* Шапка админки */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-white" />
            <h1 className="text-xl font-black text-white">Кабинет руководителя ARVESTI</h1>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">Линда Азизян • Журнал посещаемости и управление</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="py-1.5 px-3.5 rounded-xl border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-semibold"
          >
            В вид учениц
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem('arvesti_admin_authorized');
              setIsAdminAuthorized(false);
            }}
            className="py-1.5 px-3 rounded-xl bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Выйти</span>
          </button>
        </div>
      </div>

      {/* Вкладки */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs font-semibold">
        <button
          onClick={() => setActiveSection('attendance')}
          className={`py-2 px-3.5 rounded-xl font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
            activeSection === 'attendance'
              ? 'bg-white text-black border-white shadow'
              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
          }`}
        >
          <CalendarCheck className="w-3.5 h-3.5" />
          <span>Посещаемость (журнал)</span>
          {goingStudents.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white font-bold text-[10px]">
              {goingStudents.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSection('requests')}
          className={`py-2 px-3.5 rounded-xl font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
            activeSection === 'requests'
              ? 'bg-white text-black border-white shadow'
              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Заявки</span>
          {pendingRequests.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white font-bold text-[10px] animate-pulse">
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSection('students')}
          className={`py-2 px-3.5 rounded-xl font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
            activeSection === 'students'
              ? 'bg-white text-black border-white shadow'
              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Ученицы ({activeStudents.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('news')}
          className={`py-2 px-3.5 rounded-xl font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
            activeSection === 'news'
              ? 'bg-white text-black border-white shadow'
              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
          }`}
        >
          <Newspaper className="w-3.5 h-3.5" />
          <span>Новости</span>
        </button>

        <button
          onClick={() => setActiveSection('notifications')}
          className={`py-2 px-3.5 rounded-xl font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
            activeSection === 'notifications'
              ? 'bg-white text-black border-white shadow'
              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Push-уведомления</span>
        </button>
      </div>

      {/* 1. ПОСЕЩАЕМОСТЬ */}
      {activeSection === 'attendance' && (
        <div className="space-y-5">
          {cancelNotice && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{cancelNotice}</span>
            </div>
          )}

          <div className="p-5 rounded-3xl border border-neutral-800 bg-neutral-900/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-emerald-400" />
                  <span>Журнал посещаемости: кто придет на урок</span>
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Отметки учениц со смартфонов («Смогу» / «Не смогу») и факт в зале
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={attendanceGroupId}
                  onChange={(e) => setAttendanceGroupId(e.target.value)}
                  className="bg-neutral-950 border border-neutral-800 rounded-xl py-1.5 px-3 text-xs text-white cursor-pointer"
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
                  className="py-1.5 px-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-400 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <AlertOctagon className="w-4 h-4" />
                  <span>🚨 Отменить занятие</span>
                </button>
              </div>
            </div>

            {/* 3 Счётчика ответов */}
            <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
              <button
                type="button"
                onClick={() => setAttendanceFilter('going')}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  attendanceFilter === 'going'
                    ? 'bg-emerald-500/25 border-emerald-400 shadow'
                    : 'bg-emerald-500/10 border-emerald-500/30'
                }`}
              >
                <p className="text-2xl font-black text-emerald-400">{goingStudents.length}</p>
                <p className="text-[11px] font-bold text-emerald-300 mt-0.5">Будут («Смогу»)</p>
              </button>

              <button
                type="button"
                onClick={() => setAttendanceFilter('not_going')}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  attendanceFilter === 'not_going'
                    ? 'bg-red-500/25 border-red-400 shadow'
                    : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <p className="text-2xl font-black text-red-400">{notGoingStudents.length}</p>
                <p className="text-[11px] font-bold text-red-300 mt-0.5">Не смогут</p>
              </button>

              <button
                type="button"
                onClick={() => setAttendanceFilter('unconfirmed')}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  attendanceFilter === 'unconfirmed'
                    ? 'bg-neutral-800 border-neutral-600 shadow'
                    : 'bg-neutral-950 border-neutral-800'
                }`}
              >
                <p className="text-2xl font-black text-neutral-400">{unconfirmedStudents.length}</p>
                <p className="text-[11px] font-bold text-neutral-400 mt-0.5">Не ответили</p>
              </button>
            </div>

            {/* Фильтры */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
              <button
                onClick={() => setAttendanceFilter('all')}
                className={`py-1 px-3 rounded-xl font-bold cursor-pointer border ${
                  attendanceFilter === 'all' ? 'bg-white text-black border-white' : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                }`}
              >
                Все ({attendanceStudents.length})
              </button>
              <button
                onClick={() => setAttendanceFilter('going')}
                className={`py-1 px-3 rounded-xl font-bold cursor-pointer border ${
                  attendanceFilter === 'going' ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-neutral-950 border-emerald-500/30 text-emerald-400'
                }`}
              >
                Будут ({goingStudents.length})
              </button>
              <button
                onClick={() => setAttendanceFilter('not_going')}
                className={`py-1 px-3 rounded-xl font-bold cursor-pointer border ${
                  attendanceFilter === 'not_going' ? 'bg-red-500 text-white border-red-500' : 'bg-neutral-950 border-red-500/30 text-red-400'
                }`}
              >
                Не смогут ({notGoingStudents.length})
              </button>
              <button
                onClick={() => setAttendanceFilter('unconfirmed')}
                className={`py-1 px-3 rounded-xl font-bold cursor-pointer border ${
                  attendanceFilter === 'unconfirmed' ? 'bg-neutral-700 text-white border-neutral-600' : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                }`}
              >
                Без ответа ({unconfirmedStudents.length})
              </button>
            </div>

            {/* Список учениц */}
            <div className="divide-y divide-neutral-800 pt-2">
              {filteredAttendanceStudents.map((st) => {
                const isGoing = st.attendance_status === 'going' || st.notes?.includes('Будет на занятии');
                const isNotGoing = st.attendance_status === 'not_going' || st.notes?.includes('Не сможет');
                const wasInHall = st.notes?.includes('Была в зале');

                return (
                  <div key={st.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isGoing ? 'bg-emerald-500 text-black' : isNotGoing ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-400'
                      }`}>
                        {st.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{st.full_name}</span>
                          <span className="text-[10px] text-neutral-500 font-mono">{st.phone}</span>
                        </div>
                        {st.notes && <p className="text-[10px] text-neutral-400">{st.notes}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {isGoing ? (
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                          Будет на уроке
                        </span>
                      ) : isNotGoing ? (
                        <span className="px-2.5 py-1 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 text-[11px] font-bold">
                          Не сможет
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl bg-neutral-800 text-neutral-400 text-[11px]">
                          Не ответила
                        </span>
                      )}

                      {/* Отметки присутствия в зале */}
                      <div className="flex items-center gap-1 pl-2 border-l border-neutral-800">
                        <button
                          type="button"
                          onClick={() => handleMarkActualAttendance(st.id, true)}
                          title="Была в зале"
                          className={`py-1 px-2 rounded-lg font-bold text-[10px] flex items-center gap-1 cursor-pointer border ${
                            wasInHall ? 'bg-emerald-500 text-black border-emerald-400' : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                          <span>В зале</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMarkActualAttendance(st.id, false)}
                          title="Пропуск"
                          className={`py-1 px-2 rounded-lg font-bold text-[10px] flex items-center gap-1 cursor-pointer border ${
                            st.notes?.includes('Пропуск') ? 'bg-red-600 text-white border-red-500' : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                          }`}
                        >
                          <X className="w-3 h-3" />
                          <span>Пропуск</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Модальное окно отмены занятия */}
          {isCancelModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
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

                    <div className="flex flex-wrap gap-1.5 pt-2">
                      <button
                        type="button"
                        onClick={() => setCancelReason('Болезнь педагога. Будет обязательно назначена отработка!')}
                        className="py-1 px-2 rounded-lg bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-300 hover:text-white"
                      >
                        Болезнь педагога
                      </button>
                      <button
                        type="button"
                        onClick={() => setCancelReason('Технические работы в ТРЦ «Арбат». Отработка гарантирована!')}
                        className="py-1 px-2 rounded-lg bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-300 hover:text-white"
                      >
                        Ремонт в ТРЦ
                      </button>
                      <button
                        type="button"
                        onClick={() => setCancelReason('Праздничный день. Назначена дополнительная дата занятия.')}
                        className="py-1 px-2 rounded-lg bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-300 hover:text-white"
                      >
                        Праздник
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCancelModalOpen(false)}
                      className="py-2 px-4 rounded-xl border border-neutral-700 text-xs text-neutral-300"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="py-2 px-5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-lg"
                    >
                      Отменить и отправить PUSH
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. ЗАЯВКИ */}
      {activeSection === 'requests' && (
        <div className="p-5 rounded-3xl border border-neutral-800 bg-neutral-900/80 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              <span>Новые заявки на регистрацию</span>
            </h2>
            <span className="text-xs text-neutral-400">{pendingRequests.length} ожидают</span>
          </div>

          {pendingRequests.length === 0 ? (
            <p className="text-xs text-neutral-400 py-8 text-center">Новых заявок на регистрацию нет.</p>
          ) : (
            <div className="divide-y divide-neutral-800">
              {pendingRequests.map((st) => (
                <div key={st.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <h3 className="font-bold text-white text-sm">{st.full_name}</h3>
                    <p className="text-neutral-400 font-mono">@{st.username} • {st.phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveStudent(st.id)}
                      className="py-1.5 px-3.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Принять</span>
                    </button>
                    <button
                      onClick={() => setStudentToDelete(st)}
                      className="py-1.5 px-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold cursor-pointer"
                    >
                      Отклонить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. УЧЕНИЦЫ */}
      {activeSection === 'students' && (
        <div className="p-5 rounded-3xl border border-neutral-800 bg-neutral-900/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Список учениц ({groupStudents.length})</span>
            </h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Поиск по имени..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-xl py-1 px-3 text-xs text-white"
              />
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-xl py-1 px-2.5 text-xs text-white"
              >
                <option value="all">Все группы</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="divide-y divide-neutral-800">
            {groupStudents.map((std) => (
              <div key={std.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                <div>
                  <span className="font-bold text-white text-sm">{std.full_name}</span>
                  <p className="text-neutral-400 font-mono text-[11px]">{std.phone} • @{std.username}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTogglePayment(std.id, std.payment_status)}
                    className={`py-1 px-2.5 rounded-xl border font-bold text-[11px] cursor-pointer ${
                      std.payment_status === 'paid'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-red-500/10 text-red-400 border-red-500/30'
                    }`}
                  >
                    {std.payment_status === 'paid' ? 'Оплачен' : 'Долг'}
                  </button>
                  <button
                    onClick={() => setEditingStudent(std)}
                    className="p-1 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setStudentToDelete(std)}
                    className="p-1 rounded-lg border border-neutral-800 text-neutral-400 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. НОВОСТИ */}
      {activeSection === 'news' && (
        <div className="space-y-5">
          <div className="p-5 rounded-3xl border border-neutral-800 bg-neutral-900/80 space-y-3 text-xs">
            <h2 className="text-base font-bold text-white">Опубликовать новость</h2>
            <form onSubmit={handleAddNews} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Заголовок новости"
                value={newsTitle}
                onChange={(e) => setNewsTitle(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 text-white"
              />
              <textarea
                required
                rows={3}
                placeholder="Текст новости..."
                value={newsContent}
                onChange={(e) => setNewsContent(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 text-white"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newsPinned}
                    onChange={(e) => setNewsPinned(e.target.checked)}
                  />
                  <span>Закрепить вверху</span>
                </label>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs cursor-pointer shadow"
                >
                  Опубликовать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. PUSH-УВЕДОМЛЕНИЯ */}
      {activeSection === 'notifications' && (
        <div className="p-5 rounded-3xl border border-neutral-800 bg-neutral-900/80 space-y-4 text-xs">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span>Отправить Push-уведомление</span>
          </h2>

          {notifSentSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{notifSentSuccess}</span>
            </div>
          )}

          {/* Быстрые 4 шаблона в 1 клик */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-neutral-400">Шаблоны в 1 клик:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => applyNotifTemplate('cancellation')}
                className="p-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-left cursor-pointer"
              >
                <p className="font-bold">🚨 Отмена урока</p>
              </button>
              <button
                type="button"
                onClick={() => applyNotifTemplate('reschedule')}
                className="p-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-left cursor-pointer"
              >
                <p className="font-bold">⏰ Перенос времени</p>
              </button>
              <button
                type="button"
                onClick={() => applyNotifTemplate('payment')}
                className="p-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-left cursor-pointer"
              >
                <p className="font-bold">💳 Оплата (27-31)</p>
              </button>
              <button
                type="button"
                onClick={() => applyNotifTemplate('event')}
                className="p-2 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-300 text-left cursor-pointer"
              >
                <p className="font-bold">🎉 Открытый урок</p>
              </button>
            </div>
          </div>

          <form onSubmit={handleSendNotification} className="space-y-3">
            <select
              value={notifTargetGroup}
              onChange={(e) => setNotifTargetGroup(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 text-white cursor-pointer"
            >
              <option value="all">Всем ученицам студии ARVESTI</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>

            <input
              type="text"
              required
              placeholder="Заголовок"
              value={notifTitle}
              onChange={(e) => setNotifTitle(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 text-white"
            />

            <textarea
              required
              rows={2}
              placeholder="Текст уведомления..."
              value={notifMessage}
              onChange={(e) => setNotifMessage(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 text-white"
            />

            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Отправить всем ученицам</span>
            </button>
          </form>
        </div>
      )}

      {/* Модальное окно подтверждения удаления */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm p-6 rounded-3xl border border-neutral-800 bg-neutral-900 shadow-2xl space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white">Удалить ученицу?</h3>
            <p className="text-neutral-400">Ученица {studentToDelete.full_name} будет удалена из списка.</p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setStudentToDelete(null)}
                className="py-2 px-4 rounded-xl border border-neutral-700 text-neutral-300"
              >
                Отмена
              </button>
              <button
                onClick={handleConfirmDeleteStudent}
                className="py-2 px-4 rounded-xl bg-red-600 text-white font-bold"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования ученицы */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm p-6 rounded-3xl border border-neutral-800 bg-neutral-900 shadow-2xl space-y-3.5 text-xs">
            <h3 className="text-sm font-bold text-white">Редактировать ученицу</h3>
            <form onSubmit={handleSaveStudentEdit} className="space-y-3">
              <div>
                <label className="block text-neutral-400 mb-1">ФИО</label>
                <input
                  type="text"
                  value={editingStudent.full_name}
                  onChange={(e) => setEditingStudent({ ...editingStudent, full_name: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-1.5 px-3 text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-400 mb-1">Телефон</label>
                <input
                  type="text"
                  value={editingStudent.phone}
                  onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-1.5 px-3 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-neutral-400 mb-1">Срок оплаты</label>
                <input
                  type="text"
                  value={editingStudent.payment_due_date || 'до 31.10.2026'}
                  onChange={(e) => setEditingStudent({ ...editingStudent, payment_due_date: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-1.5 px-3 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="py-1.5 px-3.5 rounded-xl border border-neutral-700 text-neutral-300"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="py-1.5 px-4 rounded-xl bg-white text-black font-bold"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
