import Link from "next/link";
import { 
  Github, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Heart 
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-background-lighter border-t border-background-light mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span className="text-2xl font-display font-bold text-gradient">Soshi</span>
            </Link>
            <p className="text-text-secondary text-sm mb-4">
              A modern social network platform connecting people around the world through shared interests and experiences.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-primary">
                <Github className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-primary">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-primary">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-primary">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-text-primary font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-text-secondary hover:text-primary text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/posts" className="text-text-secondary hover:text-primary text-sm">
                  Posts
                </Link>
              </li>
              <li>
                <Link href="/groups" className="text-text-secondary hover:text-primary text-sm">
                  Groups
                </Link>
              </li>
              <li>
                <Link href="/events" className="text-text-secondary hover:text-primary text-sm">
                  Events
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Legal */}
          <div>
            <h3 className="text-text-primary font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-text-secondary hover:text-primary text-sm">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-text-secondary hover:text-primary text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-text-secondary hover:text-primary text-sm">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/community-guidelines" className="text-text-secondary hover:text-primary text-sm">
                  Community Guidelines
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact */}
          <div>
            <h3 className="text-text-primary font-semibold mb-4">Contact</h3>
            <ul className="space-y-2">
              <li className="text-text-secondary text-sm">
                Email: support@soshi.com
              </li>
              <li>
                <Link href="/help" className="text-text-secondary hover:text-primary text-sm">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/feedback" className="text-text-secondary hover:text-primary text-sm">
                  Feedback
                </Link>
              </li>
              <li>
                <Link href="/report" className="text-text-secondary hover:text-primary text-sm">
                  Report an Issue
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <hr className="my-6 border-background-light" />
        
        {/* Copyright */}
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-text-secondary text-sm">
            &copy; {currentYear} Soshi. All rights reserved.
          </p>
          <p className="text-text-secondary text-sm mt-2 md:mt-0">
            Made with <Heart className="inline h-4 w-4 text-error" /> by Soshi Team
          </p>
        </div>
      </div>
    </footer>
  );
}
