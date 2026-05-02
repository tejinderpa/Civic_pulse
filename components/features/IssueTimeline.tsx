'use client';

import { formatDistanceToNow } from 'date-fns';

interface TimelineEvent {
  id: string;
  action_type: 'status_change' | 'department_assignment' | 'comment' | 'submission';
  old_value?: string;
  new_value: string;
  user_name: string;
  created_at: string;
}

interface IssueTimelineProps {
  events: TimelineEvent[];
}

export default function IssueTimeline({ events }: IssueTimelineProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'status_change': return 'update';
      case 'department_assignment': return 'corporate_fare';
      case 'comment': return 'chat_bubble';
      case 'submission': return 'send';
      default: return 'event';
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'status_change': return 'text-amber-600 bg-amber-50';
      case 'department_assignment': return 'text-purple-600 bg-purple-50';
      case 'comment': return 'text-blue-600 bg-blue-50';
      case 'submission': return 'text-emerald-600 bg-emerald-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (!events || events.length === 0) return (
    <div className="p-8 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-[32px]">
      <span className="material-symbols-outlined text-4xl mb-2 opacity-20">history</span>
      <p className="text-xs font-bold uppercase tracking-widest leading-relaxed">No history logs <br/> available yet.</p>
    </div>
  );

  return (
    <div className="relative pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
      {events.map((event, index) => (
        <div key={event.id} className="relative group animate-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
          {/* Timeline Dot & Icon */}
          <div className={`absolute -left-11 top-0 w-8 h-8 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 transition-transform group-hover:scale-110 ${getColor(event.action_type)}`}>
            <span className="material-symbols-outlined text-sm">{getIcon(event.action_type)}</span>
          </div>

          <div className="bg-white/60 backdrop-blur-sm p-4 rounded-3xl border border-gray-100 group-hover:bg-white group-hover:shadow-lg transition-all duration-300">
             <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#0D2D1C]/40">
                   {event.action_type.replace('_', ' ')}
                </span>
                <span className="text-[9px] font-bold text-gray-400">
                   {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                </span>
             </div>

             <div className="text-sm font-medium text-gray-800 leading-relaxed">
                {event.action_type === 'status_change' && (
                  <>Status updated from <span className="font-bold text-gray-400">{event.old_value}</span> to <span className="text-emerald-600 font-bold">{event.new_value}</span></>
                )}
                {event.action_type === 'department_assignment' && (
                  <>Assigned to <span className="text-purple-600 font-bold">{event.new_value}</span> Department</>
                )}
                {event.action_type === 'comment' && (
                  <p className="italic text-gray-600">"{event.new_value}"</p>
                )}
                {event.action_type === 'submission' && (
                  <>Report submitted successfully.</>
                )}
             </div>

             <div className="mt-3 flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#0D2D1C] flex items-center justify-center text-[8px] font-black text-white uppercase">
                   {event.user_name[0]}
                </div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                   Action by {event.user_name}
                </span>
             </div>
          </div>
        </div>
      ))}
    </div>
  );
}
