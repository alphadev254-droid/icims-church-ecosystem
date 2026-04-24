import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Sun, Moon, Menu, X, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

export default function PublicHeader() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const navLinks = [
    { to: '/',         label: 'Home' },
    { to: '/features', label: 'Features' },
    { to: '/pricing',  label: 'Pricing' },
    { to: '/about',    label: 'About' },
    { to: '/contact',  label: 'Contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className={`sticky top-0 z-50 transition-all duration-200 border-b ${
      scrolled ? 'bg-background/95 backdrop-blur border-border shadow-sm' : 'bg-background border-border'
    }`}>
      {/* Top info bar */}
      <div className="bg-accent hidden sm:block">
        <div className="container flex h-8 items-center justify-between">
          <div className="flex items-center gap-5">
            <a href="mailto:support@churchcentral.church" className="flex items-center gap-1.5 text-xs text-accent-foreground/80 hover:text-accent-foreground transition-colors">
              <Mail className="h-3 w-3" /> support@churchcentral.church
            </a>
            <a href="tel:+254720874025" className="flex items-center gap-1.5 text-xs text-accent-foreground/80 hover:text-accent-foreground transition-colors">
              <Phone className="h-3 w-3" /> +254 720 874 025 / WhatsApp +265 998 951 510
            </a>
          </div>
          <p className="text-xs text-accent-foreground/60">Integrated Church Information Management System</p>
        </div>
      </div>

      <div className="container flex h-16 items-center justify-between gap-6">

        {/* Brand — logo + wordmark + descriptor */}
        <Link to="/" className="flex items-center gap-3 shrink-0 group">
          <img
            src="/icims-logo.jpg"
            alt="ICIMS"
            className="h-14 w-auto object-contain rounded-2xl transition-transform group-hover:scale-105"
          />
          <div className="hidden sm:block">
            <p className="font-heading text-base font-bold text-foreground leading-tight">ICIMS</p>
            <p className="text-xs text-muted-foreground leading-tight">Church Management</p>
          </div>
        </Link>

        {/* Desktop nav — underline style */}
        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                isActive(link.to)
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {link.label}
              {isActive(link.to) && (
                <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-accent rounded-full" />
              )}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-muted-foreground h-9 w-9"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {user ? (
            <Link to="/dashboard">
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                Dashboard
              </Button>
            </Link>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  Sign in
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 px-5">
                  Get started
                </Button>
              </Link>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-3 space-y-1">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive(link.to)
                  ? 'text-foreground bg-muted'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              {link.label}
              {isActive(link.to) && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
            </Link>
          ))}
          {!user && (
            <div className="pt-3 pb-1 flex flex-col gap-2 border-t border-border mt-2">
              <Link to="/login">
                <Button variant="outline" size="sm" className="w-full">Sign in</Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  Get started
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
