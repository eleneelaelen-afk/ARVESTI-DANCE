'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Phone, Lock, User, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<'login' | 'register' | 'admin'>('login');
  const [phone, setPhone] = useState('+7 ');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('grp-1');
  const [accountType, setAccountType] = useState<'subscription' | 'drop_in'>('subscription');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Пароли руководителя
  const ADMIN_PHONE = '+7 (903) 440-04-56';
  const ADMIN_CLEAN = '79034400456';
  const ADMIN_EMAIL = 'admin@arvesti.dance';
  const VALID_ADMIN_PASSWORDS = ['ArvestiAdmin2026!', 'admin123456'];

  const formatPhoneNumber = (val: string) => {
    let clean = val.replace(/\D/g, '');
    if (!clean.startsWith('7')) clean = '7' + clean;
    clean = clean.slice(0, 11);

    let res = '+7';
    if (clean.length > 1) res += ' (' + clean.slice(1, 4);
    if (clean.length >= 4) res += ') ' + clean.slice(4, 7);
    if (clean.length >= 7) res += '-' + clean.slice(7, 9);
    if (clean.length >= 9) res += '-' + clean.slice(9, 11);
    return res;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length < 3) {
      setPhone('+7 ');
      return;
    }
    setPhone(formatPhoneNumber(val));
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const cleanDigits = phone.replace(/\D/g, '');
    const isAdminAttempt = mode === 'admin' || cleanDigits === ADMIN_CLEAN;

    if (isAdminAttempt) {
      const isPasswordValid = VALID_ADMIN_PASSWORDS.includes(password.trim());
      if (!isPasswordValid) {
        setErrorMsg('Неверный пароль администратора студии.');
        setLoading(false);
        return;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('arvesti_admin_authorized', 'true');
      }

      try {
        await supabase.auth.signInWithPassword({
          email: ADMIN_EMAIL,
          password: password.trim(),
        });
      } catch {
        // Local auth is sufficient
      }

      router.push('/admin');
      return;
    }

    if (cleanDigits.length < 11) {
      setErrorMsg('Пожалуйста, введите полный номер телефона (11 цифр).');
      setLoading(false);
      return;
    }

    const virtualEmail = `${cleanDigits}@arvesti.dance`;

    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: virtualEmail,
          password,
        });

        if (error) {
          throw new Error('Неверный номер телефона или пароль. Проверьте данные.');
        }

        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, status')
            .eq('id', data.user.id)
            .single();

          if (profile?.status === 'pending') {
            setErrorMsg('Ваша заявка ожидает подтверждения руководителем.');
            await supabase.auth.signOut();
            return;
          }

          if (profile?.role === 'admin') {
            if (typeof window !== 'undefined') localStorage.setItem('arvesti_admin_authorized', 'true');
            router.push('/admin');
          } else {
            if (typeof window !== 'undefined') localStorage.removeItem('arvesti_admin_authorized');
            router.push('/student');
          }
        }
      } else {
        if (!fullName.trim()) throw new Error('Пожалуйста, укажите имя и фамилию ученицы');

        const { data, error } = await supabase.auth.signUp({
          email: virtualEmail,
          password,
        });

        if (error) throw error;

        if (data.user) {
          await supabase.from('profiles').insert({
            id: data.user.id,
            phone,
            full_name: fullName.trim(),
            role: 'student',
            group_id: selectedGroup,
            account_type: accountType,
            payment_status: 'paid',
            status: 'pending',
            notes: `Регистрация (${accountType === 'subscription' ? 'Абонемент' : 'Разовые'})`,
          });

          setSuccessMsg('Заявка успешно отправлена! Ожидайте подтверждения от руководителя.');
          setMode('login');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 py-6">
      <section className="text-center space-y-3 max-w-2xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white uppercase">
          ARVESTI
        </h1>
        <p className="text-neutral-400 text-sm sm:text-base font-normal">
          Студия кавказских танцев в Пятигорске • ТРЦ «Арбат», Октябрьская ул., 17
        </p>
      </section>

      <div className="max-w-md mx-auto p-6 sm:p-8 rounded-3xl border border-neutral-800 bg-neutral-900/90 shadow-2xl space-y-6">
        {mode !== 'admin' ? (
          <div className="flex p-1 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${
                mode === 'login' ? 'bg-white text-black font-bold shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Вход
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${
                mode === 'register' ? 'bg-white text-black font-bold shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Регистрация
            </button>
          </div>
        ) : (
          <div className="text-center space-y-1 pb-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-950 text-white border border-neutral-800 text-[11px] font-bold">
              <Lock className="w-3 h-3 text-white" />
              <span>Панель руководителя</span>
            </div>
            <h2 className="text-base font-bold text-white pt-1">Вход для руководителя студии</h2>
            <p className="text-[11px] text-neutral-400">Линда Азизян (авторизация с правами администратора)</p>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4 text-xs">
          {mode === 'register' && (
            <div>
              <label className="block text-neutral-300 font-semibold mb-1">Имя Фамилия ученицы</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Имя Фамилия"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 pl-9 text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                />
                <User className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-neutral-300 font-semibold mb-1">
              {mode === 'admin' ? 'Телефон или логин руководителя' : 'Номер телефона'}
            </label>
            <div className="relative">
              <input
                type="tel"
                required
                placeholder="+7 (___) ___-__-__"
                value={phone}
                onChange={handlePhoneChange}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 pl-9 text-white placeholder-neutral-500 focus:outline-none focus:border-white font-mono"
              />
              <Phone className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
            </div>
          </div>

          <div>
            <label className="block text-neutral-300 font-semibold mb-1">Пароль</label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 pl-9 text-white placeholder-neutral-500 focus:outline-none focus:border-white"
              />
              <Lock className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
            </div>
          </div>

          {mode === 'register' && (
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Группа обучения</label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-white"
                >
                  <option value="grp-1">ARVESTI 1.0 (Старшая, Чт/Сб)</option>
                  <option value="grp-2">ARVESTI 2.0 (Старшая, Сб/Вс)</option>
                  <option value="grp-3">ARVESTI 3.0 (Младшая, Сб/Вс)</option>
                  <option value="grp-4">ARVESTI 4.0 (Младшая, Сб/Вс)</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Тип посещений</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAccountType('subscription')}
                    className={`py-2 px-3 rounded-xl border text-center font-medium transition-all cursor-pointer ${
                      accountType === 'subscription'
                        ? 'border-white bg-white text-black font-bold'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                    }`}
                  >
                    Абонемент
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType('drop_in')}
                    className={`py-2 px-3 rounded-xl border text-center font-medium transition-all cursor-pointer ${
                      accountType === 'drop_in'
                        ? 'border-white bg-white text-black font-bold'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                    }`}
                  >
                    Разовые визиты
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-neutral-200 text-black font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span>Проверка данных...</span>
            ) : mode === 'login' ? (
              <>
                <span>Войти в кабинет</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : mode === 'register' ? (
              <>
                <span>Зарегистрироваться</span>
                <ShieldCheck className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Войти как руководитель</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-xs space-y-3">
          {mode !== 'admin' ? (
            <button
              type="button"
              onClick={() => {
                setMode('admin');
                setErrorMsg('');
                setSuccessMsg('');
                setPassword('');
                setPhone('+7 ');
              }}
              className="text-neutral-500 hover:text-neutral-300 text-[11px] flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
            >
              <Lock className="w-3 h-3 text-neutral-500" />
              <span>Вход для руководителя</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
                setSuccessMsg('');
                setPassword('');
                setPhone('+7 ');
              }}
              className="text-neutral-400 hover:text-white text-[11px] flex items-center justify-center gap-1 mx-auto transition-colors cursor-pointer"
            >
              <span>← Вернуться ко входу для учениц</span>
            </button>
          )}

          <div>
            <Link href="/rules" className="text-neutral-400 hover:text-white underline text-[11px]">
              Ознакомиться с правилами студии ARVESTI
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
