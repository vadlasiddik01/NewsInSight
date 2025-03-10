import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../lib/auth';
import { useToast } from '@/hooks/use-toast';
import styles from '../styles/UserMenu.module.css';

const UserMenu = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: 'Logged out',
        description: 'You have been logged out successfully.',
      });
      setLocation('/');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Logout failed',
        description: 'Failed to log out. Please try again.',
      });
    }
  };
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <div className={styles.container} ref={menuRef}>
      <button 
        className={styles.menuButton} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <img 
          src={`https://ui-avatars.com/api/?name=${user?.fullName || user?.username || 'User'}&background=random`}
          alt="User profile" 
          className={styles.avatar}
        />
        <svg xmlns="http://www.w3.org/2000/svg" className={styles.arrowIcon} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      
      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.userInfo}>
            <p className={styles.name}>{user?.fullName || user?.username}</p>
            <p className={styles.email}>{user?.email}</p>
          </div>
          
          <div className={styles.divider}></div>
          
          <Link href="/preferences" className={styles.menuItem} onClick={() => setIsOpen(false)}>
            <svg xmlns="http://www.w3.org/2000/svg" className={styles.menuIcon} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            Preferences
          </Link>
          
          <Link href="/saved" className={styles.menuItem} onClick={() => setIsOpen(false)}>
            <svg xmlns="http://www.w3.org/2000/svg" className={styles.menuIcon} viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
            </svg>
            Saved Articles
          </Link>
          
          <button onClick={handleLogout} className={styles.menuItem}>
            <svg xmlns="http://www.w3.org/2000/svg" className={styles.menuIcon} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414l-5-5H3zm6.293 5.293a1 1 0 011.414 0L12 9.586l1.293-1.293a1 1 0 111.414 1.414L13.414 11l1.293 1.293a1 1 0 01-1.414 1.414L12 12.414l-1.293 1.293a1 1 0 01-1.414-1.414L10.586 11 9.293 9.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
