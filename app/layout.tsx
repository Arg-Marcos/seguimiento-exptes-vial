import "./globals.css";

export const metadata = {
  icons: { icon: [{ url: "/escudo-dgsv.png?v=2", type: "image/png" }], apple: "/escudo-dgsv.png" },
  title: "Seguimiento de Exptes. | Seguridad Vial",
  description: "Seguimiento interno de expedientes - Dirección General de Seguridad Vial",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
