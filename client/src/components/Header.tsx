import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../lib/auth';
import UserMenu from './UserMenu';
import styles from '../styles/Header.module.css';
import { useQueryClient } from '@tanstack/react-query';

interface HeaderProps {
  onSearch?: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onSearch }) => {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery);
    }
    // Keep search visible after submit
  };
  
  const handleClearSearch = () => {
    setSearchQuery('');
    if (onSearch) {
      onSearch('');
    }
    setIsSearchActive(false);
  };
  
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logoSection}>
          <Link href="/" className={styles.logoLink}>
            <svg xmlns="http://www.w3.org/2000/svg" className={styles.logo} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
            </svg>
            <h1 className={styles.logoText}>NewsInsight</h1>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav className={styles.desktopNav}>
          <Link href="/" className={`${styles.navLink} ${location === '/' ? styles.active : ''}`}>
            Home
          </Link>
          {isAuthenticated && (
            <>
              <Link href="/saved" className={`${styles.navLink} ${location === '/saved' ? styles.active : ''}`}>
                Saved
              </Link>
              <Link href="/preferences" className={`${styles.navLink} ${location === '/preferences' ? styles.active : ''}`}>
                Preferences
              </Link>
            </>
          )}
        </nav>
        
        <div className={styles.rightSection}>
          {/* Search Button */}
          <button 
            className={styles.searchButton} 
            onClick={() => setIsSearchActive(!isSearchActive)}
            aria-label="Search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={styles.searchIcon} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </button>
          
          {/* User Menu or Login/Register */}
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <div className={styles.authLinks}>
              <Link href="/login" className={styles.loginLink}>
                Login
              </Link>
              <Link href="/register" className={styles.registerButton}>
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Search Bar (appears when search is active) */}
      {isSearchActive && (
        <div className={styles.searchBar}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <div className={styles.searchInputWrapper}>
              <input
                type="text"
                placeholder="Search articles..."
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              {searchQuery && (
                <button 
                  type="button" 
                  className={styles.clearSearchButton}
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
            <button type="submit" className={styles.searchSubmit}>
              Search
            </button>
            <button 
              type="button" 
              className={styles.searchCancel}
              onClick={handleClearSearch}
            >
              Cancel
            </button>
          </form>
        </div>
      )}
    </header>
  );
};

export default Header;
