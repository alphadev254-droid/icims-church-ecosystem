import { Church } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PublicFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Church className="h-6 w-6 text-accent" />
              <span className="font-heading text-lg font-bold">ICIMS</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Integrated Church Information Management System — empowering churches to grow sustainably.
            </p>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-3 text-foreground">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/features" className="hover:text-foreground transition-colors">Features</Link></li>
              <li><Link to="/about" className="hover:text-foreground transition-colors">About</Link></li>
              <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-3 text-foreground">Modules</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Membership Management</li>
              <li>Giving & Donations</li>
              <li>Event Management</li>
              <li>Performance Tracking</li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-3 text-foreground">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Documentation</li>
              <li>Help Center</li>
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} ICIMS. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
