import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useGolfStore } from '../store/useGolfStore';

const COMMON_CLUBS = [
  "Driver", "3 Wood", "5 Wood", "7 Wood", 
  "2 Hybrid", "3 Hybrid", "4 Hybrid", "5 Hybrid", "6 Hybrid",
  "3 Iron", "4 Iron", "5 Iron", "6 Iron", "7 Iron", "8 Iron", "9 Iron", 
  "Pitching Wedge (PW)", "Gap Wedge (GW)", "Sand Wedge (SW)", "Lob Wedge (LW)", 
  "46° Wedge", "48° Wedge", "50° Wedge", "52° Wedge", "54° Wedge", "56° Wedge", "58° Wedge", "60° Wedge", "64° Wedge",
  "Putter"
];

export default function ClubBagManager() {
  const { clubs, shots, deleteClub } = useGolfStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newClub, setNewClub] = useState({ name: '', loft: '', avg_distance: '' });
  const [isSaving, setIsSaving] = useState(false);

  const handleAddClub = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase.from('clubs').insert([{ 
      user_id: user.id, name: newClub.name, loft: Number(newClub.loft) || null, avg_distance: Number(newClub.avg_distance) || 0 
    }]).select();

    if (!error && data) {
      useGolfStore.setState((state) => ({ clubs: [...state.clubs, data[0]].sort((a, b) => b.avg_distance - a.avg_distance) }));
      setIsAdding(false);
      setNewClub({ name: '', loft: '', avg_distance: '' });
    }
    setIsSaving(false);
  };

  return (
    <div className="bg-slate-800 p-5 rounded-2xl shadow-lg border border-slate-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-emerald-400">My Bag</h2>
        <button onClick={() => setIsAdding(!isAdding)} className="bg-emerald-500 text-slate-900 px-4 py-2 rounded-lg font-bold text-sm hover:bg-emerald-400 transition-colors">
          {isAdding ? 'Cancel' : '+ Add Club'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddClub} className="mb-6 bg-slate-900 p-4 rounded-xl border border-slate-700 space-y-4">
          <select 
            required className="w-full bg-slate-800 p-3 rounded-lg text-white border border-slate-600 focus:border-emerald-500 focus:outline-none"
            value={newClub.name} onChange={e => setNewClub({...newClub, name: e.target.value})}
          >
            <option value="" disabled>Select a club...</option>
            {COMMON_CLUBS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex gap-3">
            <input type="number" placeholder="Loft (°)" className="w-1/2 bg-slate-800 p-3 rounded-lg text-white border border-slate-600 focus:outline-none focus:border-emerald-500" value={newClub.loft} onChange={e => setNewClub({...newClub, loft: e.target.value})} />
            <input type="number" placeholder="Stock Yds" required className="w-1/2 bg-slate-800 p-3 rounded-lg text-white border border-slate-600 focus:outline-none focus:border-emerald-500" value={newClub.avg_distance} onChange={e => setNewClub({...newClub, avg_distance: e.target.value})} />
          </div>
          <button type="submit" disabled={isSaving || !newClub.name} className="w-full bg-emerald-500 text-slate-900 font-bold py-3 rounded-lg mt-2 disabled:opacity-50 hover:bg-emerald-400 transition-colors">
            {isSaving ? 'Saving...' : 'Save Club to Bag'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {clubs.length === 0 && !isAdding && <p className="text-slate-400 text-center py-6">Your bag is empty.</p>}
        {clubs.map((club) => {
          const clubShots = shots.filter(s => s.club_id === club.id);
          const activeAvg = clubShots.length > 0 
            ? Math.round(clubShots.reduce((acc, curr) => acc + curr.distance, 0) / clubShots.length) 
            : club.avg_distance;

          const lefts = clubShots.filter(s => s.offline_yards < 0).length;
          const rights = clubShots.filter(s => s.offline_yards > 0).length;
          const dispersion = clubShots.length === 0 ? "No tracked shots" : (lefts > rights ? "Misses Left" : rights > lefts ? "Misses Right" : "Straight");

          return (
            <div key={club.id} className="flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-700">
              <div>
                <p className="font-bold text-white text-lg">{club.name}</p>
                <p className="text-xs text-slate-400">Stock: {club.avg_distance}y | {dispersion}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-emerald-400 font-black text-xl">{activeAvg}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Tracked Yds</p>
                </div>
                <button onClick={() => deleteClub(club.id)} className="text-red-400 hover:text-red-300 font-bold text-xl px-2">×</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}