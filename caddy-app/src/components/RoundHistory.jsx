import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Trophy, TrendingUp, Calendar, Hash } from 'lucide-react';

export default function RoundHistory({ isOpen, onClose }) {
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchRounds();
    }
  }, [isOpen]);

  const fetchRounds = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('rounds')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRounds(data || []);
    } catch (error) {
      console.error("Error fetching rounds:", error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Calculate analytics metrics
  const totalRoundsPlayed = rounds.length;
  const validScores = rounds.map(r => r.total_score).filter(s => s != null);
  const bestScore = validScores.length > 0 ? Math.min(...validScores) : '-';
  const averageScore = validScores.length > 0 
    ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) 
    : '-';

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950 flex flex-col animate-in slide-in-from-bottom-full duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900">
        <div>
          <h2 className="text-xl font-black text-white">Round History</h2>
          <p className="text-emerald-400 font-bold text-xs uppercase tracking-wider">Performance Analytics</p>
        </div>
        <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        
        {/* Analytics Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center shadow-lg">
            <Trophy className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <p className="text-[10px] font-bold uppercase text-slate-400">Best Score</p>
            <p className="text-2xl font-black text-white">{bestScore}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center shadow-lg">
            <TrendingUp className="w-5 h-5 text-sky-400 mx-auto mb-1" />
            <p className="text-[10px] font-bold uppercase text-slate-400">Average</p>
            <p className="text-2xl font-black text-white">{averageScore}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center shadow-lg">
            <Hash className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <p className="text-[10px] font-bold uppercase text-slate-400">Played</p>
            <p className="text-2xl font-black text-emerald-400">{totalRoundsPlayed}</p>
          </div>
        </div>

        {/* Rounds List */}
        <div>
          <h3 className="text-xs font-bold uppercase text-slate-400 mb-3 tracking-wider">Past Rounds</h3>
          
          {loading ? (
            <div className="text-center py-12 text-slate-500 font-medium text-sm">Loading rounds...</div>
          ) : rounds.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-8 text-center">
              <p className="text-slate-400 font-semibold text-sm">No saved rounds found yet.</p>
              <p className="text-slate-500 text-xs mt-1">Finish a round on your scorecard to log it here!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rounds.map((round) => {
                const dateStr = new Date(round.created_at).toLocaleDateString('en-IE', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                });

                return (
                  <div key={round.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white text-base">{round.course_name || 'Castle Dargan'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{dateStr}</span>
                        <span>•</span>
                        <span>Out: {round.front_9 ?? '-'}</span>
                        <span>In: {round.back_9 ?? '-'}</span>
                      </div>
                    </div>

                    <div className="text-right bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Total</span>
                      <span className="text-xl font-black text-emerald-400">{round.total_score ?? '-'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}