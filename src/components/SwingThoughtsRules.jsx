import React, { useState } from 'react';
import { X, Brain, BookOpen, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function SwingThoughtsRules({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('thoughts');
  const [expandedRule, setExpandedRule] = useState(null);

  if (!isOpen) return null;

  const rules = [
    {
      id: 1,
      title: "Unplayable Lie (1 Penalty Stroke)",
      content: "1. Stroke-and-distance: Play from where previous stroke was made.\n2. Back-on-the-line: Drop a ball behind the unplayable spot, keeping that spot between you and the hole.\n3. Lateral Relief: Drop within two club-lengths of the unplayable spot, no closer to the hole."
    },
    {
      id: 2,
      title: "Red Penalty Area (Water)",
      content: "1 Penalty Stroke. Options: Play it as it lies (no penalty), Stroke-and-distance, Back-on-the-line, or Lateral relief (two club-lengths from where the ball last crossed the edge of the red penalty area)."
    },
    {
      id: 3,
      title: "Lost Ball or Out of Bounds",
      content: "1 Penalty Stroke. You must take stroke-and-distance relief by playing from where the previous stroke was made. You have 3 minutes to search for a lost ball."
    },
    {
      id: 4,
      title: "Free Relief (Abnormal Conditions)",
      content: "No Penalty. Includes animal holes, ground under repair, or immovable obstructions (like a cart path). Find the nearest point of complete relief and drop within one club-length."
    }
  ];

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950 flex flex-col animate-in slide-in-from-bottom-full duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900">
        <div>
          <h2 className="text-xl font-black text-white">Caddy Notes</h2>
          <p className="text-purple-400 font-bold text-xs uppercase tracking-wider">Reference & Rules</p>
        </div>
        <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex p-4 gap-2 bg-slate-900/50 border-b border-slate-800">
        <button 
          onClick={() => setActiveTab('thoughts')}
          className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'thoughts' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}
        >
          <Brain className="w-4 h-4" /> Swing Cues
        </button>
        <button 
          onClick={() => setActiveTab('rules')}
          className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'rules' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}
        >
          <BookOpen className="w-4 h-4" /> USGA Rules
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-4">
        
        {activeTab === 'thoughts' ? (
          <div className="space-y-3">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
              <h3 className="text-white font-bold mb-2">Tee Box</h3>
              <ul className="text-slate-400 text-sm space-y-2 list-disc pl-4">
                <li>Smooth takeaway, don't rush the transition.</li>
                <li>Pick a specific small target, not just "the fairway".</li>
                <li>Commit to the shot shape.</li>
              </ul>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
              <h3 className="text-white font-bold mb-2">Approach Shots</h3>
              <ul className="text-slate-400 text-sm space-y-2 list-disc pl-4">
                <li>Check the wind and elevation.</li>
                <li>Swing 80% to maintain balance.</li>
                <li>Aim for the fat part of the green.</li>
              </ul>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
              <h3 className="text-white font-bold mb-2">Putting</h3>
              <ul className="text-slate-400 text-sm space-y-2 list-disc pl-4">
                <li>Accelerate through the ball.</li>
                <li>Read the grain and the fall line.</li>
                <li>Listen for the ball to drop (keep head down).</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4 px-1">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              <p className="text-xs font-bold uppercase text-slate-400">Quick Penalty Guide</p>
            </div>
            
            {rules.map((rule) => (
              <div key={rule.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <button 
                  onClick={() => setExpandedRule(expandedRule === rule.id ? null : rule.id)}
                  className="w-full p-4 flex items-center justify-between text-left focus:outline-none"
                >
                  <span className="font-bold text-white text-sm pr-4">{rule.title}</span>
                  {expandedRule === rule.id ? (
                    <ChevronUp className="w-5 h-5 text-slate-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-500 flex-shrink-0" />
                  )}
                </button>
                {expandedRule === rule.id && (
                  <div className="px-4 pb-4 text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">
                    {rule.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}