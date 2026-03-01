import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Sun, Moon, Menu, X, Church, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const IconFacebook = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);
const IconX = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
const IconLinkedin = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export default function PublicHeader() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/features', label: 'Features' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top bar */}
      <div className="bg-accent dark:bg-card">
        <div className="container flex h-8 items-center justify-between">
          <div className="hidden sm:flex items-center gap-5 text-foreground/70 dark:text-foreground/60">
            <a href="mailto:info@icims.org" className="flex items-center gap-1.5 text-xs hover:text-foreground dark:hover:text-foreground transition-colors">
              <Mail className="h-3 w-3" /> info@icims.org
            </a>
            <a href="tel:+254700000000" className="flex items-center gap-1.5 text-xs hover:text-foreground dark:hover:text-foreground transition-colors">
              <Phone className="h-3 w-3" /> +254 700 000 000
            </a>
          </div>
          <div className="flex items-center gap-3 ml-auto text-foreground/60 dark:text-foreground/50">
            {[
              { icon: IconFacebook, label: 'Facebook' },
              { icon: IconX, label: 'X / Twitter' },
              { icon: IconLinkedin, label: 'LinkedIn' },
            ].map(s => (
              <a key={s.label} href="#" aria-label={s.label} className="hover:text-foreground dark:hover:text-foreground transition-colors">
                <s.icon />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Church className="h-7 w-7 text-accent" />
          <span className="font-heading text-xl font-bold text-foreground">ICIMS</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive(link.to)
                  ? 'text-accent'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {user ? (
            <Link to="/dashboard">
              <Button size="sm">Dashboard</Button>
            </Link>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">Get Started</Button>
              </Link>
            </div>
          )}

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background p-4 space-y-2">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2 rounded-md text-sm font-medium ${
                isActive(link.to) ? 'text-accent bg-accent/10' : 'text-muted-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {!user && (
            <div className="pt-2 space-y-2 border-t border-border">
              <Link to="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start">Sign In</Button>
              </Link>
              <Link to="/register" onClick={() => setMobileOpen(false)}>
                <Button size="sm" className="w-full bg-accent text-accent-foreground">Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
