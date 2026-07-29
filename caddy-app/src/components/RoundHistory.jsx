import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Calendar, Trophy, ArrowRight } from 'lucide-react';

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

      // Fetch saved rounds from the database, newest first
      const { data, error } = await supabase
        .from('rounds')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRounds(data || []);
    } catch (error) {
      console.error("Error fetching round history:", error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950 flex flex-col animate-in slide-in-from-bottom-full duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900">
        <div>
          <h2 className="text-xl font-black text-white">Round History</h2>
          <p className="text-sky-400 font-bold text-xs uppercase tracking-wider">Castle Dargan Archive</p>
        </div>
        <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
        {loading ? (
          <div className="text-center py-12 text-slate-500 text-sm font-medium">Loading history...</div>
        ) : rounds.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-8 text-center">
            <p className="text-slate-400 font-semibold text-sm">No saved rounds found.</p>
            <p className="text-xs text-slate-500 mt-1">Finish an official round from your scorecard to log it here!</p>
          </div>
        ) : (
          rounds.map((round) => {
            const dateStr = new Date(round.created_at).toLocaleDateString('en-IE', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });

            const toParVal = round.to_par;
            const parDisplay = toParVal > 0 ? `+${toParVal}` : toParVal === 0 ? 'E' : toParVal;

            return (
              <div key={round.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-bold">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm">{round.course_name || 'Castle Dargan'}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-slate-500" /> {dateStr}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-lg font-black text-white">{round.total_score || '--'}</p>
                  <p className={`text-xs font-bold ${toParVal > 0 ? 'text-rose-400' : toParVal < 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {toParVal !== null ? parDisplay : '--'}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}