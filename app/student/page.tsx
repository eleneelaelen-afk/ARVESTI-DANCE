'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  LogOut,
  Phone,
  ShieldAlert,
} from 'lucide-react';
import { ProfileRow, GroupRow, NewsRow, AppNotificationRow, StudioRuleSection } from '@/types/database';

export default function StudentDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'news' | 'rules' | 'account'>('dashboard');
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [group, setGroup] = useState<GroupRow | null>(null);
  const [news, setNews] = useState<NewsRow[]>([]);
  const [notifications, setNotifications] = useState<AppNotificationRow[]>([]);
  const [rules, setRules] = useState<StudioRuleSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  // Push-уведомления
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<string>('default');
  const [activeToast, setActiveToast] = useState<AppNotificationRow | null>(null);

  // Статус посещаемости: 'going' (буду), 'not_going' (не смогу), 'unconfirmed' (не выбрано)
  const [attendanceStatus, setAttendanceStatus] = useState<'going' | 'not_going' | 'unconfirmed'>('unconfirmed');
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (typeof window === 'undefined') return;

      // Проверяем поддержку Push-уведомлений браузером
      if ('Notification' in window) {
        setPushSupported(true);
        setPushPermission(Notification.permission);
      }

      const current = localStorage.getItem('arvesti_current_student');
      let st: ProfileRow | null = null;
      if (current) {
        try {
          st = JSON.parse(current);
          setProfile(st);
        } catch {}
      }

      if (!st) {
        router.push('/');
        return;
      }

      // Сохранение сессии в cookie на мобильных устройствах (10 лет)
      if (typeof document !== 'undefined') {
        document.cookie = `arvesti_student_id=${st.id}; path=/; max-age=315360000; SameSite=Lax`;
      }

      // Определяем группу
      const grpId = st.group_id || 'grp-1';
      setGroup({
        id: grpId,
        name: grpId === 'grp-2' ? 'ARVESTI 2.0' : grpId === 'grp-3' ? 'ARVESTI 3.0' : grpId === 'grp-4' ? 'ARVESTI 4.0' : 'ARVESTI 1.0',
        age_category: grpId === 'grp-3' || grpId === 'grp-4' ? 'Младшая группа' : 'Старшая группа',
        schedule: grpId === 'grp-1' ? 'Четверг, Суббота' : 'Суббота, Воскресенье',
        time: grpId === 'grp-1' ? '19:00 - 20:30' : grpId === 'grp-2' ? '17:00 - 18:30' : grpId === 'grp-3' ? '14:00 - 15:30' : '15:30 - 17:00',
        days_of_week: ['Чт', 'Сб'],
      });

      // Загружаем актуальный профиль и посещаемость из Supabase
      try {
        const [profileRes, newsRes, notifsRes, rulesRes, attendRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', st.id).maybeSingle(),
          supabase.from('news').select('*').order('created_at', { ascending: false }),
          supabase.from('notifications').select('*').order('created_at', { ascending: false }),
          supabase.from('studio_rules').select('*').order('sort_order', { ascending: true }),
          supabase.from('attendance').select('*').eq('student_id', st.id).maybeSingle(),
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
              title: 'Посещение и пропуски занятий',
              items: [
                'При невозможности посетить тренировку необходимо предупредить педагога заранее через личный кабинет (кнопка «Не смогу»).',
                'Пропущенные по уважительной причине занятия можно отработать с параллельной группой в течение текущего месяца.',
                'В случае отмены занятия педагогом, студия назначает дату полноценной отработки.',
              ],
              sort_order: 2,
            },
            {
              id: 3,
              title: 'Оплата абонементов и разовые визиты',
              items: [
                'Оплата абонемента производится строго с 27 числа текущего месяца до конца месяца на следующий расчётный период.',
                'В случае задержки оплаты место в группе не гарантируется.',
                'Разовые посещения осуществляются только по предварительной заявке при наличии свободных мест в зале.',
              ],
              sort_order: 3,
            },
          ]);
        }
      } catch (err) {
        console.error('Ошибка загрузки данных:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router, supabase]);

  // ПОДПИСКА НА PUSH-УВЕДОМЛЕНИЯ В РЕАЛЬНОМ ВРЕМЕНИ ИЗ SUPABASE
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel('student_push_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const newNotif = payload.new as AppNotificationRow;
          if (!newNotif) return;

          if (newNotif.target_group_id === 'all' || newNotif.target_group_id === profile.group_id) {
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification(newNotif.title, {
                  body: newNotif.message,
                  icon: '/favicon.ico',
                  badge: '/favicon.ico',
                });
              } catch (e) {
                console.warn('Notification error:', e);
              }
            }

            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              try {
                navigator.vibrate([200, 100, 200]);
              } catch {}
            }

            setActiveToast(newNotif);
            setNotifications((prev) => [newNotif, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, profile?.group_id, supabase]);

  // ЗАПРОС РАЗРЕШЕНИЯ НА PUSH-УВЕДОМЛЕНИЯ
  const handleRequestPush = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setPushPermission(perm);
        if (perm === 'granted') {
          new Notification('Студия ARVESTI', {
            body: 'Push-уведомления успешно включены! Вы будете мгновенно получать новости студии и переносы занятий.',
            icon: '/favicon.ico',
          });
        }
      } catch (e) {
        console.warn('Push error:', e);
      }
    }
  };

  // НАЖАТИЕ КНОПОК «Я БУДУ» И «НЕ СМОГУ»
  const handleSetAttendance = async (status: 'going' | 'not_going') => {
    if (!profile) return;
    setAttendanceLoading(true);
    setAttendanceStatus(status);

    const timeStr = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const dateStr = new Date().toLocaleDateString('ru-RU');
    const noteText = status === 'going' ? `Будет на занятии (отмечено ${dateStr} ${timeStr})` : `Не сможет прийти (отмечено ${dateStr} ${timeStr})`;

    try {
      await supabase
        .from('profiles')
        .update({
          notes: noteText,
          attendance_status: status,
          attendance_date: dateStr,
        })
        .eq('id', profile.id);
    } catch (e) {
      console.warn('Обновление profiles:', e);
    }

    try {
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
      console.warn('Обновление attendance:', e);
    }

    const updated = {
      ...profile,
      notes: noteText,
      attendance_status: status,
      attendance_date: dateStr,
    };
    setProfile(updated);
    localStorage.setItem('arvesti_current_student', JSON.stringify(updated));
    setAttendanceLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('arvesti_current_student');
    if (typeof document !== 'undefined') {
      document.cookie = 'arvesti_student_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
    router.push('/');
  };

  if (loading) {
    return <div className="text-center py-20 text-neutral-400 text-xs">Загрузка личного кабинета...</div>;
  }

  return (
    <div className="space-y-5 pb-24 max-w-lg mx-auto">
      {/* ВСПЛЫВАЮЩИЙ PUSH-БАННЕР В РЕАЛЬНОМ ВРЕМЕНИ */}
      {activeToast && (
        <div className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto p-4 rounded-2xl bg-white text-black shadow-2xl border border-neutral-200 animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-xl bg-black text-white shrink-0">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <p className="font-black text-xs uppercase tracking-wider text-neutral-500">Студия ARVESTI</p>
                <h4 className="font-bold text-sm leading-tight text-black mt-0.5">{activeToast.title}</h4>
                <p className="text-xs text-neutral-700 mt-1">{activeToast.message}</p>
              </div>
            </div>
            <button
              onClick={() => setActiveToast(null)}
              className="p-1 rounded-lg text-neutral-400 hover:text-black transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Верхняя панель ученицы */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4 pt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center font-black text-base shadow">
            {profile?.full_name?.charAt(0) || 'У'}
          </div>
          <div>
            <h1 className="text-base font-black text-white leading-tight">{profile?.full_name}</h1>
            <p className="text-[11px] text-neutral-400">
              @{profile?.username} • <span className="text-white font-medium">{group?.name}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
          title="Уведомления"
        >
          <Bell className="w-4 h-4" />
          {notifications.length > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
          )}
        </button>
      </div>

      {/* ПЛАШКА ВКЛЮЧЕНИЯ PUSH-УВЕДОМЛЕНИЙ НА СМАРТФОНЕ */}
      {pushSupported && pushPermission !== 'granted' && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <div>
              <p className="font-bold text-amber-300">Включите push-уведомления</p>
              <p className="text-[11px] text-neutral-400">Мгновенные оповещения об отменах и переносах</p>
            </div>
          </div>
          <button
            onClick={handleRequestPush}
            className="py-1.5 px-3.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-extrabold text-xs transition-colors shrink-0 cursor-pointer shadow"
          >
            Включить
          </button>
        </div>
      )}

      {/* Выпадающие уведомления */}
      {showNotifications && (
        <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900 space-y-3 shadow-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-white" />
              <span>Уведомления студии</span>
            </h3>
            <button
              onClick={() => setShowNotifications(false)}
              className="text-[11px] text-neutral-500 hover:text-white"
            >
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

      {/* 1. ВКЛАДКА: ГЛАВНАЯ */}
      {activeTab === 'dashboard' && (
        <div className="space-y-5">
          {/* КАРТОЧКА: СЛЕДУЮЩЕЕ ЗАНЯТИЕ */}
          <div className="p-6 rounded-3xl border border-neutral-800 bg-neutral-900/90 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <CalendarCheck className="w-5 h-5" />
                <span>Следующее занятие</span>
              </div>
              <span className="text-xs text-neutral-400 font-medium">
                {group?.name}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1">
                <p className="text-neutral-500 text-[11px]">Дни и время:</p>
                <p className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{group?.schedule} • {group?.time}</span>
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1">
                <p className="text-neutral-500 text-[11px]">Место проведения:</p>
                <p className="font-bold text-white text-xs flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                  <span>ТРЦ «Арбат», 17</span>
                </p>
              </div>
            </div>

            {/* БЛОК ОТМЕТКИ ПОСЕЩАЕМОСТИ: ДВЕ КНОПКИ «Я БУДУ» И «НЕ СМОГУ» */}
            <div className="pt-2 border-t border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-neutral-300">
                  Вы планируете быть на занятии?
                </p>
                {attendanceStatus === 'going' && (
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Вы будете
                  </span>
                )}
                {attendanceStatus === 'not_going' && (
                  <span className="text-[11px] font-bold text-red-400 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Не сможете
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
                  <Check className="w-4 h-4" />
                  <span>Я буду</span>
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
                  <X className="w-4 h-4" />
                  <span>Не смогу</span>
                </button>
              </div>

              {attendanceStatus !== 'unconfirmed' && (
                <p className="text-[11px] text-neutral-400 text-center pt-1">
                  Руководитель видит вашу отметку. Вы можете изменить свой выбор в любой момент.
                </p>
              )}
            </div>
          </div>

          {/* КАРТОЧКА: АБОНЕМЕНТ */}
          <div className="p-5 rounded-3xl border border-neutral-800 bg-neutral-900/90 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <CreditCard className="w-4 h-4" />
                <span>Абонемент и оплата</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                profile?.payment_status === 'paid'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {profile?.payment_status === 'paid' ? 'Оплачен' : 'Задолженность'}
              </span>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Формат: <strong className="text-white">{profile?.account_type === 'subscription' ? 'Месячный абонемент' : 'Разовые визиты'}</strong>. 
              Действует до: <strong className="text-white">{profile?.payment_due_date || '31.10.2026'}</strong>.
            </p>

            {profile?.payment_status === 'overdue' && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Пожалуйста, внесите оплату за текущий месяц руководителю Линде Азизян.</span>
              </div>
            )}
          </div>

          {/* СВЕЖИЕ НОВОСТИ НА ГЛАВНОЙ */}
          {news.length > 0 && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  <span>Важные новости</span>
                </h3>
                <button
                  onClick={() => setActiveTab('news')}
                  className="text-[11px] text-neutral-400 hover:text-white"
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

      {/* 2. ВКЛАДКА: НОВОСТИ */}
      {activeTab === 'news' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Newspaper className="w-5 h-5" />
              <span>Новости студии ({news.length})</span>
            </h2>
          </div>

          {news.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-500">
              Пока нет опубликованных новостей.
            </div>
          ) : (
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
          )}
        </div>
      )}

      {/* 3. ВКЛАДКА: ПРАВИЛА */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
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

      {/* 4. ВКЛАДКА: АККАУНТ */}
      {activeTab === 'account' && (
        <div className="space-y-5">
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <UserIcon className="w-5 h-5" />
            <span>Профиль ученицы</span>
          </h2>

          <div className="p-6 rounded-3xl border border-neutral-800 bg-neutral-900/90 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-neutral-800">
              <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center font-black text-lg">
                {profile?.full_name?.charAt(0)}
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
                <span className="font-semibold text-white">{group?.name} ({group?.age_category})</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-400">Расписание группы:</span>
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
                onClick={handleLogout}
                className="w-full py-3 px-4 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Выйти из аккаунта</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* НИЖНЯЯ ПАНЕЛЬ НАВИГАЦИИ ПО РАЗДЕЛАМ */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-md border-t border-neutral-800 safe-bottom">
        <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center w-full h-full py-1 transition-colors cursor-pointer ${
              activeTab === 'dashboard' ? 'text-white font-bold' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Home className={`w-5 h-5 transition-transform ${activeTab === 'dashboard' ? 'scale-110 text-white' : ''}`} />
            <span className="text-[10px] mt-1">Главная</span>
          </button>

          <button
            onClick={() => setActiveTab('news')}
            className={`flex flex-col items-center justify-center w-full h-full py-1 transition-colors cursor-pointer ${
              activeTab === 'news' ? 'text-white font-bold' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Newspaper className={`w-5 h-5 transition-transform ${activeTab === 'news' ? 'scale-110 text-white' : ''}`} />
            <span className="text-[10px] mt-1">Новости</span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`flex flex-col items-center justify-center w-full h-full py-1 transition-colors cursor-pointer ${
              activeTab === 'rules' ? 'text-white font-bold' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <BookOpen className={`w-5 h-5 transition-transform ${activeTab === 'rules' ? 'scale-110 text-white' : ''}`} />
            <span className="text-[10px] mt-1">Правила</span>
          </button>

          <button
            onClick={() => setActiveTab('account')}
            className={`flex flex-col items-center justify-center w-full h-full py-1 transition-colors cursor-pointer ${
              activeTab === 'account' ? 'text-white font-bold' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <UserIcon className={`w-5 h-5 transition-transform ${activeTab === 'account' ? 'scale-110 text-white' : ''}`} />
            <span className="text-[10px] mt-1">Аккаунт</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
