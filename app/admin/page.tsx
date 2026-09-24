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
  Inbox,
  Check,
  X,
  CheckCircle2,
  BarChart3,
  Filter,
  Shield,
  Lock,
  AlertCircle,
  Bell,
  Newspaper,
  Send,
  Plus,
  Trash2,
  Edit3,
} from 'lucide-react';
import { AttendanceCharts } from '@/components/AttendanceCharts';
import {
  ProfileRow,
  GroupRow,
  LessonRow,
  AttendanceRow,
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

  // Данные
  const [groups, setGroups] = useState<GroupRow[]>([
    { id: 'grp-1', name: 'ARVESTI 1.0', age_category: 'Старшая группа', schedule: 'Чт, Сб', time: '19:00 - 20:30', days_of_week: ['Чт', 'Сб'] },
    { id: 'grp-2', name: 'ARVESTI 2.0', age_category: 'Старшая группа', schedule: 'Сб, Вс', time: '17:00 - 18:30', days_of_week: ['Сб', 'Вс'] },
    { id: 'grp-3', name: 'ARVESTI 3.0', age_category: 'Младшая группа', schedule: 'Сб, Вс', time: '14:00 - 15:30', days_of_week: ['Сб', 'Вс'] },
    { id: 'grp-4', name: 'ARVESTI 4.0', age_category: 'Младшая группа', schedule: 'Сб, Вс', time: '15:30 - 17:00', days_of_week: ['Сб', 'Вс'] },
  ]);

  const [students, setStudents] = useState<ProfileRow[]>([
    { id: 'demo-1', full_name: 'Мадина Карданова', phone: '+7 (928) 111-22-33', role: 'student', group_id: 'grp-1', account_type: 'subscription', payment_status: 'paid', status: 'active', payment_due_date: '31.10.2026' },
    { id: 'demo-2', full_name: 'Амина Гаджиева', phone: '+7 (928) 222-33-44', role: 'student', group_id: 'grp-2', account_type: 'subscription', payment_status: 'overdue', status: 'active', payment_due_date: '27.10.2026' },
    { id: 'demo-3', full_name: 'Диана Алиева', phone: '+7 (928) 333-44-55', role: 'student', group_id: 'grp-1', account_type: 'subscription', payment_status: 'paid', status: 'pending', notes: 'Заявка на вступление в группу ARVESTI 1.0' },
  ]);

  const [news, setNews] = useState<NewsRow[]>([
    {
      id: 'news-1',
      title: 'Генеральная репетиция к городскому концерту',
      content: 'Все группы приглашаются на общую репетицию в воскресенье в 16:00 в большом зале.',
      date: '24 сентября 2026',
      author: 'Линда Азизян',
      category: 'event',
      pinned: true,
    },
    {
      id: 'news-2',
      title: 'Своевременная оплата абонементов за октябрь',
      content: 'Напоминаем, что абонементы на следующий месяц необходимо оплатить до 30 числа текущего месяца.',
      date: '22 сентября 2026',
      author: 'Администрация ARVESTI',
      category: 'payment_reminder',
      pinned: false,
    },
  ]);

  const [notifications, setNotifications] = useState<AppNotificationRow[]>([
    {
      id: 'notif-1',
      target_group_id: 'all',
      title: 'Форма для тренировок',
      message: 'Не забывайте брать чистую сменную обувь (балетки или чешки) и удобную тренировочную одежду.',
      type: 'reminder',
      created_at: '24.09.2026 14:00',
    },
  ]);

  // Форма добавления новости
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsCategory, setNewsCategory] = useState<'announcement' | 'schedule_change' | 'payment_reminder' | 'event'>('announcement');
  const [newsPinned, setNewsPinned] = useState(false);

  // Форма отправки уведомления
  const [notifTargetGroup, setNotifTargetGroup] = useState('all');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState<'reminder' | 'schedule' | 'urgent' | 'announcement'>('reminder');
  const [notifSentSuccess, setNotifSentSuccess] = useState('');

  // Модалка редактирования ученицы
  const [editingStudent, setEditingStudent] = useState<ProfileRow | null>(null);

  useEffect(() => {
    const localAdmin = typeof window !== 'undefined' && localStorage.getItem('arvesti_admin_authorized') === 'true';
    if (localAdmin) {
      setIsAdminAuthorized(true);
    }
    setLoading(false);
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
    } else {
      setAuthError('Неверный пароль администратора студии.');
    }
  };

  // Создание новости
  const handleAddNews = (e: React.FormEvent) => {
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
  };

  const handleDeleteNews = (id: string) => {
    setNews(news.filter(n => n.id !== id));
  };

  // Отправка уведомления
  const handleSendNotification = (e: React.FormEvent) => {
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
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  // Управление ученицами
  const handleApproveStudent = (id: string) => {
    setStudents(students.map(s => s.id === id ? { ...s, status: 'active' } : s));
  };

  const handleRejectStudent = (id: string) => {
    setStudents(students.map(s => s.id === id ? { ...s, status: 'rejected' } : s));
  };

  const handleTogglePaymentStatus = (id: string) => {
    setStudents(students.map(s => {
      if (s.id === id) {
        return { ...s, payment_status: s.payment_status === 'paid' ? 'overdue' : 'paid' };
      }
      return s;
    }));
  };

  const handleSaveStudentEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setStudents(students.map(s => s.id === editingStudent.id ? editingStudent : s));
    setEditingStudent(null);
  };

  const pendingStudents = useMemo(() => students.filter(s => s.status === 'pending'), [students]);
  const activeStudents = useMemo(() => students.filter(s => s.status === 'active'), [students]);
  const debtors = useMemo(() => students.filter(s => s.payment_status === 'overdue'), [students]);

  const filteredStudents = useMemo(() => {
    if (selectedGroupId === 'all') return activeStudents;
    return activeStudents.filter(s => s.group_id === selectedGroupId);
  }, [activeStudents, selectedGroupId]);

  if (loading) {
    return <div className="text-center py-20 text-neutral-400">Загрузка...</div>;
  }

  if (!isAdminAuthorized) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="p-8 rounded-3xl border border-neutral-800 bg-neutral-900 shadow-2xl text-center space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto text-white">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Панель руководителя ARVESTI</h1>
            <p className="text-xs text-neutral-400 mt-1">Доступ только для Линды Азизян</p>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleVerifyAdmin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Пароль руководителя</label>
              <input
                type="password"
                required
                placeholder="Введите пароль администратора"
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-white"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-extrabold text-xs transition-colors cursor-pointer"
            >
              Подтвердить вход
            </button>
          </form>

          <Link href="/" className="inline-block text-xs text-neutral-500 hover:text-neutral-300">
            ← Вернуться на главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-white" />
            <h1 className="text-2xl font-black text-white">Кабинет руководителя ARVESTI</h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Линда Азизян • Полное управление студией танцев
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs font-semibold">
        <button
          onClick={() => setActiveSection('requests')}
          className={`py-2 px-4 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
            activeSection === 'requests' ? 'bg-white text-black font-bold shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Заявки</span>
          {pendingStudents.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-black">
              {pendingStudents.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSection('news')}
          className={`py-2 px-4 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
            activeSection === 'news' ? 'bg-white text-black font-bold shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          <span>Новости студии ({news.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('notifications')}
          className={`py-2 px-4 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
            activeSection === 'notifications' ? 'bg-white text-black font-bold shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Push-уведомления</span>
        </button>

        <button
          onClick={() => setActiveSection('attendance')}
          className={`py-2 px-4 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
            activeSection === 'attendance' ? 'bg-white text-black font-bold shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Журнал посещаемости</span>
        </button>

        <button
          onClick={() => setActiveSection('students')}
          className={`py-2 px-4 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
            activeSection === 'students' ? 'bg-white text-black font-bold shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Список учениц ({activeStudents.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('debt')}
          className={`py-2 px-4 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
            activeSection === 'debt' ? 'bg-white text-black font-bold shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Оплата и долги</span>
          {debtors.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-black">
              {debtors.length}
            </span>
          )}
        </button>
      </div>

      {/* SECTION: NEWS MANAGEMENT */}
      {activeSection === 'news' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Опубликовать новую новость</span>
            </h2>
            <form onSubmit={handleAddNews} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Заголовок новости</label>
                <input
                  type="text"
                  required
                  placeholder="Например: Перенос репетиции к отчетному концерту"
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
                  placeholder="Подробный текст новости для учениц студии..."
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
                    className="bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 text-white text-xs"
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
                    id="pinnedCheck"
                    checked={newsPinned}
                    onChange={(e) => setNewsPinned(e.target.checked)}
                    className="rounded bg-neutral-950 border-neutral-800 w-4 h-4"
                  />
                  <label htmlFor="pinnedCheck" className="text-neutral-300 cursor-pointer">
                    Закрепить вверху ленты
                  </label>
                </div>

                <div className="pt-5 ml-auto">
                  <button
                    type="submit"
                    className="py-2 px-5 rounded-xl bg-white hover:bg-neutral-200 text-black font-extrabold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Опубликовать в ленту</span>
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

      {/* SECTION: PUSH NOTIFICATIONS */}
      {activeSection === 'notifications' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span>Отправить Push / Системное уведомление</span>
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
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 text-white text-xs"
                  >
                    <option value="all">Всем ученицам студии ARVESTI</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>Группа {g.name} ({g.age_category})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Тип уведомления</label>
                  <select
                    value={notifType}
                    onChange={(e: any) => setNotifType(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 text-white text-xs"
                  >
                    <option value="reminder">🔔 Напоминание об оплате абонемента</option>
                    <option value="schedule">📅 Перенос или отмена занятия</option>
                    <option value="urgent">⚠️ Срочное важное сообщение</option>
                    <option value="announcement">📢 Общий анонс студии</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Заголовок уведомления</label>
                <input
                  type="text"
                  required
                  placeholder="Например: Напоминание об оплате абонемента за октябрь"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Текст сообщения</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Текст уведомления, который сразу отобразится у учениц в кабинете..."
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
                  <span>Отправить уведомление сейчас</span>
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-white text-sm">История отправленных уведомлений</h3>
            <div className="grid gap-3">
              {notifications.map((item) => (
                <div key={item.id} className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900/80 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{item.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                        {item.target_group_id === 'all' ? 'Все группы' : groups.find(g => g.id === item.target_group_id)?.name}
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

      {/* SECTION: ATTENDANCE */}
      {activeSection === 'attendance' && (
        <div className="space-y-6">
          <AttendanceCharts groups={groups} />
        </div>
      )}

      {/* SECTION: STUDENTS */}
      {activeSection === 'students' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Список учениц ({filteredStudents.length})</h2>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl py-1.5 px-3 text-xs text-white"
            >
              <option value="all">Все группы</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-900">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-950 text-neutral-400 font-semibold border-b border-neutral-800">
                <tr>
                  <th className="p-3.5">ФИО Ученицы</th>
                  <th className="p-3.5">Телефон</th>
                  <th className="p-3.5">Группа</th>
                  <th className="p-3.5">Тип</th>
                  <th className="p-3.5">Оплата</th>
                  <th className="p-3.5 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-neutral-800/40">
                    <td className="p-3.5 font-bold text-white">{st.full_name}</td>
                    <td className="p-3.5 font-mono text-neutral-400">{st.phone}</td>
                    <td className="p-3.5">{groups.find(g => g.id === st.group_id)?.name || '—'}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-neutral-800 text-[11px]">
                        {st.account_type === 'subscription' ? 'Абонемент' : 'Разовые'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                        st.payment_status === 'paid'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border border-red-500/30'
                      }`}>
                        {st.payment_status === 'paid' ? 'Оплачено' : 'Долг'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleTogglePaymentStatus(st.id)}
                        className="py-1 px-2.5 rounded-lg border border-neutral-700 hover:border-white text-[11px] text-white transition-colors cursor-pointer"
                      >
                        {st.payment_status === 'paid' ? 'Сделать долг' : 'Оплачено'}
                      </button>
                      <button
                        onClick={() => setEditingStudent(st)}
                        className="py-1 px-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[11px] text-white transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION: REQUESTS */}
      {activeSection === 'requests' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white">Входящие заявки на регистрацию</h2>
          {pendingStudents.length === 0 ? (
            <div className="p-8 rounded-2xl border border-neutral-800 bg-neutral-900/50 text-center">
              <CheckCircle2 className="w-8 h-8 text-neutral-500 mx-auto mb-2" />
              <p className="text-sm text-neutral-400">Нет новых заявок, ожидающих подтверждения.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {pendingStudents.map((st) => (
                <div
                  key={st.id}
                  className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{st.full_name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                        {st.account_type === 'subscription' ? 'Абонемент' : 'Разовые'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 font-mono">{st.phone}</p>
                    <p className="text-xs text-neutral-500">
                      Группа: {groups.find(g => g.id === st.group_id)?.name || st.group_id}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveStudent(st.id)}
                      className="py-1.5 px-3 rounded-xl bg-white hover:bg-neutral-200 text-black font-extrabold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      <span>Одобрить</span>
                    </button>
                    <button
                      onClick={() => handleRejectStudent(st.id)}
                      className="py-1.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Отклонить</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION: DEBT */}
      {activeSection === 'debt' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white">Список должников по абонементам</h2>
          {debtors.length === 0 ? (
            <div className="p-8 rounded-2xl border border-neutral-800 bg-neutral-900/50 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm text-neutral-300">Все абонементы оплачены в срок! Должников нет.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {debtors.map((st) => (
                <div
                  key={st.id}
                  className="p-4 rounded-2xl border border-red-500/30 bg-red-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-bold text-white text-sm">{st.full_name}</p>
                    <p className="text-xs text-neutral-400 font-mono">{st.phone}</p>
                    <p className="text-xs text-red-400 mt-1">Срок оплаты истёк ({st.payment_due_date || 'Конец месяца'})</p>
                  </div>
                  <button
                    onClick={() => handleTogglePaymentStatus(st.id)}
                    className="py-1.5 px-3 rounded-xl bg-white hover:bg-neutral-200 text-black font-extrabold text-xs transition-colors cursor-pointer"
                  >
                    Отметить как оплачено
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: EDIT STUDENT */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-bold text-white text-base">Редактирование ученицы</h3>
            <form onSubmit={handleSaveStudentEdit} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-300 mb-1">ФИО</label>
                <input
                  type="text"
                  value={editingStudent.full_name}
                  onChange={(e) => setEditingStudent({ ...editingStudent, full_name: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-300 mb-1">Телефон</label>
                <input
                  type="text"
                  value={editingStudent.phone}
                  onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-neutral-300 mb-1">Группа</label>
                <select
                  value={editingStudent.group_id || 'grp-1'}
                  onChange={(e) => setEditingStudent({ ...editingStudent, group_id: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white"
                >
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name} ({g.age_category})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-neutral-300 mb-1">Тип посещений</label>
                <select
                  value={editingStudent.account_type}
                  onChange={(e: any) => setEditingStudent({ ...editingStudent, account_type: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white"
                >
                  <option value="subscription">Абонемент</option>
                  <option value="drop_in">Разовые визиты</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="flex-1 py-2 rounded-xl bg-neutral-800 text-neutral-300"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-white text-black font-bold"
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
