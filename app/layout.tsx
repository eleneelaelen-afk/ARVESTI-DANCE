import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'ARVESTI — Студия кавказских танцев в Пятигорске',
  description: 'Личный кабинет учениц, расписание, журнал посещаемости и правила студии танцев ARVESTI под руководством Линды Азизян. ТРЦ «Арбат», Октябрьская ул., 17, Пятигорск.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="bg-neutral-950 text-neutral-100 min-h-screen flex flex-col antialiased selection:bg-white selection:text-black">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
        <footer className="border-t border-neutral-900 py-6 text-center text-xs text-neutral-500">
          <p>© {new Date().getFullYear()} ARVESTI. Студия кавказских танцев • Руководитель Линда Азизян • ТРЦ «Арбат», Октябрьская ул., 17, Пятигорск</p>
        </footer>
      </body>
    </html>
  );
}
