import React, { useState } from 'react';

export default function SwingThoughtsRules() {
  const [activeTab, setActiveTab] = useState('shots');
  const [openAccordion, setOpenAccordion] = useState(null);

  const toggleAccordion = (index) => {
    if (openAccordion === index) setOpenAccordion(null);
    else setOpenAccordion(index);
  };

  const shotGuide = [
    {
      title: "The Bump & Run (Basic Chip)",
      icon: "🏃‍♂️",
      content: [
        "Best used when you have plenty of green to work with and no hazards to cross.",
        "Use a 7, 8, or 9 iron instead of a wedge.",
        "Put your weight on your lead foot (target side).",
        "Play the ball back in your stance (closer to your trailing foot).",
        "Use a stiff-wristed putting stroke. Do not try to scoop the ball in the air."
      ]
    },
    {
      title: "Greenside Bunker Escape",
      icon: "🏖️",
      content: [
        "Use your Sand Wedge (56°).",
        "Open the clubface so it points to the sky, then take your grip.",
        "Dig your feet into the sand for a stable base and aim slightly left of the target.",
        "Aim to hit the sand 2 inches behind the ball.",
        "Swing aggressively! The sand pushes the ball out, not the club. Do not decelerate."
      ]
    },
    {
      title: "Hitting a Draw (Moves Right to Left)",
      icon: "↩️",
      content: [
        "Aim your feet, hips, and shoulders slightly right of the target.",
        "Aim the clubface exactly where you want the ball to finish.",
        "The clubface will look slightly 'closed' relative to where your feet are pointing.",
        "Swing along the line of your feet (in-to-out path).",
        "The ball will start right and curve back to the center."
      ]
    },
    {
      title: "Hitting a Fade (Moves Left to Right)",
      icon: "↪️",
      content: [
        "Aim your feet, hips, and shoulders slightly left of the target.",
        "Aim the clubface exactly where you want the ball to finish.",
        "The clubface will look slightly 'open' relative to where your feet are pointing.",
        "Swing along the line of your feet (out-to-in path).",
        "The ball will start left and gently curve right."
      ]
    },
    {
      title: "The Punch Out (Trouble Shot)",
      icon: "🌲",
      content: [
        "Take your medicine. The goal is just getting back to the fairway.",
        "Use a lower lofted club (5 or 6 iron).",
        "Play the ball back in your stance to keep the flight low under branches.",
        "Use a compact, half-swing. Keep your hands ahead of the clubhead through impact."
      ]
    }
  ];

  const rulesGuide = [
    {
      title: "Lost Ball or Out of Bounds (White Stakes)",
      icon: "🏳️",
      content: [
        "You have exactly 3 minutes to search for a lost ball.",
        "If lost or Out of Bounds (past white stakes), it is a Stroke and Distance penalty.",
        "You must add 1 penalty stroke and play from where you hit your previous shot.",
        "Alternative (Local Rule if active): Drop a ball on the edge of the fairway no closer to the hole, adding 2 penalty strokes."
      ]
    },
    {
      title: "Penalty Areas (Red & Yellow Stakes/Lines)",
      icon: "💧",
      content: [
        "Yellow: You can play it as it lies (no penalty), or take 1 penalty stroke and drop on a line keeping the point it crossed the hazard between you and the hole.",
        "Red: Same options as Yellow, PLUS you can drop within two club-lengths from where the ball crossed the margin of the hazard, no closer to the hole (1 penalty stroke)."
      ]
    },
    {
      title: "Unplayable Lie",
      icon: "🌳",
      content: [
        "If your ball is in a bush or against a tree, you can declare it unplayable (1 penalty stroke).",
        "Option 1: Drop within two club-lengths, no closer to the hole.",
        "Option 2: Go back as far as you want on a straight line keeping the unplayable spot between you and the hole.",
        "Option 3: Return to the spot of your previous shot."
      ]
    },
    {
      title: "Dropping Procedure",
      icon: "⬇️",
      content: [
        "When taking relief, you must drop the ball from knee height.",
        "The ball must fall straight down without you throwing, spinning, or rolling it.",
        "It must land in and come to rest within the designated relief area."
      ]
    },
    {
      title: "Provisional Ball",
      icon: "⛳",
      content: [
        "If you think your ball might be lost (outside a penalty area) or Out of Bounds, play a Provisional Ball to save time.",
        "You MUST announce it clearly: 'I am playing a provisional.'",
        "If you find your first ball in bounds, pick up the provisional. If you can't find the first ball, the provisional becomes your ball in play (adding the penalty stroke)."
      ]
    }
  ];

  const etiquetteGuide = [
    {
      title: "Ready Golf & Pace of Play",
      icon: "⏱️",
      content: [
        "Unless playing a strict formal tournament, play 'Ready Golf'. Whoever is ready to hit safely should hit, regardless of who is furthest away.",
        "Be ready to hit when it is your turn. Plan your shot and pick your club while others are hitting.",
        "Leave your bag on the side of the green closest to the next tee box.",
        "If your group falls more than a hole behind the group in front, allow faster groups behind you to play through."
      ]
    },
    {
      title: "Course Care",
      icon: "🌱",
      content: [
        "Always carry a pitch mark repairer. Repair your pitch mark on the green, plus one other.",
        "Replace your divots on the fairway (or fill them with sand/seed if provided on the cart).",
        "Rake bunkers after use. Leave the rake outside the bunker or as directed by local rules.",
        "Avoid taking practice swings that take a divot on the tee boxes."
      ]
    },
    {
      title: "Safety & Consideration",
      icon: "⚠️",
      content: [
        "If you hit a ball that is heading toward another person or group, immediately yell 'FORE!' as loudly as possible.",
        "Never stand directly behind someone's line of play or in their peripheral vision while they are swinging.",
        "Do not talk, move, or make noise when someone is addressing their ball.",
        "On the green, avoid stepping on the 'line' between another player's ball and the hole."
      ]
    }
  ];

  const renderAccordion = (dataArray) => {
    return (
      <div className="space-y-3">
        {dataArray.map((item, index) => (
          <div key={index} className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
            <button
              onClick={() => toggleAccordion(index)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <span className="font-bold text-slate-200">{item.title}</span>
              </div>
              <span className={`text-slate-500 font-bold transition-transform duration-300 ${openAccordion === index ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            
            <div 
              className={`transition-all duration-300 ease-in-out ${openAccordion === index ? 'max-h-96 border-t border-slate-800' : 'max-h-0'}`}
            >
              <div className="p-4 bg-slate-900/50">
                <ul className="space-y-2">
                  {item.content.map((bullet, idx) => (
                    <li key={idx} className="text-sm text-slate-400 flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-10">
      <div className="px-2">
        <h2 className="text-2xl font-black text-white">Pocket Guide</h2>
        <p className="text-xs text-slate-400 mt-1">Quick reference for rules, shots, and course survival.</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-slate-800 rounded-xl p-1.5 border border-slate-700 shadow-sm">
        <button 
          onClick={() => { setActiveTab('shots'); setOpenAccordion(null); }} 
          className={`flex-1 py-2.5 text-[11px] uppercase tracking-wider font-bold rounded-lg transition-all ${activeTab === 'shots' ? 'bg-sky-500 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
        >
          Shot Guide
        </button>
        <button 
          onClick={() => { setActiveTab('rules'); setOpenAccordion(null); }} 
          className={`flex-1 py-2.5 text-[11px] uppercase tracking-wider font-bold rounded-lg transition-all ${activeTab === 'rules' ? 'bg-emerald-500 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
        >
          Rules
        </button>
        <button 
          onClick={() => { setActiveTab('etiquette'); setOpenAccordion(null); }} 
          className={`flex-1 py-2.5 text-[11px] uppercase tracking-wider font-bold rounded-lg transition-all ${activeTab === 'etiquette' ? 'bg-amber-500 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
        >
          Etiquette
        </button>
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === 'shots' && renderAccordion(shotGuide)}
        {activeTab === 'rules' && renderAccordion(rulesGuide)}
        {activeTab === 'etiquette' && renderAccordion(etiquetteGuide)}
      </div>

      {/* Quick Mental Check */}
      <div className="mt-6 bg-purple-900/20 border border-purple-500/30 p-4 rounded-xl">
        <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-2">
          <span>🧠</span> Pre-Shot Routine
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed mb-3">
          Consistency starts before you swing. Build a 15-second routine and do it before every single shot.
        </p>
        <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside pl-1 font-semibold">
          <li><strong className="text-slate-200">See It:</strong> Stand behind the ball. Visualize the flight.</li>
          <li><strong className="text-slate-200">Feel It:</strong> Take one practice swing matching that shot.</li>
          <li><strong className="text-slate-200">Set It:</strong> Step up, align clubface first, then feet.</li>
          <li><strong className="text-slate-200">Trust It:</strong> Look at the target, look at the ball, swing.</li>
        </ol>
      </div>

    </div>
  );
}