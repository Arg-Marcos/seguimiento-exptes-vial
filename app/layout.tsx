import "./globals.css";

export const metadata = {
  title: "Seguimiento de Exptes. | Seguridad Vial",
  description: "Seguimiento interno de expedientes - Dirección General de Seguridad Vial",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
