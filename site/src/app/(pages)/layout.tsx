export default function PagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main id="main" className="page-shell">
      <div className="wrap page-wrap">{children}</div>
    </main>
  );
}
