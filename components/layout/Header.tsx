'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useGlobal } from '@/context/GlobalContext';
import { useSede } from '@/hooks/useSede';
import { Button } from '@/components/ui/Button';

export function Header() {
  const { user, logout } = useGlobal();
  const { configSede } = useSede();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const accentColor = configSede?.colorAccent || '#3B82F6';

  return (
    <header
      className="sticky top-0 z-50 border-b border-[--border] bg-[--surface]/80 backdrop-blur-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo / Name */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-sm"
              style={{ background: accentColor }}
            >
              S
            </div>
            <span className="font-semibold text-sm text-[--foreground] group-hover:text-[--accent] transition-colors">
              {configSede?.nombreAyuntamiento || 'Sede Electrónica'}
            </span>
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {user?.role === 'administrado' && (
              <>
                <NavLink href="/dashboard" current={pathname}>Inicio</NavLink>
                <NavLink href="/instancia/nueva" current={pathname}>Nueva instancia</NavLink>
                <NavLink href="/mis-registros" current={pathname}>Mis registros</NavLink>
              </>
            )}
            {user?.role === 'funcionario' && (
              <>
                <NavLink href="/funcionario/registros" current={pathname}>Registros</NavLink>
                <NavLink href="/funcionario/expedientes" current={pathname}>Expedientes</NavLink>
                <NavLink href="/admin/sede" current={pathname}>Configurar sede</NavLink>
              </>
            )}
          </nav>

          {/* Auth */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-medium text-[--foreground]">{user.name || user.email}</span>
                  <span className="text-[10px] text-[--muted] capitalize">{user.role}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  Salir
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button size="sm">Acceder</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  current,
  children,
}: {
  href: string;
  current: string;
  children: React.ReactNode;
}) {
  const isActive = current === href || current.startsWith(href + '/');
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? 'bg-[--accent-muted] text-[--accent]'
          : 'text-[--muted] hover:text-[--foreground] hover:bg-[--surface-2]'
      }`}
    >
      {children}
    </Link>
  );
}
