'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  CalendarCheck,
  XCircle,
  Bell,
  Newspaper,
  CreditCard,
  MapPin,
  Clock,
} from 'lucide-react';
import { ProfileRow, GroupRow, NewsRow, AppNotificationRow } from '@/types/database';

export default function StudentDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [group, setGroup] = useState<GroupRow | null>(null);
  const [news, setNews] = useState<NewsRow[]>([]);
  const [notifications, setNotifications] = useState<AppNotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [markedAbsence, setMarkedAbsence] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (typeof window === 'undefined') return;

      // 1. Профиль ученицы
      const current = localStorage.getItem('arvesti_current_student');
      let st: ProfileRow | null = null;
      if (current) {
        try {
          st = JSON.parse(current);
          setProfile(st);
        } catch {}
      }

      if (st) {
        setGroup({
          id: st.group_id || 'grp-1',
          name: st.group_id === 'grp-2' ? 'ARVESTI 2.0' : st.group_id === 'grp-3' ? 'ARVESTI 3.0' : st.group_id === 'grp-4' ? 'ARVESTI 4.0' : 'ARVESTI 1.0',
          age_category: st.group_id === 'grp-3' || st.group_id === 'grp-4' ? 'Младшая группа' : 'Старшая группа',
          schedule: st.group_id === 'grp-1' ? 'Четверг, Суббота' : 'Суббота, Воскресенье',
          time: st.group_id === 'grp-1' ? '19:00 - 20:30' : st.group_id === 'grp-2' ? '17:00 - 18:30' : st.group_id === 'grp-3' ? '14:00 - 15:30' : '15:30 - 17:00',
          days_of_week: ['Чт', 'Сб'],
        });
      }

      // 2. Загрузка новостей и уведомлений из Supabase в реальном времени
      try {
        const [newsRes, notifsRes] = await Promise.all([
          supabase.from('news').select('*').order('created_at', { ascending: false }),
          supabase.from('notifications').select('*').order('created_at', { ascending: false }),
        ]);

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
        console.error('Ошибка загрузки новостей из Supabase:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [supabase]);

  if (loading) {
    return <div className="text-center py-20 text-neutral-400">Загрузка личного кабинета...</div>;
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Шапка */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white">Кабинет ученицы</h1>
          <p className="text-xs text-neutral-400 mt-1">
            {profile?.full_name} • Логин: @{profile?.username} • Группа: {group?.name}
          </p>
        </div>

        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative py-2 px-3.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-semibold flex items-center gap-2 hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <Bell className="w-4 h-4 text-white" />
          <span>Уведомления</span>
          {notifications.length > 0 && <span className="w-2 h-2 rounded-full bg-red-500" />}
        </button>
      </div>

      {/* Уведомления */}
      {showNotifications && (
        <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/90 space-y-3">
          <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Уведомления от студии</h3>
          {notifications.length === 0 ? (
            <p className="text-xs text-neutral-400">Нет новых уведомлений.</p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs space-y-1">
                <p className="font-bold text-white">{n.title}</p>
                <p className="text-neutral-400">{n.message}</p>
                <p className="text-[10px] text-neutral-500">{n.created_at}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Следующее занятие */}
      <div className="p-6 rounded-3xl border border-neutral-800 bg-neutral-900/90 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <CalendarCheck className="w-5 h-5" />
            <span>Следующее занятие</span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-white text-black text-[11px] font-black uppercase">
            В расписании
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1.5">
            <p className="text-neutral-400">Время занятия:</p>
            <p className="font-black text-white text-sm flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{group?.schedule || 'Чт, Сб'} • {group?.time}</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1.5">
            <p className="text-neutral-400">Локация:</p>
            <p className="font-black text-white text-sm flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>ТРЦ «Арбат», Октябрьская ул., 17</span>
            </p>
          </div>
        </div>

        {/* Отметка пропуска */}
        <div className="pt-2 flex items-center justify-between">
          <p className="text-xs text-neutral-400">Сможете присутствовать на занятии?</p>
          {!markedAbsence ? (
            <button
              onClick={() => setMarkedAbsence(true)}
              className="py-2 px-4 rounded-xl border border-red-500/40 hover:bg-red-500/10 text-red-400 text-xs font-bold transition-colors cursor-pointer"
            >
              Не смогу прийти
            </button>
          ) : (
            <div className="text-xs text-amber-400 flex items-center gap-1.5">
              <XCircle className="w-4 h-4" />
              <span>Вы отметили пропуск. Руководитель предупреждён.</span>
            </div>
          )}
        </div>
      </div>

      {/* Статус абонемента */}
      <div className="p-6 rounded-3xl border border-neutral-800 bg-neutral-900/90 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <CreditCard className="w-5 h-5" />
            <span>Статус абонемента</span>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
            profile?.payment_status === 'paid'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {profile?.payment_status === 'paid' ? 'Оплачен' : 'Задолженность'}
          </span>
        </div>
        <p className="text-xs text-neutral-400">
          Тип: {profile?.account_type === 'subscription' ? 'Месячный абонемент' : 'Разовые занятия'}. 
          Действует до: <strong className="text-white">{profile?.payment_due_date || '31.10.2026'}</strong>.
        </p>
      </div>

      {/* Новости из базы данных Supabase */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-base">
          <Newspaper className="w-5 h-5" />
          <span>Новости студии ARVESTI ({news.length})</span>
        </div>

        <div className="grid gap-3">
          {news.map((item) => (
            <div key={item.id} className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-bold text-white text-sm">{item.title}</h4>
                {item.pinned && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold shrink-0">
                    Закреплено
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-line">{item.content}</p>
              <p className="text-[10px] text-neutral-500 pt-1">
                {item.date} • {item.author}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
