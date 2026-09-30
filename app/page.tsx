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
  Settings,
  MapPin,
  Save,
  MessageCircle,
} from 'lucide-react';
import { ProfileRow, NewsRow, StudioRuleSection } from '@/types/database';

export default function AdminPage() {
  const supabase = createClient();

  const [isAdminAuthorized, setIsAdminAuthorized] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  const [activeSection, setActiveSection] = useState<'attendance' | 'students' | 'notifications' | 'requests' | 'settings'>('attendance');

  const [students, setStudents] = useState<ProfileRow[]>([]);
  const [news, setNews] = useState<NewsRow[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [rules, setRules] = useState<StudioRuleSection[]>([]);
  const [loading, setLoading] = useState(true);

  const [studioAddress, setStudioAddress] = useState('ТРЦ «Арбат», Октябрьская ул., 17, Пятигорск');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  const [groups, setGroups] = useState([
    { id: 'grp-1', name: 'ARVESTI 1.0', age_category: 'Старшая', schedule: 'Четверг, Суббота', time: 'Чт — 19:00, Сб — 16:30' },
    { id: 'grp-2', name: 'ARVESTI 2.0', age_category: 'Старшая', schedule: 'Суббота и Воскресенье', time: '15:00' },
    { id: 'grp-3', name: 'ARVESTI 3.0', age_category: 'Младшая', schedule: 'Суббота и Воскресенье', time: '14:00' },
    { id: 'grp-4', name: 'ARVESTI 4.0', age_category: 'Младшая', schedule: 'Суббота и Воскресенье', time: '13:00' },
  ]);

  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [attendanceGroupId, setAttendanceGroupId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [notifTarget, setNotifTarget] = useState('all');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState<'reminder' | 'schedule' | 'urgent' | 'announcement'>('reminder');
  const [notifSentSuccess, setNotifSentSuccess] = useState('');

  const [personalMsgStudent, setPersonalMsgStudent] = useState<ProfileRow | null>(null);
  const [personalMsgText, setPersonalMsgText] = useState('');

  const [editingStudent, setEditingStudent] = useState<ProfileRow | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<ProfileRow | null>(null);

  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'going' | 'not_going' | 'unconfirmed'>('all');

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelGroup, setCancelGroup] = useState('all');
  const [cancelDate, setCancelDate] = useState('Ближайшее занятие');
  const [cancelReason, setCancelReason] = useState('Болезнь педагога. Будет обязательно назначена отработка!');
  const [cancelNotice, setCancelNotice] = useState('');

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
      if (notifsRes.data) setNotifications(notifsRes.data);
      if (rulesRes.data && rulesRes.data.length > 0) setRules(rulesRes.data as StudioRuleSection[]);
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

    setSettingsSuccess('Настройки (адрес и расписание) успешно сохранены!');
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
      {/* Шапка админки */}
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
          <Link
            href="/"
            className="py-1 px-2.5 rounded-lg border border-neutral-700 bg-neutral-900 text-neutral-300 text-[11px] font-semibold"
          >
            В вид учениц
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem('arvesti_admin_authorized');
              setIsAdminAuthorized(false);
            }}
            className="p-1.5 rounded-lg bg-red-600/10 border border-red-500/30 text-red-400 text-xs"
            title="Выйти"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {cancelNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{cancelNotice}</span>
        </div>
      )}

      {/* 1. ПОСЕЩАЕМОСТЬ */}
      {activeSection === 'attendance' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl border border-neutral-800 bg-neutral-900/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-emerald-400" />
                  <span>Журнал посещаемости</span>
                </h2>
                <p className="text-[11px] text-neutral-400">
                  Ответы учениц («Смогу прийти» / «Не смогу прийти»)
                </p>
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
                  attendanceFilter === 'going'
                    ? 'bg-emerald-500/25 border-emerald-400 shadow'
                    : 'bg-emerald-500/10 border-emerald-500/30'
                }`}
              >
                <p className="text-2xl font-black text-emerald-400">{goingStudents.length}</p>
                <p className="text-[11px] font-bold text-emerald-300 mt-0.5">Смогут прийти</p>
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
                <p className="text-[11px] font-bold text-red-300 mt-0.5">Не смогут прийти</p>
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
                className={`py-1 px-2.5 rounded-xl font-bold cursor-pointer border ${
                  attendanceFilter === 'all' ? 'bg-white text-black border-white' : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                }`}
              >
                Все ({attendanceStudents.length})
              </button>
              <button
                onClick={() => setAttendanceFilter('going')}
                className={`py-1 px-2.5 rounded-xl font-bold cursor-pointer border ${
                  attendanceFilter === 'going' ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-neutral-950 border-emerald-500/30 text-emerald-400'
                }`}
              >
                Смогут ({goingStudents.length})
              </button>
              <button
                onClick={() => setAttendanceFilter('not_going')}
                className={`py-1 px-2.5 rounded-xl font-bold cursor-pointer border ${
                  attendanceFilter === 'not_going' ? 'bg-red-500 text-white border-red-500' : 'bg-neutral-950 border-red-500/30 text-red-400'
                }`}
              >
                Не смогут ({notGoingStudents.length})
              </button>
              <button
                onClick={() => setAttendanceFilter('unconfirmed')}
                className={`py-1 px-2.5 rounded-xl font-bold cursor-pointer border ${
                  attendanceFilter === 'unconfirmed' ? 'bg-neutral-700 text-white border-neutral-600' : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                }`}
              >
                Без ответа ({unconfirmedStudents.length})
              </button>
            </div>

            {/* Список учениц */}
            <div className="divide-y divide-neutral-800 pt-2">
              {filteredAttendanceStudents.map((st) => {
                const isGoing = st.attendance_status === 'going' || st.notes?.includes('Смогу прийти') || st.notes?.includes('Будет на занятии');
                const isNotGoing = st.attendance_status === 'not_going' || st.notes?.includes('Не смогу прийти') || st.notes?.includes('Не сможет');
                const wasInHall = st.notes?.includes('Была в зале');

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
                          Смогу прийти
                        </span>
                      ) : isNotGoing ? (
                        <span className="px-2.5 py-1 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-black">
                          Не смогу прийти
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl bg-neutral-800 text-neutral-400 text-[10px]">
                          Ещё не ответила
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

                      <div className="flex items-center gap-1 pl-1 border-l border-neutral-800">
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
        </div>
      )}

      {/* 2. УЧЕНИЦЫ (РЕДАКТИРОВАНИЕ ИМЕНИ И ГРУППЫ) */}
      {activeSection === 'students' && (
        <div className="p-5 rounded-3xl border border-neutral-800 bg-neutral-900/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Список учениц ({groupStudents.length})</span>
              </h2>
              <p className="text-[11px] text-neutral-400">Нажмите ✏️ для смены группы или имени ученицы</p>
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
                className="bg-neutral-950 border border-neutral-800 rounded-xl py-1 px-2 text-xs text-white"
              >
                <option value="all">Все</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="divide-y divide-neutral-800">
            {groupStudents.map((std) => {
              const currentGroup = groups.find((g) => g.id === std.group_id);

              return (
                <div key={std.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{std.full_name}</span>
                      <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 font-bold text-[10px]">
                        {currentGroup?.name || 'ARVESTI 1.0'}
                      </span>
                    </div>
                    <p className="text-neutral-400 font-mono text-[11px]">{std.phone} • @{std.username}</p>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
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
                      type="button"
                      onClick={() => { setPersonalMsgStudent(std); setPersonalMsgText(''); }}
                      className="p-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300"
                      title="Написать личное сообщение"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>

                    {/* КНОПКА РЕДАКТИРОВАНИЯ ИМЕНИ И ГРУППЫ */}
                    <button
                      onClick={() => setEditingStudent(std)}
                      className="p-1.5 rounded-lg border border-neutral-700 bg-neutral-800 text-white hover:bg-neutral-700 font-bold flex items-center gap-1 cursor-pointer"
                      title="Изменить имя, группу, телефон"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[11px]">Изменить</span>
                    </button>

                    <div className="pl-3 ml-2 border-l border-neutral-800">
                      <button
                        onClick={() => setStudentToDelete(std)}
                        className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400/80 hover:text-red-400 hover:bg-red-500/20 cursor-pointer"
                        title="Удалить ученицу"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. УВЕДОМЛЕНИЯ */}
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

          <form onSubmit={handleSendNotification} className="space-y-3">
            <div>
              <label className="block text-neutral-400 mb-1">Кому отправить:</label>
              <select
                value={notifTarget}
                onChange={(e) => setNotifTarget(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 text-white cursor-pointer"
              >
                <optgroup label="Общие рассылки">
                  <option value="all">Всем ученицам студии ARVESTI</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>Группа {g.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Персонально ученице">
                  {activeStudents.map((st) => (
                    <option key={st.id} value={`student:${st.id}`}>
                      Персонально: {st.full_name} ({st.phone})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <input
              type="text"
              required
              placeholder="Заголовок сообщения"
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
              <span>Отправить мгновенно</span>
            </button>
          </form>
        </div>
      )}

      {/* 4. ЗАЯВКИ */}
      {activeSection === 'requests' && (
        <div className="p-5 rounded-3xl border border-neutral-800 bg-neutral-900/80 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              <span>Заявки на регистрацию ({pendingRequests.length})</span>
            </h2>
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

      {/* 5. НАСТРОЙКИ СТУДИИ */}
      {activeSection === 'settings' && (
        <div className="space-y-5 text-xs">
          {settingsSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{settingsSuccess}</span>
            </div>
          )}

          <div className="p-5 rounded-3xl border border-neutral-800 bg-neutral-900/80 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-white" />
              <span>Адрес студии</span>
            </h3>
            <input
              type="text"
              value={studioAddress}
              onChange={(e) => setStudioAddress(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 text-white"
              placeholder="ТРЦ «Арбат», Октябрьская ул., 17, Пятигорск"
            />
          </div>

          <div className="p-5 rounded-3xl border border-neutral-800 bg-neutral-900/80 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-white" />
              <span>Расписание танцевальных групп</span>
            </h3>
            <div className="space-y-3">
              {groups.map((grp, idx) => (
                <div key={grp.id} className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{grp.name}</span>
                    <span className="text-[10px] text-neutral-400">{grp.age_category}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-neutral-500 mb-0.5">Дни</label>
                      <input
                        type="text"
                        value={grp.schedule}
                        onChange={(e) => {
                          const updated = [...groups];
                          updated[idx].schedule = e.target.value;
                          setGroups(updated);
                        }}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-1 px-2 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-500 mb-0.5">Время</label>
                      <input
                        type="text"
                        value={grp.time}
                        onChange={(e) => {
                          const updated = [...groups];
                          updated[idx].time = e.target.value;
                          setGroups(updated);
                        }}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-1 px-2 text-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveSettings}
            className="w-full py-3 rounded-2xl bg-white hover:bg-neutral-200 text-black font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            <Save className="w-4 h-4" />
            <span>Сохранить адрес и расписание</span>
          </button>
        </div>
      )}

      {/* НИЖНЯЯ ПАНЕЛЬ РАЗДЕЛОВ ДЛЯ АДМИНИСТРАТОРА */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-md border-t border-neutral-800 safe-bottom">
        <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-1">
          <button
            type="button"
            onClick={() => setActiveSection('attendance')}
            className={`flex flex-col items-center justify-center w-full h-full py-1 cursor-pointer ${
              activeSection === 'attendance' ? 'text-white font-bold' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <CalendarCheck className={`w-5 h-5 ${activeSection === 'attendance' ? 'scale-110 text-white' : ''}`} />
            <span className="text-[10px] mt-1">Журнал</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('students')}
            className={`flex flex-col items-center justify-center w-full h-full py-1 cursor-pointer ${
              activeSection === 'students' ? 'text-white font-bold' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Users className={`w-5 h-5 ${activeSection === 'students' ? 'scale-110 text-white' : ''}`} />
            <span className="text-[10px] mt-1">Ученицы</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('notifications')}
            className={`flex flex-col items-center justify-center w-full h-full py-1 cursor-pointer ${
              activeSection === 'notifications' ? 'text-white font-bold' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Bell className={`w-5 h-5 ${activeSection === 'notifications' ? 'scale-110 text-white' : ''}`} />
            <span className="text-[10px] mt-1">Пуши</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('requests')}
            className={`flex flex-col items-center justify-center w-full h-full py-1 cursor-pointer relative ${
              activeSection === 'requests' ? 'text-white font-bold' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <UserPlus className={`w-5 h-5 ${activeSection === 'requests' ? 'scale-110 text-white' : ''}`} />
            <span className="text-[10px] mt-1">Заявки</span>
            {pendingRequests.length > 0 && (
              <span className="absolute top-2 right-4 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('settings')}
            className={`flex flex-col items-center justify-center w-full h-full py-1 cursor-pointer ${
              activeSection === 'settings' ? 'text-white font-bold' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Settings className={`w-5 h-5 ${activeSection === 'settings' ? 'scale-110 text-white' : ''}`} />
            <span className="text-[10px] mt-1">Настройки</span>
          </button>
        </div>
      </nav>

      {/* МОДАЛЬНОЕ ОКНО РЕДАКТИРОВАНИЯ УЧЕНИЦЫ (ИМЯ, ГРУППА, ТЕЛЕФОН, ОПЛАТА) */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm p-6 rounded-3xl border border-neutral-800 bg-neutral-900 shadow-2xl space-y-3.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-white" />
                <span>Редактировать ученицу</span>
              </h3>
              <button onClick={() => setEditingStudent(null)} className="text-neutral-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentEdit} className="space-y-3">
              <div>
                <label className="block text-neutral-400 mb-1 font-semibold">ФИО Ученицы (Имя)</label>
                <input
                  type="text"
                  required
                  value={editingStudent.full_name}
                  onChange={(e) => setEditingStudent({ ...editingStudent, full_name: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 text-white focus:border-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 font-semibold">Танцевальная группа</label>
                <select
                  value={editingStudent.group_id || 'grp-1'}
                  onChange={(e) => setEditingStudent({ ...editingStudent, group_id: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 text-white focus:border-white focus:outline-none cursor-pointer"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.age_category}, {g.time})
                    </option>
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
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-1.5 px-3 text-white font-mono focus:border-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1 font-semibold">Логин</label>
                  <input
                    type="text"
                    value={editingStudent.username || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, username: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-1.5 px-3 text-white focus:border-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-neutral-400 mb-1 font-semibold">Статус оплаты</label>
                  <select
                    value={editingStudent.payment_status || 'paid'}
                    onChange={(e) => setEditingStudent({ ...editingStudent, payment_status: e.target.value as any })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-1.5 px-2 text-white focus:border-white focus:outline-none cursor-pointer"
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
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-1.5 px-3 text-white focus:border-white focus:outline-none"
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

      {/* Модальное окно личного сообщения */}
      {personalMsgStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm p-6 rounded-3xl border border-neutral-800 bg-neutral-900 shadow-2xl space-y-3.5 text-xs">
            <div className="flex items-center gap-2 text-purple-400">
              <MessageCircle className="w-5 h-5" />
              <div>
                <h3 className="text-sm font-bold text-white">Личное сообщение ученице</h3>
                <p className="text-[11px] text-neutral-400">{personalMsgStudent.full_name} ({personalMsgStudent.phone})</p>
              </div>
            </div>

            <form onSubmit={handleSendQuickPersonal} className="space-y-3">
              <textarea
                required
                rows={3}
                placeholder="Напишите личное сообщение для ученицы..."
                value={personalMsgText}
                onChange={(e) => setPersonalMsgText(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-purple-400"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPersonalMsgStudent(null)}
                  className="py-1.5 px-3.5 rounded-xl border border-neutral-700 text-neutral-300"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="py-1.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  Отправить ученице
                </button>
              </div>
            </form>
          </div>
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
  );
}
