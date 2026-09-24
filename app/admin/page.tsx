'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  Users,
  UserPlus,
  CalendarCheck,
  CreditCard,
  Check,
  CheckCircle2,
  BarChart3,
  Shield,
  Lock,
  AlertCircle,
  Bell,
  Newspaper,
  Send,
  Plus,
  Trash2,
  Edit3,
  Search,
  Phone,
  X,
} from 'lucide-react';
import { AttendanceCharts } from '@/components/AttendanceCharts';
import {
  ProfileRow,
  GroupRow,
  NewsRow,
  AppNotificationRow,
} from '@/types/database';

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [isAdminAuthorized, setIsAdminAuthorized] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  const [activeSection, setActiveSection] = useState<'requests' | 'attendance' | 'students' | 'news' | 'notifications' | 'debt'>('requests');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Группы
  const [groups] = useState<GroupRow[]>([
    { id: 'grp-1', name: 'ARVESTI 1.0', age_category: 'Старшая группа', schedule: 'Чт, Сб', time: '19:00 - 20:30', days_of_week: ['Чт', 'Сб'] },
    { id: 'grp-2', name: 'ARVESTI 2.0', age_category: 'Старшая группа', schedule: 'Сб, Вс', time: '17:00 - 18:30', days_of_week: ['Сб', 'Вс'] },
    { id: 'grp-3', name: 'ARVESTI 3.0', age_category: 'Младшая группа', schedule: 'Сб, Вс', time: '14:00 - 15:30', days_of_week: ['Сб', 'Вс'] },
    { id: 'grp-4', name: 'ARVESTI 4.0', age_category: 'Младшая группа', schedule: 'Сб, Вс', time: '15:30 - 17:00', days_of_week: ['Сб', 'Вс'] },
  ]);

  // Данные из Supabase
  const [students, setStudents] = useState<ProfileRow[]>([]);
  const [news, setNews] = useState<NewsRow[]>([]);
  const [notifications, setNotifications] = useState<AppNotificationRow[]>([]);

  // Формы новостей
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsCategory, setNewsCategory] = useState<'announcement' | 'schedule_change' | 'payment_reminder' | 'event'>('announcement');
  const [newsPinned, setNewsPinned] = useState(false);

  // Формы уведомлений
  const [notifTargetGroup, setNotifTargetGroup] = useState('all');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState<'reminder' | 'schedule' | 'urgent' | 'announcement'>('reminder');
  const [notifSentSuccess, setNotifSentSuccess] = useState('');

  // Модальные окна
  const [editingStudent, setEditingStudent] = useState<ProfileRow | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<ProfileRow | null>(null);

  // Загрузка всех данных из Supabase
  const fetchData = async () => {
    try {
      const [studentsRes, newsRes, notifsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('news').select('*').order('created_at', { ascending: false }),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }),
      ]);

      if (studentsRes.data) {
        setStudents(studentsRes.data as ProfileRow[]);
      }

      if (newsRes.data && newsRes.data.length > 0) {
        setNews(newsRes.data as NewsRow[]);
      } else {
        setNews([
          {
            id: 'news-init-1',
            title: 'Добро пожаловать в студию кавказских танцев ARVESTI',
            content: 'Занятия проходят в ТРЦ «Арбат», Октябрьская ул., 17. Ждём вас на тренировках в чистой сменной обуви!',
            date: new Date().toLocaleDateString('ru-RU'),
            author: 'Линда Азизян',
            category: 'announcement',
            pinned: true,
          },
        ]);
      }

      if (notifsRes.data) {
        setNotifications(notifsRes.data as AppNotificationRow[]);
      }
    } catch (err) {
      console.error('Ошибка загрузки данных из Supabase:', err);
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
    if (pass === 'ArvestiAdmin2026!' || pass === 'admin123456') {
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

  // ОДОБРЕНИЕ ЗАЯВКИ
  const handleApproveStudent = async (studentId: string) => {
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, status: 'active' as const } : s)));
    try {
      await supabase.from('profiles').update({ status: 'active' }).eq('id', studentId);
    } catch (err) {
      console.error('Ошибка обновления статуса ученицы:', err);
    }
  };

  // УДАЛЕНИЕ УЧЕНИЦЫ
  const handleConfirmDeleteStudent = async () => {
    if (!studentToDelete) return;
    const idToDelete = studentToDelete.id;

    setStudents((prev) => prev.filter((s) => s.id !== idToDelete));
    if (editingStudent?.id === idToDelete) setEditingStudent(null);
    setStudentToDelete(null);

    try {
      await supabase.from('profiles').delete().eq('id', idToDelete);
    } catch (err) {
      console.error('Ошибка удаления ученицы:', err);
    }
  };

  // СМЕНА СТАТУСА ОПЛАТЫ
  const handleTogglePayment = async (studentId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'paid' ? 'overdue' : 'paid';
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, payment_status: nextStatus as any } : s)));
    try {
      await supabase.from('profiles').update({ payment_status: nextStatus }).eq('id', studentId);
    } catch {}
  };

  // РЕДАКТИРОВАНИЕ УЧЕНИЦЫ
  const handleSaveStudentEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setStudents((prev) => prev.map((s) => (s.id === editingStudent.id ? editingStudent : s)));
    try {
      await supabase.from('profiles').update(editingStudent).eq('id', editingStudent.id);
    } catch {}
    setEditingStudent(null);
  };

  // СОЗДАНИЕ И СОХРАНЕНИЕ НОВОСТИ В SUPABASE
  const handleAddNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle.trim() || !newsContent.trim()) return;

    const newPost: NewsRow = {
      id: 'news-' + Date.now(),
      title: newsTitle.trim(),
      content: newsContent.trim(),
      category: newsCategory,
      pinned: newsPinned,
      author: 'Линда Азизян',
      date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
    };

    setNews([newPost, ...news]);
    setNewsTitle('');
    setNewsContent('');
    setNewsPinned(false);

    try {
      await supabase.from('news').insert([newPost]);
    } catch (err) {
      console.error('Ошибка сохранения новости в Supabase:', err);
    }
  };

  // УДАЛЕНИЕ НОВОСТИ ИЗ SUPABASE
  const handleDeleteNews = async (id: string) => {
    setNews((prev) => prev.filter((n) => n.id !== id));
    try {
      await supabase.from('news').delete().eq('id', id);
    } catch (err) {
      console.error('Ошибка удаления новости:', err);
    }
  };

  // СОЗДАНИЕ И СОХРАНЕНИЕ УВЕДОМЛЕНИЯ В SUPABASE
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;

    const newNotif: AppNotificationRow = {
      id: 'notif-' + Date.now(),
      target_group_id: notifTargetGroup,
      title: notifTitle.trim(),
      message: notifMessage.trim(),
      type: notifType,
      created_at: new Date().toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    };

    setNotifications([newNotif, ...notifications]);
    setNotifTitle('');
    setNotifMessage('');
    setNotifSentSuccess('Уведомление успешно отправлено ученицам!');
    setTimeout(() => setNotifSentSuccess(''), 4000);

    try {
      await supabase.from('notifications').insert([newNotif]);
    } catch (err) {
      console.error('Ошибка отправки уведомления:', err);
    }
  };

  // УДАЛЕНИЕ УВЕДОМЛЕНИЯ
  const handleDeleteNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await supabase.from('notifications').delete().eq('id', id);
    } catch {}
  };

  const pendingRequests = useMemo(() => students.filter((s) => s.status === 'pending'), [students]);
  const activeStudents = useMemo(() => students.filter((s) => s.status === 'active'), [students]);

  const groupStudents = useMemo(() => {
    let list = activeStudents;
    if (selectedGroupId !== 'all') {
      list = list.filter((s) => s.group_id === selectedGroupId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((s) => s.full_name.toLowerCase().includes(q) || s.phone.includes(q) || s.username?.toLowerCase().includes(q));
    }
    return list;
  }, [activeStudents, selectedGroupId, searchQuery]);

  const debtors = useMemo(() => students.filter((s) => s.payment_status === 'overdue'), [students]);

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
          <p className="text-xs text-neutral-400">
            Введите мастер-пароль для доступа к управлению студией
          </p>
        </div>

        {authError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleVerifyAdmin} className="space-y-4 text-xs">
          <div>
            <label className="block text-neutral-300 font-semibold mb-1">Пароль руководителя</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={adminPasswordInput}
              onChange={(e) => setAdminPasswordInput(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 text-white placeholder-neutral-500 focus:outline-none focus:border-white"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-neutral-200 text-black font-extrabold text-xs transition-all shadow cursor-pointer"
          >
            Войти в систему
          </button>
        </form>

        <div className="text-center pt-2">
          <Link href="/" className="text-xs text-neutral-500 hover:text-white transition-colors">
            ← Вернуться на главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Шапка */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-white" />
            <h1 className="text-2xl font-black text-white">Кабинет руководителя ARVESTI</h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Линда Азизян • Управление студией, ученицами, новостями и абонементами
          </p>
        </div>
      </div>

      {/* Вкладки */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs font-semibold">
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
          <span>Новости ({news.length})</span>
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

        <button
          onClick={() => setActiveSection('attendance')}
          className={`py-2 px-3.5 rounded-xl font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
            activeSection === 'attendance'
              ? 'bg-white text-black border-white shadow'
              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Посещаемость</span>
        </button>

        <button
          onClick={() => setActiveSection('debt')}
          className={`py-2 px-3.5 rounded-xl font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
            activeSection === 'debt'
              ? 'bg-white text-black border-white shadow'
              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Долги ({debtors.length})</span>
        </button>
      </div>

      {/* 1. ЗАЯВКИ */}
      {activeSection === 'requests' && (
        <div className="p-6 rounded-3xl border border-neutral-800 bg-neutral-900/80 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-white" />
                <span>Новые заявки на регистрацию</span>
              </h2>
              <p className="text-xs text-neutral-400">
                Заявки с телефонов учениц, сохранённые в Supabase
              </p>
            </div>
            <span className="text-xs font-mono text-neutral-300 font-bold">
              {pendingRequests.length} ожидают
            </span>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-400 space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-70" />
              <p className="font-semibold text-neutral-200">Все заявки обработаны</p>
              <p>Новых запросов на регистрацию нет.</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-800">
              {pendingRequests.map((st) => (
                <div key={st.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-white">{st.full_name}</h3>
                      <span className="text-neutral-400 font-mono text-xs">@{st.username}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-200 border border-neutral-700 font-semibold">
                        {st.account_type === 'subscription' ? 'Абонемент' : 'Разовые'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 font-mono mt-0.5 flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-neutral-500" />
                      <span>{st.phone}</span>
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Группа: {groups.find((g) => g.id === st.group_id)?.name || st.group_id}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveStudent(st.id)}
                      className="py-1.5 px-3.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Принять в студию</span>
                    </button>
                    <button
                      onClick={() => setStudentToDelete(st)}
                      className="py-1.5 px-3 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                      title="Удалить заявку"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Отклонить</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. УЧЕНИЦЫ */}
      {activeSection === 'students' && (
        <div className="p-6 rounded-3xl border border-neutral-800 bg-neutral-900/80 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-white" />
                <span>Список учениц ({groupStudents.length})</span>
              </h2>
              <p className="text-xs text-neutral-400">
                Управление составом: редактирование, смена статуса оплаты и удаление
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Поиск по имени, логину..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-neutral-950 border border-neutral-800 rounded-xl py-1.5 px-3 pl-8 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white w-48 sm:w-56"
                />
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
              </div>

              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none focus:border-white cursor-pointer"
              >
                <option value="all">Все группы</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="divide-y divide-neutral-800">
            {groupStudents.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-400">
                Ученицы не найдены.
              </div>
            ) : (
              groupStudents.map((std) => {
                const grp = groups.find((g) => g.id === std.group_id);
                return (
                  <div key={std.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-bold text-sm shrink-0">
                        {std.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{std.full_name}</span>
                          <span className="text-neutral-400 font-mono text-[11px]">@{std.username}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 font-medium">
                            {grp?.name || 'ARVESTI'}
                          </span>
                        </div>
                        <span className="text-neutral-400 font-mono text-[11px]">{std.phone}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTogglePayment(std.id, std.payment_status)}
                        className={`px-3 py-1 rounded-xl border text-[11px] font-bold cursor-pointer transition-colors ${
                          std.payment_status === 'paid'
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                            : 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                        }`}
                      >
                        {std.payment_status === 'paid' ? 'Оплачен' : 'Долг'}
                      </button>

                      <button
                        onClick={() => setEditingStudent(std)}
                        className="p-1.5 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors cursor-pointer"
                        title="Редактировать"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setStudentToDelete(std)}
                        className="p-1.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                        title="Удалить ученицу"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 3. НОВОСТИ С ПОСТОЯННОЙ ПАМЯТЬЮ В SUPABASE */}
      {activeSection === 'news' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border border-neutral-800 bg-neutral-900/80 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Создать и опубликовать новость</span>
            </h2>

            <form onSubmit={handleAddNews} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Заголовок новости</label>
                <input
                  type="text"
                  required
                  placeholder="Например: Перенос репетиции к городскому концерту"
                  value={newsTitle}
                  onChange={(e) => setNewsTitle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Текст новости</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Текст новости для учениц студии..."
                  value={newsContent}
                  onChange={(e) => setNewsContent(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-white"
                />
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Категория</label>
                  <select
                    value={newsCategory}
                    onChange={(e: any) => setNewsCategory(e.target.value)}
                    className="bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 text-white text-xs cursor-pointer"
                  >
                    <option value="announcement">Объявление студии</option>
                    <option value="schedule_change">Изменение расписания</option>
                    <option value="payment_reminder">Оплата абонементов</option>
                    <option value="event">Мероприятие / Выступление</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="pinnedNewsCheck"
                    checked={newsPinned}
                    onChange={(e) => setNewsPinned(e.target.checked)}
                    className="rounded bg-neutral-950 border-neutral-800 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="pinnedNewsCheck" className="text-neutral-300 cursor-pointer">
                    Закрепить вверху ленты
                  </label>
                </div>

                <div className="pt-5 ml-auto">
                  <button
                    type="submit"
                    className="py-2 px-5 rounded-xl bg-white hover:bg-neutral-200 text-black font-extrabold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Опубликовать в базу</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-white text-sm">Опубликованные новости ({news.length})</h3>
            <div className="grid gap-3">
              {news.map((item) => (
                <div key={item.id} className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900/80 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {item.pinned && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                          Закреплено
                        </span>
                      )}
                      <h4 className="font-bold text-white text-sm">{item.title}</h4>
                    </div>
                    <p className="text-xs text-neutral-300 whitespace-pre-line">{item.content}</p>
                    <p className="text-[10px] text-neutral-500 pt-1">
                      {item.date} • {item.author}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteNews(item.id)}
                    className="p-2 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-800 transition-colors cursor-pointer"
                    title="Удалить новость"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. УВЕДОМЛЕНИЯ */}
      {activeSection === 'notifications' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border border-neutral-800 bg-neutral-900/80 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span>Отправить Push-уведомление</span>
            </h2>

            {notifSentSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{notifSentSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSendNotification} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Кому отправить</label>
                  <select
                    value={notifTargetGroup}
                    onChange={(e) => setNotifTargetGroup(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 text-white text-xs cursor-pointer"
                  >
                    <option value="all">Всем ученицам студии ARVESTI</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>Группа {g.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Тип</label>
                  <select
                    value={notifType}
                    onChange={(e: any) => setNotifType(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 text-white text-xs cursor-pointer"
                  >
                    <option value="reminder">🔔 Напоминание об оплате</option>
                    <option value="schedule">📅 Перенос или отмена</option>
                    <option value="urgent">⚠️ Срочное сообщение</option>
                    <option value="announcement">📢 Общий анонс</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Заголовок</label>
                <input
                  type="text"
                  required
                  placeholder="Заголовок сообщения"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Текст</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Текст уведомления..."
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-white"
                />
              </div>

              <div className="pt-2 text-right">
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-white hover:bg-neutral-200 text-black font-extrabold text-xs transition-colors inline-flex items-center gap-2 cursor-pointer shadow"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Отправить</span>
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-white text-sm">История уведомлений</h3>
            <div className="grid gap-3">
              {notifications.map((item) => (
                <div key={item.id} className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900/80 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{item.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                        {item.target_group_id === 'all' ? 'Все группы' : groups.find((g) => g.id === item.target_group_id)?.name}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300">{item.message}</p>
                    <p className="text-[10px] text-neutral-500 pt-1">{item.created_at}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteNotification(item.id)}
                    className="p-2 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. ПОСЕЩАЕМОСТЬ */}
      {activeSection === 'attendance' && (
        <div className="space-y-6">
          <AttendanceCharts groups={groups} />
        </div>
      )}

      {/* 6. ДОЛГИ */}
      {activeSection === 'debt' && (
        <div className="p-6 rounded-3xl border border-neutral-800 bg-neutral-900/80 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-white" />
            <span>Контроль задолженностей</span>
          </h2>

          <div className="divide-y divide-neutral-800 text-xs">
            {debtors.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1 opacity-80" />
                <p>Все абонементы оплачены. Задолженностей нет!</p>
              </div>
            ) : (
              debtors.map((std) => (
                <div key={std.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-red-400 text-sm">{std.full_name}</h4>
                    <p className="text-neutral-400 font-mono">{std.phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTogglePayment(std.id, 'overdue')}
                      className="py-1 px-3 rounded-xl bg-emerald-500 text-black font-bold cursor-pointer hover:bg-emerald-400 transition-colors"
                    >
                      Отметить оплату
                    </button>
                    <button
                      onClick={() => setStudentToDelete(std)}
                      className="p-1.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* МОДАЛЬНОЕ ОКНО: ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-white text-base">Удалить ученицу?</h3>
              <p className="text-xs text-neutral-300">
                Вы действительно хотите удалить <strong className="text-white">«{studentToDelete.full_name}»</strong> (@{studentToDelete.username}) из базы ARVESTI?
              </p>
              <p className="text-[11px] text-neutral-500 pt-1">
                Все данные, статус оплаты и посещения будут удалены.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteStudent}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer shadow"
              >
                Да, удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛЬНОЕ ОКНО: РЕДАКТИРОВАНИЕ */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                <span>Редактирование ученицы</span>
              </h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentEdit} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">ФИО Ученицы</label>
                <input
                  type="text"
                  required
                  value={editingStudent.full_name}
                  onChange={(e) => setEditingStudent({ ...editingStudent, full_name: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Логин</label>
                <input
                  type="text"
                  required
                  value={editingStudent.username}
                  onChange={(e) => setEditingStudent({ ...editingStudent, username: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Номер телефона</label>
                <input
                  type="text"
                  required
                  value={editingStudent.phone}
                  onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Группа обучения</label>
                <select
                  value={editingStudent.group_id || 'grp-1'}
                  onChange={(e) => setEditingStudent({ ...editingStudent, group_id: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-white"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name} ({g.age_category})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Тип визитов</label>
                  <select
                    value={editingStudent.account_type}
                    onChange={(e: any) => setEditingStudent({ ...editingStudent, account_type: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-white"
                  >
                    <option value="subscription">Абонемент</option>
                    <option value="drop_in">Разовые</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Оплата</label>
                  <select
                    value={editingStudent.payment_status}
                    onChange={(e: any) => setEditingStudent({ ...editingStudent, payment_status: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-white"
                  >
                    <option value="paid">Оплачен</option>
                    <option value="overdue">Задолженность</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    const toDel = editingStudent;
                    setEditingStudent(null);
                    setStudentToDelete(toDel);
                  }}
                  className="py-2.5 px-3 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Удалить</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold transition-colors cursor-pointer"
                >
                  Отмена
                </button>

                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-extrabold transition-colors cursor-pointer shadow"
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
