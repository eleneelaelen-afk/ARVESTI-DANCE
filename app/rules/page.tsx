'use client';

import React from 'react';
import { BookOpen, ShieldCheck, Phone, MapPin, Instagram, Heart } from 'lucide-react';

export default function RulesPage() {
  const rules = [
    {
      id: 1,
      title: 'Общие правила студии ARVESTI',
      items: [
        'Вход в танцевальный зал строго в чистой сменной обуви (балетки, чешки или носочки). Уличная обувь категорически запрещена.',
        'Приходить на занятие необходимо за 10–15 минут до начала для спокойной подготовки и переодевания.',
        'Во время занятия телефоны должны быть переведены в беззвучный режим.',
        'Бережно относиться к зеркалам, оборудованию и реквизиту студии.',
      ],
    },
    {
      id: 2,
      title: 'Посещение и пропуски занятий',
      items: [
        'При невозможности посетить тренировку предупредите руководителя через личный кабинет (кнопка «Не смогу»).',
        'Пропущенные по уважительной причине занятия можно отработать с параллельной группой в течение текущего месяца.',
        'В случае отмены занятия педагогом назначается дата полноценной отработки.',
      ],
    },
    {
      id: 3,
      title: 'Оплата и абонементы',
      items: [
        'Оплата абонемента на следующий месяц производится строго до 30-го числа текущего месяца.',
        'Абонемент действует в течение календарного месяца.',
        'Разовые занятия оплачиваются непосредственно перед началом тренировки.',
      ],
    },
  ];

  return (
    <div className="space-y-8 max-w-3xl mx-auto py-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-white">Правила студии танцев ARVESTI</h1>
        <p className="text-xs text-neutral-400">
          Студия кавказских танцев в Пятигорске под руководством Линды Азизян
        </p>
      </div>

      <div className="grid gap-6">
        {rules.map((section) => (
          <div key={section.id} className="p-6 rounded-3xl border border-neutral-800 bg-neutral-900/80 space-y-3">
            <h3 className="font-black text-white text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-white" />
              <span>{section.title}</span>
            </h3>
            <ul className="space-y-2 text-xs text-neutral-300">
              {section.items.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-white font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Contacts */}
        <div className="p-6 rounded-3xl border border-neutral-800 bg-neutral-900/80 space-y-3">
          <h3 className="font-black text-white text-base flex items-center gap-2">
            <Heart className="w-5 h-5 text-white" />
            <span>Контакты и локация</span>
          </h3>
          <div className="space-y-2 text-xs text-neutral-300">
            <p className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-neutral-400" />
              <span>г. Пятигорск, ул. Октябрьская, 17, ТРЦ «Арбат»</span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-neutral-400" />
              <span>Линда Азизян: <strong className="text-white">+7 (903) 440-04-56</strong></span>
            </p>
            <p className="flex items-center gap-2">
              <Instagram className="w-4 h-4 text-neutral-400" />
              <span>Instagram: <strong className="text-white">@arvesti.dance</strong></span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
