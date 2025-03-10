import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginData } from '@shared/schema';
import { useAuth } from '../lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Link, useLocation } from 'wouter';
import styles from '../styles/Login.module.css';

const Login = () => {
  const { login } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: ''
    }
  });
  
  const onSubmit = async (data: LoginData) => {
    try {
      await login(data);
      toast({
        title: 'Login successful',
        description: 'Welcome back to NewsInsight!',
      });
      setLocation('/');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'Please check your credentials and try again.',
      });
    }
  };
  
  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <div className={styles.logoContainer}>
          <svg xmlns="http://www.w3.org/2000/svg" className={styles.logo} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
          </svg>
          <h1 className={styles.logoText}>NewsInsight</h1>
        </div>
        
        <h2 className={styles.title}>Login to your account</h2>
        
        <form className={styles.form} onSubmit={form.handleSubmit(onSubmit)}>
          <div className={styles.formGroup}>
            <label htmlFor="username" className={styles.label}>Username</label>
            <input
              id="username"
              className={styles.input}
              type="text"
              {...form.register('username')}
            />
            {form.formState.errors.username && (
              <p className={styles.error}>{form.formState.errors.username.message}</p>
            )}
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input
              id="password"
              className={styles.input}
              type="password"
              {...form.register('password')}
            />
            {form.formState.errors.password && (
              <p className={styles.error}>{form.formState.errors.password.message}</p>
            )}
          </div>
          
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Logging in...' : 'Log in'}
          </button>
        </form>
        
        <div className={styles.footer}>
          <p>Don't have an account?</p>
          <Link href="/register" className={styles.registerLink}>
            Register
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
