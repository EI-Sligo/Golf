import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Target, ArrowLeftRight, TrendingUp, Trash2 } from 'lucide-react';

export default function DispersionAnalytics({ isOpen, onClose }) {
  const [shots, setShots] = useState([]);
  const [selectedClub, setSelectedClub] = useState('All');
  const [loading, setLoading] = useState(true);

  // Fetch shots whenever the drawer is opened
  useEffect(() => {
    if (isOpen) fetchShots();
  }, [isOpen]);

  const fetchShots = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('shots')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setShots(data || []);
    } catch (error) {
      console.error("Error fetching shots:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Clear all tracked shots
  const handleClearData = async () => {
    if (!window.confirm("Are you sure you want to delete all tracked shots? This cannot be undone.")) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('shots').delete().eq('user_id', user.id);
      
      if (error) throw error;
      setShots([]); // Clear local state
      setSelectedClub('All');
    } catch (error) {
      alert("Failed to clear data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const availableClubs = ['All', ...new Set(shots.map(s => s.club))];
  const filteredShots = selectedClub === 'All' 
    ? shots 
    : shots.filter(s => s.club === selectedClub);

  const totalShots = filteredShots.length;

  const avgDistance = totalShots > 0 
    ? Math.round(filteredShots.reduce((acc, curr) => acc + curr.distance, 0) / totalShots)
    : 0;

  // UPDATED: Smarter accuracy string matching
  const counts = { Center: 0, Left: 0, Right: 0, Short: 0, Long: 0 };
  filteredShots.forEach(shot => {
    const rawAcc = shot.accuracy ? shot.accuracy.toLowerCase() : '';
    let mappedAcc = 'Center';
    
    if (rawAcc.includes('left')) mappedAcc = 'Left';
    else if (rawAcc.includes('right')) mappedAcc = 'Right';
    else if (rawAcc.includes('short')) mappedAcc = 'Short';
    else if (rawAcc.includes('long')) mappedAcc = 'Long';

    if (counts[mappedAcc] !== undefined) counts[mappedAcc]++;
  });

  const getPercent = (count) => totalShots === 0 ? 0 : Math.round((count / totalShots) * 100);

  let topMiss = "N/A";
  let topMissCount = 0;
  Object.entries(counts).forEach(([key, val]) => {
    if (key !== 'Center' && val > topMissCount) {
      topMissCount = val;
      topMiss = key;
    }
  });

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950 flex flex-col animate-in slide-in-from-bottom-full duration-300">
      
      <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900">
        <div>
          <h2 className="text-xl font-black text-white">Shot Dispersion</h2>
          <p className="text-rose-400 font-bold text-xs uppercase tracking-wider">Target Analytics</p>
        </div>
        <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <label className="text-xs font-bold uppercase text-slate-400 block mb-2">Select Club to Analyze</label>
          <select 
            value={selectedClub}
            onChange={(e) => setSelectedClub(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-sm focus:border-rose-500 focus:outline-none"
          >
            {availableClubs.map(club => (
              <option key={club} value={club}>{club} {club !== 'All' ? 'Data' : 'Clubs'}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500 text-sm font-medium">Loading data...</div>
        ) : totalShots === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-8 text-center">
            <p className="text-slate-400 font-semibold text-sm">No shots logged yet.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center shadow-md flex flex-col items-center">
                <Target className="w-5 h-5 text-emerald-400 mb-1" />
                <p className="text-[10px] font-bold uppercase text-slate-400">Accuracy</p>
                <p className="text-2xl font-black text-white">{getPercent(counts.Center)}%</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center shadow-md flex flex-col items-center">
                <TrendingUp className="w-5 h-5 text-amber-400 mb-1" />
                <p className="text-[10px] font-bold uppercase text-slate-400">Avg Distance</p>
                <p className="text-2xl font-black text-white">{avgDistance} <span className="text-xs text-slate-400 font-normal">yds</span></p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col items-center relative">
              <p className="text-xs font-bold uppercase text-slate-400 mb-6 tracking-wider w-full text-left">Dispersion Heatmap</p>
              
              <div className="relative w-64 h-64 border-2 border-slate-800 rounded-full flex items-center justify-center">
                <div className="absolute w-48 h-48 border border-slate-700/50 rounded-full"></div>
                <div className="absolute w-32 h-32 border border-slate-700/50 rounded-full"></div>
                <div className="absolute w-16 h-16 border-2 border-emerald-500/50 bg-emerald-500/10 rounded-full"></div>
                
                <div className="absolute w-full h-[1px] bg-slate-800"></div>
                <div className="absolute h-full w-[1px] bg-slate-800"></div>

                <div className="absolute top-2 text-xs font-black text-amber-400 flex flex-col items-center">
                  <span>LONG</span>
                  <span>{getPercent(counts.Long)}%</span>
                </div>
                <div className="absolute bottom-2 text-xs font-black text-amber-400 flex flex-col items-center">
                  <span>{getPercent(counts.Short)}%</span>
                  <span>SHORT</span>
                </div>
                <div className="absolute left-2 text-xs font-black text-rose-400 flex flex-col items-center">
                  <span>LEFT</span>
                  <span>{getPercent(counts.Left)}%</span>
                </div>
                <div className="absolute right-2 text-xs font-black text-rose-400 flex flex-col items-center">
                  <span>RIGHT</span>
                  <span>{getPercent(counts.Right)}%</span>
                </div>
                <div className="absolute text-sm font-black text-emerald-400">
                  {getPercent(counts.Center)}%
                </div>
              </div>

              <div className="mt-6 w-full bg-slate-950 rounded-xl p-4 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold uppercase text-slate-400">Primary Miss</span>
                </div>
                <span className={`font-black text-sm uppercase ${topMissCount > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                  {topMissCount > 0 ? topMiss : 'None'}
                </span>
              </div>
              
              {/* CLEAR DATA BUTTON */}
              <button 
                onClick={handleClearData}
                className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 text-red-500 font-bold text-sm border border-red-500/20 hover:bg-red-500/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear All Shot Data
              </button>

            </div>
          </>
        )}
      </div>
    </div>
  );
}