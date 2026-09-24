'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Lock, User, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Phone, AtSign } from 'lucide-react';
import Link from 'next/link';
import { ProfileRow } from '@/types/database';

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<'login' | 'register' | 'admin'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+7 ');
  const [selectedGroup, setSelectedGroup] = useState('grp-1');
  const [accountType, setAccountType] = useState<'subscription' | 'drop_in'>('subscription');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const VALID_ADMIN_PASSWORDS = ['ArvestiAdmin2026!', 'admin123456'];

  // АВТОМАТИЧЕСКИЙ ВХОД: если ученица уже заходила с этого телефона, сразу открываем кабинет
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedStudent = localStorage.getItem('arvesti_current_student');
      if (savedStudent) {
        const student = JSON.parse(savedStudent);
        if (student?.id && student?.status === 'active') {
          router.replace('/student');
          return;
        }
      }

      const match = document.cookie.match(/arvesti_student_id=([^;]+)/);
      if (match && match[1]) {
        router.replace('/student');
        return;
      }

      const adminAuth = localStorage.getItem('arvesti_admin_authorized');
      if (adminAuth === 'true') {
        router.replace('/admin');
        return;
      }
    } catch {}

    setCheckingSession(false);
  }, [router]);

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

    // 1. Вход руководителя
    if (mode === 'admin') {
      const isPasswordValid = VALID_ADMIN_PASSWORDS.includes(password.trim());
      if (!isPasswordValid) {
        setErrorMsg('Неверный пароль администратора студии.');
        setLoading(false);
        return;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('arvesti_admin_authorized', 'true');
        localStorage.removeItem('arvesti_current_student');
      }
      router.push('/admin');
      return;
    }

    // 2. Вход ученицы (по логину и паролю)
    if (mode === 'login') {
      const cleanLogin = username.trim().toLowerCase();
      if (!cleanLogin) {
        setErrorMsg('Введите ваш логин.');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', cleanLogin)
          .maybeSingle();

        let student = data as ProfileRow | null;

        if (!student) {
          if (cleanLogin === 'admin' && VALID_ADMIN_PASSWORDS.includes(password)) {
            localStorage.setItem('arvesti_admin_authorized', 'true');
            router.push('/admin');
            return;
          }
          setErrorMsg('Ученица с таким логином не найдена. Проверьте логин или зарегистрируйтесь.');
          setLoading(false);
          return;
        }

        if (student.password && student.password !== password) {
          setErrorMsg('Неверный пароль. Пожалуйста, проверьте введённые данные.');
          setLoading(false);
          return;
        }

        if (student.status === 'pending') {
          setErrorMsg('Ваша заявка ожидает подтверждения руководителем студии. Линда Азизян подтвердит её в ближайшее время.');
          setLoading(false);
          return;
        }

        if (student.status === 'rejected' || student.status === 'inactive') {
          setErrorMsg('Заявка была отклонена или аккаунт деактивирован.');
          setLoading(false);
          return;
        }

        // Сохраняем сессию навсегда
        localStorage.setItem('arvesti_current_student', JSON.stringify(student));
        if (typeof document !== 'undefined') {
          document.cookie = `arvesti_student_id=${student.id}; path=/; max-age=315360000; SameSite=Lax`;
        }
        localStorage.removeItem('arvesti_admin_authorized');
        router.push('/student');
        return;
      } catch (err: any) {
        setErrorMsg('Ошибка входа: ' + (err.message || 'попробуйте позже'));
      } finally {
        setLoading(false);
      }
      return;
    }

    // 3. Регистрация новой ученицы
    if (mode === 'register') {
      const cleanLogin = username.trim().toLowerCase();
      if (!fullName.trim()) {
        setErrorMsg('Укажите ФИО ученицы.');
        setLoading(false);
        return;
      }
      if (!cleanLogin || cleanLogin.length < 3) {
        setErrorMsg('Логин должен быть не короче 3 символов.');
        setLoading(false);
        return;
      }
      if (password.length < 4) {
        setErrorMsg('Пароль должен быть не короче 4 символов.');
        setLoading(false);
        return;
      }

      try {
        const newStudentId = 'student-' + Date.now();
        const newStudent = {
          id: newStudentId,
          username: cleanLogin,
          password: password,
          full_name: fullName.trim(),
          phone: phone.trim(),
          role: 'student',
          group_id: selectedGroup,
          account_type: accountType,
          payment_status: 'paid',
          payment_due_date: 'до 31.10.2026',
          status: 'pending',
          notes: 'Новая заявка через сайт',
        };

        const { error: insertError } = await supabase.from('profiles').insert([newStudent]);

        if (insertError) {
          if (insertError.message?.includes('duplicate key') || insertError.code === '23505') {
            setErrorMsg('Ученица с таким логином уже зарегистрирована. Выберите другой логин.');
            setLoading(false);
            return;
          }
          setErrorMsg('Ошибка сохранения: ' + insertError.message);
          setLoading(false);
          return;
        }

        setSuccessMsg('Заявка успешно отправлена руководителю студии! После одобрения вы сможете войти.');
        setMode('login');
        setPassword('');
      } catch (err: any) {
        setErrorMsg('Ошибка регистрации: ' + (err.message || 'попробуйте снова'));
      } finally {
        setLoading(false);
      }
    }
  };

  if (checkingSession) {
    return (
      <div className="py-32 text-center space-y-3">
        <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-neutral-400 font-medium tracking-wide">Вход в студию ARVESTI...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 py-6 max-w-md mx-auto">
      <section className="text-center space-y-3">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white uppercase">
          ARVESTI
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400">
          Студия кавказских танцев в Пятигорске • ТРЦ «Арбат», Октябрьская ул., 17
        </p>
      </section>

      <div className="p-6 sm:p-8 rounded-3xl border border-neutral-800 bg-neutral-900/90 shadow-2xl space-y-6">
        <div className="flex rounded-2xl bg-neutral-950 p-1 border border-neutral-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-2.5 rounded-xl transition-all ${
              mode === 'login' ? 'bg-white text-black font-bold shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Вход
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-2.5 rounded-xl transition-all ${
              mode === 'register' ? 'bg-white text-black font-bold shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Регистрация
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4 text-xs">
          {mode === 'register' && (
            <div>
              <label className="block text-neutral-300 font-semibold mb-1">ФИО Ученицы</label>
              <input
                type="text"
                required
                placeholder="Например: Алина Григорян"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-white"
              />
            </div>
          )}

          <div>
            <label className="block text-neutral-300 font-semibold mb-1">
              {mode === 'admin' ? 'Логин администратора' : 'Логин'}
            </label>
            <input
              type="text"
              required
              placeholder={mode === 'admin' ? 'admin' : 'username'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-white"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-neutral-300 font-semibold mb-1">Номер телефона</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={handlePhoneChange}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 text-white font-mono focus:outline-none focus:border-white"
              />
            </div>
          )}

          <div>
            <label className="block text-neutral-300 font-semibold mb-1">Пароль</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-white"
            />
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Группа обучения</label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-white cursor-pointer"
                >
                  <option value="grp-1">ARVESTI 1.0 (Старшая, Чт/Сб)</option>
                  <option value="grp-2">ARVESTI 2.0 (Старшая, Сб/Вс)</option>
                  <option value="grp-3">ARVESTI 3.0 (Младшая, Сб/Вс)</option>
                  <option value="grp-4">ARVESTI 4.0 (Младшая, Сб/Вс)</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Тип посещений</label>
                <select
                  value={accountType}
                  onChange={(e: any) => setAccountType(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-white cursor-pointer"
                >
                  <option value="subscription">Месячный абонемент</option>
                  <option value="drop_in">Разовые посещения</option>
                </select>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-neutral-200 text-black font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow disabled:opacity-50"
          >
            {loading ? (
              <span>Обработка...</span>
            ) : mode === 'register' ? (
              <span>Отправить заявку руководителю</span>
            ) : (
              <span>Войти в личный кабинет</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
