// Admin layout will be implemented with authentication and sidebar
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      {/* Sidebar will go here */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}