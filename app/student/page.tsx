'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Bell,
  Newspaper,
  User,
  CreditCard,
  MapPin,
  Clock,
} from 'lucide-react';
import { ProfileRow, LessonRow, GroupRow, NewsRow, AppNotificationRow } from '@/types/database';

export default function StudentDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [group, setGroup] = useState<GroupRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [markedAbsence, setMarkedAbsence] = useState(false);

  // Новости
  const [news] = useState<NewsRow[]>([
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

  // Уведомления
  const [notifications] = useState<AppNotificationRow[]>([
    {
      id: 'notif-1',
      target_group_id: 'all',
      title: 'Форма для тренировок',
      message: 'Не забывайте брать чистую сменную обувь (балетки или чешки) и удобную тренировочную одежду.',
      type: 'reminder',
      created_at: '24.09.2026 14:00',
    },
  ]);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Fallback demo profile
        setProfile({
          id: 'demo-student',
          phone: '+7 (928) 000-00-00',
          full_name: 'Мадина Карданова',
          role: 'student',
          group_id: 'grp-1',
          account_type: 'subscription',
          payment_status: 'paid',
          payment_due_date: '31.10.2026',
          status: 'active',
        });
        setGroup({
          id: 'grp-1',
          name: 'ARVESTI 1.0',
          age_category: 'Старшая группа',
          schedule: 'Четверг, Суббота',
          time: '19:00 - 20:30',
          days_of_week: ['Чт', 'Сб'],
        });
      } else {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (prof) setProfile(prof as ProfileRow);
        setGroup({
          id: 'grp-1',
          name: 'ARVESTI 1.0',
          age_category: 'Старшая группа',
          schedule: 'Четверг, Суббота',
          time: '19:00 - 20:30',
          days_of_week: ['Чт', 'Сб'],
        });
      }
      setLoading(false);
    }
    loadData();
  }, [supabase]);

  if (loading) {
    return <div className="text-center py-20 text-neutral-400">Загрузка личного кабинета...</div>;
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white">Кабинет ученицы</h1>
          <p className="text-xs text-neutral-400 mt-1">
            {profile?.full_name} • Группа: {group?.name} ({group?.age_category})
          </p>
        </div>

        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative py-2 px-3.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-semibold flex items-center gap-2 hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <Bell className="w-4 h-4 text-white" />
          <span>Уведомления</span>
          <span className="w-2 h-2 rounded-full bg-red-500" />
        </button>
      </div>

      {/* Notifications Drawer */}
      {showNotifications && (
        <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/90 space-y-3">
          <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Уведомления от студии</h3>
          {notifications.map(n => (
            <div key={n.id} className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs space-y-1">
              <p className="font-bold text-white">{n.title}</p>
              <p className="text-neutral-400">{n.message}</p>
              <p className="text-[10px] text-neutral-500">{n.created_at}</p>
            </div>
          ))}
        </div>
      )}

      {/* Next Lesson Card */}
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
            <p className="text-neutral-400">Дата и время:</p>
            <p className="font-black text-white text-sm flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>Суббота, 26 сентября • {group?.time}</span>
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

        {/* Absence Action */}
        <div className="pt-2 flex items-center justify-between">
          <p className="text-xs text-neutral-400">Планируете присутствовать на занятии?</p>
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
              <span>Вы отметили пропуск. Преподаватель уведомлен.</span>
            </div>
          )}
        </div>
      </div>

      {/* Subscription Status Card */}
      <div className="p-6 rounded-3xl border border-neutral-800 bg-neutral-900/90 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <CreditCard className="w-5 h-5" />
            <span>Статус абонемента</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
            Оплачен
          </span>
        </div>
        <p className="text-xs text-neutral-400">
          Тип: {profile?.account_type === 'subscription' ? 'Месячный абонемент' : 'Разовые занятия'}. 
          Действует до: <strong className="text-white">{profile?.payment_due_date || '31.10.2026'}</strong>.
        </p>
      </div>

      {/* News Feed */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-base">
          <Newspaper className="w-5 h-5" />
          <span>Новости и объявления студии ARVESTI</span>
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
              <p className="text-xs text-neutral-300 leading-relaxed">{item.content}</p>
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
