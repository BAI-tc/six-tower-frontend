import Header from '@/app/_components/header';
import Footer from '@/app/_components/footer';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'SixTower',
  description: 'SixTower is a service designed to help users discover games',
  icons: {
    icon: '/11924439-7f57-48d1-8806-49d5abdd7006.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body className={inter.className + ' flex flex-col min-h-screen'}>
        <Header />
        <main className='container mx-auto grow'>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
