import './globals.css';

export const metadata = { title: 'Vest Tune', description: 'ECU file analysis tool' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="da"><body>{children}</body></html>;
}
