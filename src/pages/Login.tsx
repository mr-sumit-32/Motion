import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { createDefaultWorkspace } from '@/lib/db';
import { Loader2, Command } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isLogin) {
        // 1. Log in an existing user
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/');
      } else {
        // 2. Sign up a new user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // 3. Generate their default workspace and initial pages in Firebase!
        await createDefaultWorkspace(userCredential.user.uid);
        
        navigate('/');
      }
    } catch (err: any) {
      console.error("Authentication Error:", err);
      // Clean up Firebase error messages for the user
      if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err.message || 'Failed to authenticate. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fbfbfa] text-foreground p-4">
      <div className="w-full max-w-sm space-y-8 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Logo & Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-background border border-border rounded-xl shadow-sm flex items-center justify-center mb-6">
            <Command size={24} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isLogin ? 'Welcome back' : 'Create your workspace'}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {isLogin ? 'Enter your details to sign in.' : 'Sign up to get started.'}
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-background border border-border rounded-xl shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com" 
                className="w-full px-3 py-2 text-sm border border-input rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full px-3 py-2 text-sm border border-input rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mt-2"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              {isLogin ? 'Sign In' : 'Continue'}
            </button>
          </form>
        </div>

        {/* Toggle Mode */}
        <div className="text-center text-sm text-muted-foreground">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button" 
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-primary font-medium hover:underline focus:outline-none"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>

      </div>
    </div>
  );
}