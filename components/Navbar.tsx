'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BookOpen, Shield, User, LogOut, LogIn } from 'lucide-react';
import { ProfileRow } from '@/types/database';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const localAdmin = typeof window !== 'undefined' && localStorage.getItem('arvesti_admin_authorized') === 'true';
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        const p = data as ProfileRow;
        setProfile(p);
        setIsAdmin(p?.role === 'admin' || localAdmin);
      } else {
        setProfile(null);
        setIsAdmin(localAdmin);
      }
      setLoading(false);
    }

    loadUser();
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('arvesti_admin_authorized');
    }
    setProfile(null);
    setIsAdmin(false);
    router.push('/');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-black font-black text-lg tracking-wider shadow-md group-hover:scale-105 transition-transform">
            A
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black tracking-widest text-base text-white group-hover:text-neutral-300 transition-colors">
                ARVESTI
              </span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-300 border border-neutral-700">
                Studio
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 font-medium">Кавказские танцы • Пятигорск</p>
          </div>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3 text-xs">
          <Link
            href="/rules"
            className={`py-1.5 px-3 rounded-xl flex items-center gap-1.5 font-medium transition-colors border ${
              pathname === '/rules'
                ? 'bg-white text-black border-white'
                : 'text-neutral-400 hover:text-white bg-neutral-900/60 border-neutral-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Правила студии</span>
            <span className="sm:hidden">Правила</span>
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              className={`py-1.5 px-3 rounded-xl flex items-center gap-1.5 font-bold transition-colors border ${
                pathname.startsWith('/admin')
                  ? 'bg-white text-black border-white shadow-sm'
                  : 'text-neutral-300 hover:text-white bg-neutral-900/60 border-neutral-800'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Админ-панель</span>
            </Link>
          )}

          {profile && profile.role === 'student' && (
            <Link
              href="/student"
              className={`py-1.5 px-3 rounded-xl flex items-center gap-1.5 font-medium transition-colors border ${
                pathname === '/student'
                  ? 'bg-white text-black border-white'
                  : 'text-neutral-400 hover:text-white bg-neutral-900/60 border-neutral-800'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Мой кабинет</span>
              <span className="sm:hidden">Кабинет</span>
            </Link>
          )}

          {!loading && (
            <>
              {profile || isAdmin ? (
                <button
                  onClick={handleLogout}
                  className="py-1.5 px-3 rounded-xl text-neutral-400 hover:text-red-400 bg-neutral-900/60 border border-neutral-800 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Выход</span>
                </button>
              ) : (
                <Link
                  href="/"
                  className="py-1.5 px-3.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-extrabold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Вход</span>
                </Link>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
