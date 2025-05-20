import { Heart } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerStyles = {
    backgroundColor: '#1A2333',
    borderTop: '1px solid #2A3343',
    padding: '1rem 0',
    width: '100%',
    marginTop: 'auto'
  };

  const containerStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1.5rem'
  };

  const copyrightTextStyles = {
    color: '#B8C1CF',
    fontSize: '0.875rem'
  };

  const madeWithStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    color: '#B8C1CF',
    fontSize: '0.875rem'
  };

  // Responsive styles for mobile
  if (typeof window !== 'undefined' && window.innerWidth < 640) {
    containerStyles.flexDirection = 'column';
    containerStyles.gap = '0.5rem';
  }

  return (
    <footer style={footerStyles}>
      <div style={containerStyles}>
        <p style={copyrightTextStyles}>
          &copy; {currentYear} Soshi. All rights reserved.
        </p>
        <div style={madeWithStyles}>
          Made with <Heart style={{ height: '1rem', width: '1rem', color: '#EF476F' }} /> by Soshi Team
        </div>
      </div>
    </footer>
  );
}
