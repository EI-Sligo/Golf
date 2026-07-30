import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Success! You can now sign in.');
        setIsSignUp(false);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Successful login will automatically trigger the App.jsx listener and switch the screen
      }
    } catch (error) {
      alert("Login Error: " + error.message); // This will tell us EXACTLY what is wrong
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 px-4">
      <div className="w-full max-w-md bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-emerald-400 mb-2">Golf Caddy</h1>
          <p className="text-slate-400">Track your game, master the course.</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wide">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 p-4 rounded-xl text-white border border-slate-700 focus:border-emerald-500 focus:outline-none"
              placeholder="golfer@example.com"
              required 
            />
          </div>
          <div>
            <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wide">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 p-4 rounded-xl text-white border border-slate-700 focus:border-emerald-500 focus:outline-none"
              placeholder="••••••••"
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-500 text-slate-900 font-black py-4 rounded-xl hover:bg-emerald-400 transition-colors mt-4 disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-slate-400 hover:text-emerald-400 text-sm font-bold transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}