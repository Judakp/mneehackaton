import React, { useState, useEffect } from 'react';
import { MNEEService } from './services/mneeService';
import { ProjectPlan, SubTask, ExecutionLog, ServiceProvider } from './types';
import SubTaskCard from './components/SubTaskCard';

const INITIAL_PROVIDERS: ServiceProvider[] = [
  { id: '1', name: "Nexus Tech", wallet: "0x71C765...881", category: 'Tech', description: 'Specialized in smart contract audits.' },
  { id: '2', name: "Quantum Research", wallet: "0x3A2bFD...4cf", category: 'Research', description: 'Data analysis and market trends.' },
  { id: '3', name: "Aura Creative", wallet: "0x9E11AC...12e", category: 'Design', description: 'Visual identity and UI/UX assets.' }
];

const App: React.FC = () => {
  // --- Navigation State ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'directory' | 'provider'>('dashboard');

  // --- Directory State ---
  const [providers, setProviders] = useState<ServiceProvider[]>(() => {
    const saved = localStorage.getItem('mnee_providers');
    return saved ? JSON.parse(saved) : INITIAL_PROVIDERS;
  });
  const [newProv, setNewProv] = useState<Omit<ServiceProvider, 'id'>>({
    name: '',
    wallet: '',
    category: 'Tech',
    description: ''
  });

  // --- Provider Portal State ---
  const [actingAsProviderId, setActingAsProviderId] = useState<string>('');
  const [submissionFile, setSubmissionFile] = useState({ type: 'Final Delivery', ext: 'pdf' });

  // --- Project State ---
  const [userPrompt, setUserPrompt] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [clientWallet, setClientWallet] = useState('');
  const [totalBudget, setTotalBudget] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [plan, setPlan] = useState<ProjectPlan | null>(null);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0.00");
  const [isManagedMode, setIsManagedMode] = useState(false);

  const mneeService = new MNEEService();

  useEffect(() => {
    localStorage.setItem('mnee_providers', JSON.stringify(providers));
  }, [providers]);

  const addLog = (message: string, type: ExecutionLog['type'] = 'info') => {
    setLogs(prev => [{ timestamp: Date.now(), message, type }, ...prev].slice(0, 50));
  };

  const handleConnect = async () => {
    try {
      const addr = await mneeService.connectWallet();
      if (addr) {
        setWalletAddress(addr);
        const bal = await mneeService.getBalance(addr);
        setBalance(bal);
        addLog(`Relay wallet active: ${addr.substring(0, 6)}...`, 'success');
      }
    } catch (err) {
      addLog("Connection simulation started.", "warning");
      setWalletAddress("0x71C765... (Internal Relay)");
      setBalance(MNEEService.simulateBalance());
    }
  };

  const handleDownloadReceipt = () => {
    if (!plan) return;
    const timestamp = new Date().toLocaleString();
    const receiptContent = `
=========================================
      MNEE AGENT-RELAY RECEIPT
=========================================
Project: ${plan.projectName}
Client Entity: ${plan.companyName}
Client Wallet: ${plan.clientWallet}
Date: ${timestamp}
-----------------------------------------
EXPENDITURE BREAKDOWN:
${plan.tasks.map(t => `- ${t.name} (${t.agentType}): ${t.costMNEE.toFixed(2)} MNEE [Status: ${t.status}]`).join('\n')}
-----------------------------------------
FINANCIAL SUMMARY:
Total Budget:     ${plan.totalBudget.toFixed(2)} MNEE
Relay Margin:     ${plan.estimatedMargin.toFixed(2)} MNEE
Net Deployment:   ${(plan.totalBudget - plan.estimatedMargin).toFixed(2)} MNEE
-----------------------------------------
BLOCKCHAIN VERIFICATION:
Protocol: MNEE Stablecoin (6 Decimals)
Relay Hash: ${MNEEService.generateMockTx()}
Authorized by: MNEE Autonomous Relay
=========================================`;
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MNEE_Receipt_${plan.projectName.replace(/\s+/g, '_')}.txt`;
    a.click();
    addLog(`Financial receipt generated for ${plan.projectName}`, 'success');
  };

  const approveTask = async (taskId: string) => {
    if (!plan) return;
    const task = plan.tasks.find(t => t.id === taskId);
    if (!task) return;
    addLog(`Approving work for ${task.name}...`, 'info');
    const updatedTasks = plan.tasks.map(t => t.id === taskId ? { ...t, status: 'completed' as const, txHash: MNEEService.generateMockTx() } : t);
    const newRemaining = plan.remainingBudget - task.costMNEE;
    setPlan({ ...plan, tasks: updatedTasks, remainingBudget: newRemaining });
    addLog(`Payment of ${task.costMNEE} MNEE released to provider.`, 'success');
  };

  const processSubTask = async (taskId: string, isReassigned = false) => {
    if (!plan) return;
    const task = plan.tasks.find(t => t.id === taskId);
    if (!task) return;

    if (isReassigned) addLog(`Searching directory for new specialized partner...`, 'info');
    await new Promise(r => setTimeout(r, 1500));
    
    let matchedProvId: string | undefined;
    if (task.agentType.toLowerCase().includes('tech')) matchedProvId = providers.find(p => p.category === 'Tech')?.id;
    else if (task.agentType.toLowerCase().includes('research')) matchedProvId = providers.find(p => p.category === 'Research')?.id;
    else if (task.agentType.toLowerCase().includes('design')) matchedProvId = providers.find(p => p.category === 'Design')?.id;

    if (matchedProvId) {
      setPlan(prev => prev ? {
        ...prev,
        tasks: prev.tasks.map(t => t.id === taskId ? { ...t, assignedProviderId: matchedProvId, status: 'processing' as const } : t)
      } : null);
      addLog(`${task.name} assigned to partner: ${providers.find(p => p.id === matchedProvId)?.name}`, 'info');
    } else {
      await new Promise(r => setTimeout(r, 2000));
      setPlan(prev => prev ? {
        ...prev,
        tasks: prev.tasks.map(t => t.id === taskId ? { ...t, status: 'review_pending' as const } : t)
      } : null);
    }
  };

  // --- FONCTION runRelay CORRIGÉE ET UNIQUE ---
  const runRelay = async () => {
    if (!userPrompt) return addLog("Brief required.", "error");
    setIsProcessing(true);
    setPlan(null);

    const finalComp = companyName || "Managed Global Entity";
    const finalWall = clientWallet || "0x" + Math.random().toString(16).slice(2, 42);

    addLog(`Contacting Autonomous Relay Proxy...`, 'info');

    try {
      const response = await fetch("/.netlify/functions/gemini-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Act as a project manager. Decompose this mission: "${userPrompt}". 
              Budget: ${totalBudget} MNEE. Company: ${finalComp}. Wallet: ${finalWall}.
              Return ONLY a JSON object matching the ProjectPlan interface with fields: 
              projectName, companyName, clientWallet, totalBudget, estimatedMargin, remainingBudget, 
              and tasks (an array of tasks with id, name, description, agentType, costMNEE, status='pending', revisionCount=0).`
            }]
          }]
        }),
      });

      if (!response.ok) throw new Error("Proxy relay failed");

      const data = await response.json();
      const aiText = data.candidates[0].content.parts[0].text;
      const cleanJson = aiText.replace(/```json|```/g, "").trim();
      const newPlan: ProjectPlan = JSON.parse(cleanJson);

      setPlan(newPlan);
      addLog(`Workflow optimized. Pipeline margin: ${newPlan.estimatedMargin} MNEE.`, 'success');

      for (const task of newPlan.tasks) {
        await processSubTask(task.id);
      }
    } catch (e: any) {
      addLog(`Relay Error: ${e.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAutoFind = () => {
    setIsManagedMode(true);
    setCompanyName("AI-Matched Network Partner");
    setClientWallet("0x_PROTOCOL_POOL_" + Math.random().toString(16).slice(2, 8));
    addLog("Auto-matchmaking enabled.", "success");
  };

  const handleAddProvider = (e: React.FormEvent) => {
    e.preventDefault();
    const provider: ServiceProvider = { ...newProv, id: Date.now().toString() } as ServiceProvider;
    setProviders([...providers, provider]);
    setNewProv({ name: '', wallet: '', category: 'Tech', description: '' });
    addLog(`Partner ${provider.name} onboarded.`, 'success');
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto flex flex-col gap-8 text-white bg-slate-950">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <h1 className="text-xl font-bold">MNEE <span className="text-blue-400">RELAY</span></h1>
        </div>
        
        <div className="flex items-center gap-4">
          <nav className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-700">
            {['dashboard', 'directory', 'provider'].map((t) => (
              <button 
                key={t}
                onClick={() => setActiveTab(t as any)}
                className={`px-3 py-1 text-[9px] font-bold uppercase rounded transition-all ${activeTab === t ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {t === 'dashboard' ? 'Console' : t === 'directory' ? 'Directory' : 'Provider Hub'}
              </button>
            ))}
          </nav>
          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-slate-500 uppercase font-bold">Relay Pool</div>
            <div className="text-lg font-mono font-bold text-emerald-400">{balance} MNEE</div>
          </div>
          <button onClick={handleConnect} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all">
            {walletAddress ? `${walletAddress.substring(0, 8)}...` : 'Connect'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      {activeTab === 'dashboard' && (
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 flex flex-col gap-6">
            <section className="bg-slate-800/40 border border-slate-700 p-6 rounded-2xl shadow-xl">
              <h2 className="text-xs font-bold text-slate-400 uppercase mb-4">Project Parameters</h2>
              <div className="space-y-4">
                <input type="text" placeholder="Company Name" value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white" />
                <textarea value={userPrompt} onChange={e => setUserPrompt(e.target.value)} placeholder="What needs to be done?" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-white min-h-[100px]" />
                <input type="number" value={totalBudget} onChange={e => setTotalBudget(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono text-white" />
                <button onClick={runRelay} disabled={isProcessing} className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold uppercase text-xs tracking-widest transition-all">
                  {isProcessing ? 'Synchronizing...' : 'Launch Pipeline'}
                </button>
              </div>
            </section>
            
            <section className="bg-slate-800/40 border border-slate-700 p-6 rounded-2xl h-[300px] flex flex-col">
              <h2 className="text-[10px] font-bold text-slate-500 uppercase mb-3">Live Operations</h2>
              <div className="flex-1 overflow-y-auto space-y-2 text-[10px] font-mono">
                {logs.map((l, i) => <div key={i} className={`p-1 border-b border-slate-700/30 ${l.type === 'success' ? 'text-emerald-400' : l.type === 'error' ? 'text-rose-400' : 'text-slate-400'}`}>{l.message}</div>)}
              </div>
            </section>
          </div>

          <div className="lg:col-span-8">
            {plan ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plan.tasks.map(t => (
                  <SubTaskCard 
                    key={t.id} 
                    task={t} 
                    assignedProvider={providers.find(p => p.id === t.assignedProviderId)}
                    onApprove={approveTask} 
                    onReject={() => {}}
                    onDownload={() => {}}
                  />
                ))}
              </div>
            ) : (
              <div className="h-64 border-2 border-dashed border-slate-800 rounded-3xl flex items-center justify-center text-slate-600 bg-slate-900/10">
                <p className="font-bold">Autonomous Pipeline Idle</p>
              </div>
            )}
          </div>
        </main>
      )}

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-slate-800 flex justify-between items-center text-[10px] font-bold text-slate-600 uppercase">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span>MNEE Mainnet Protocol Relay Oracle Active</span>
        </div>
        <div>© 2026 Autonomous Agent Relay Service</div>
      </footer>
    </div>
  );
};

export default App;