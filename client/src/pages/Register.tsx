import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertUserSchema, InsertUser } from '@shared/schema';
import { useAuth } from '../lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Link, useLocation } from 'wouter';
import styles from '../styles/Login.module.css';

const Register = () => {
  const { register: registerUser } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Extend schema to confirm password validation
  const registerSchema = insertUserSchema.extend({
    confirmPassword: insertUserSchema.shape.password,
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
  
  type RegisterFormData = InsertUser & { confirmPassword: string };
  
  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      fullName: ''
    }
  });
  
  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { confirmPassword, ...userData } = data;
      await registerUser(userData);
      toast({
        title: 'Registration successful',
        description: 'Welcome to NewsInsight!',
      });
      setLocation('/');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'Please check your information and try again.',
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
        
        <h2 className={styles.title}>Create your account</h2>
        
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
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              id="email"
              className={styles.input}
              type="email"
              {...form.register('email')}
            />
            {form.formState.errors.email && (
              <p className={styles.error}>{form.formState.errors.email.message}</p>
            )}
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="fullName" className={styles.label}>Full Name</label>
            <input
              id="fullName"
              className={styles.input}
              type="text"
              {...form.register('fullName')}
            />
            {form.formState.errors.fullName && (
              <p className={styles.error}>{form.formState.errors.fullName.message}</p>
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
          
          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>Confirm Password</label>
            <input
              id="confirmPassword"
              className={styles.input}
              type="password"
              {...form.register('confirmPassword')}
            />
            {form.formState.errors.confirmPassword && (
              <p className={styles.error}>{form.formState.errors.confirmPassword.message}</p>
            )}
          </div>
          
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Creating account...' : 'Register'}
          </button>
        </form>
        
        <div className={styles.footer}>
          <p>Already have an account?</p>
          <Link href="/login" className={styles.registerLink}>
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
