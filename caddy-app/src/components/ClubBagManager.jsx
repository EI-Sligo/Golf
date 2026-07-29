import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Plus, Trash2, ShieldCheck } from 'lucide-react';

export default function ClubBagManager({ isOpen, onClose }) {
  const [clubs, setClubs] = useState([]);
  const [newClubName, setNewClubName] = useState('');
  const [newYardage, setNewYardage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) fetchBag();
  }, [isOpen]);

  const fetchBag = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('bag_clubs')
      .select('*')
      .eq('user_id', user.id)
      .order('yardage', { ascending: false });

    if (!error) setClubs(data || []);
  };

  const handleAddClub = async (e) => {
    e.preventDefault();
    if (!newClubName || !newYardage) return;

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from('bag_clubs').insert([{
      user_id: user.id,
      club_name: newClubName,
      yardage: parseInt(newYardage)
    }]);

    if (!error) {
      setNewClubName('');
      setNewYardage('');
      fetchBag();
    } else {
      alert("Error adding club");
    }
    setLoading(false);
  };

  const handleDeleteClub = async (id) => {
    const { error } = await supabase.from('bag_clubs').delete().eq('id', id);
    if (!error) fetchBag();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950 flex flex-col animate-in slide-in-from-bottom-full duration-300">
      <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900">
        <div>
          <h2 className="text-xl font-black text-white">My Club Bag</h2>
          <p className="text-emerald-400 font-bold text-xs uppercase tracking-wider">Yardage Matrix</p>
        </div>
        <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        
        {/* Add Club Form */}
        <form onSubmit={handleAddClub} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
          <p className="text-xs font-bold uppercase text-slate-400">Add / Update Club</p>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Club (e.g. 7 Iron)" 
              value={newClubName}
              onChange={(e) => setNewClubName(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-sm focus:border-emerald-500 focus:outline-none"
            />
            <input 
              type="number" 
              placeholder="Yards" 
              value={newYardage}
              onChange={(e) => setNewYardage(e.target.value)}
              className="w-24 bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Add to Bag
          </button>
        </form>

        {/* Club List */}
        <div className="space-y-2">
          {clubs.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">No clubs added to your bag yet.</div>
          ) : (
            clubs.map((club) => (
              <div key={club.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
                <span className="font-bold text-white text-base">{club.club_name}</span>
                <div className="flex items-center gap-4">
                  <span className="text-emerald-400 font-black text-lg">{club.yardage} <span className="text-xs font-normal text-slate-400">YDS</span></span>
                  <button onClick={() => handleDeleteClub(club.id)} className="text-slate-500 hover:text-rose-400 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}