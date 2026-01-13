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
  // Les couleurs sont maintenant gérées via des classes CSS dans index.css
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
    <div className={`task-card ${task.status === 'review_pending' ? 'review-highlight' : ''}`}>
      <div className="card-header">
        <div className="task-info">
          <div className="agent-meta">
            <h4 className="agent-type-label">{task.agentType}</h4>
            {assignedProvider && (
              <span className="provider-tag">via {assignedProvider.name}</span>
            )}
          </div>
          <h3 className="task-title">{task.name}</h3>
        </div>
        <span className={`status-badge status-${task.status.replace('_', '-')}`}>
          {task.status.replace('_', ' ')}
        </span>
      </div>
      
      <p className="task-description">{task.description}</p>

      {task.status === 'processing' && assignedProvider && (
        <div className="processing-notice">
          <p className="notice-text">
            <span className="pulse-dot"></span>
            Awaiting Provider Submission...
          </p>
        </div>
      )}

      {(task.status === 'review_pending' || task.status === 'completed') && task.fileMetadata && (
        <div className="delivery-section">
          <div className="delivery-info">
            <p className="delivery-label">
              <span>{getFileIcon(task.fileMetadata.extension)}</span>
              Delivery: {task.fileMetadata.type} ({task.fileMetadata.extension.toUpperCase()})
            </p>
            <span className="file-size">{task.fileMetadata.size}</span>
          </div>
          
          <div className="action-buttons">
            <button onClick={() => onDownload(task)} className="btn-secondary btn-sm">
              Download
            </button>
            {task.status === 'review_pending' && (
              <>
                <button onClick={() => onApprove(task.id)} className="btn-approve btn-sm">
                  Approve
                </button>
                <button onClick={() => onReject(task.id)} className="btn-reject btn-sm">
                  Revise
                </button>
              </>
            )}
          </div>
        </div>
      )}
      
      <div className="card-footer">
        <div className="contract-box">
          <span className="footer-label">Contract</span>
          <span className="cost-value">{task.costMNEE.toFixed(2)} MNEE</span>
        </div>
        {task.txHash && (
          <div className="proof-box">
            <span className="footer-label">Tx Proof</span>
            <span className="hash-value">{task.txHash.substring(0, 10)}...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubTaskCard;