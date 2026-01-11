
import React from 'react';
import { SubTask, ServiceProvider } from '../types';

interface Props {
  task: SubTask;
  assignedProvider?: ServiceProvider;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDownload: (task: SubTask) => void;
}

const SubTaskCard: React.FC<Props> = ({ task, assignedProvider, onApprove, onReject, onDownload }) => {
  const statusColors = {
    pending: 'bg-slate-700 text-slate-300',
    processing: 'bg-blue-900 text-blue-200 animate-pulse',
    review_pending: 'bg-amber-900 text-amber-200 border border-amber-500/50',
    completed: 'bg-emerald-900 text-emerald-200',
    failed: 'bg-rose-900 text-rose-200',
    reassigning: 'bg-purple-900 text-purple-200 animate-bounce'
  };

  const getFileIcon = (ext?: string) => {
    switch(ext) {
      case 'pdf': return '📄';
      case 'png': 
      case 'jpg': return '🖼️';
      case 'docx': return '📝';
      case 'zip': return '📦';
      default: return '📁';
    }
  };

  return (
    <div className={`bg-slate-800/50 border rounded-xl p-4 flex flex-col gap-3 transition-all ${
      task.status === 'review_pending' ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'border-slate-700 hover:border-blue-500/50'
    }`}>
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{task.agentType}</h4>
            {assignedProvider && (
              <span className="text-[9px] px-1.5 py-0.5 bg-slate-700 rounded text-slate-300 border border-slate-600">
                via {assignedProvider.name}
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold text-slate-100 leading-tight">{task.name}</h3>
        </div>
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusColors[task.status]}`}>
          {task.status.replace('_', ' ')}
        </span>
      </div>
      
      <p className="text-sm text-slate-400 line-clamp-2">{task.description}</p>

      {task.status === 'processing' && assignedProvider && (
        <div className="mt-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
          <p className="text-[10px] font-bold text-blue-400 uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></span>
            Awaiting Provider Submission...
          </p>
        </div>
      )}

      {(task.status === 'review_pending' || task.status === 'completed') && task.fileMetadata && (
        <div className="mt-2 p-3 bg-slate-900/80 rounded-lg border border-slate-700 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
              <span>{getFileIcon(task.fileMetadata.extension)}</span>
              Delivery: {task.fileMetadata.type} ({task.fileMetadata.extension.toUpperCase()})
            </p>
            <span className="text-[9px] text-slate-600 font-mono">{task.fileMetadata.size}</span>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => onDownload(task)}
              className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs font-bold rounded transition-colors flex items-center justify-center gap-1 text-slate-200"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download
            </button>
            {task.status === 'review_pending' && (
              <>
                <button 
                  onClick={() => onApprove(task.id)}
                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold rounded transition-colors text-white"
                >
                  Approve
                </button>
                <button 
                  onClick={() => onReject(task.id)}
                  className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-xs font-bold rounded transition-colors text-white"
                >
                  Revise
                </button>
              </>
            )}
          </div>
        </div>
      )}
      
      <div className="mt-auto pt-3 border-t border-slate-700/50 flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase">Contract</span>
          <span className="font-mono text-emerald-400 font-bold">{task.costMNEE.toFixed(2)} MNEE</span>
        </div>
        {task.txHash && (
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-500 uppercase">Tx Proof</span>
            <span className="text-[10px] font-mono text-blue-400 truncate w-24 text-right">
              {task.txHash.substring(0, 10)}...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubTaskCard;
