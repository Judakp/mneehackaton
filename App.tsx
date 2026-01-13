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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'directory' | 'provider'>('dashboard');
  const [providers, setProviders] = useState<ServiceProvider[]>(() => {
    const saved = localStorage.getItem('mnee_providers');
    return saved ? JSON.parse(saved) : INITIAL_PROVIDERS;
  });
  
  // Nouveaux états restaurés
  const [newProv, setNewProv] = useState<Omit<ServiceProvider, 'id'>>({ name: '', wallet: '', category: 'Tech', description: '' });
  const [actingAsProviderId, setActingAsProviderId] = useState<string>('');

  const [userPrompt, setUserPrompt] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [totalBudget, setTotalBudget] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [plan, setPlan] = useState<ProjectPlan | null>(null);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0.00");

  const mneeService = new MNEEService();

  useEffect(() => { localStorage.setItem('mnee_providers', JSON.stringify(providers)); }, [providers]);

  const addLog = (message: string, type: ExecutionLog['type'] = 'info') => {
    setLogs(prev => [{ timestamp: Date.now(), message, type }, ...prev].slice(0, 50));
  };

  const handleConnect = async () => {
    try {
      const addr = await mneeService.connectWallet();
      if (addr) {
        setWalletAddress(addr);
        setBalance(await mneeService.getBalance(addr));
        addLog(`Relay wallet active: ${addr.substring(0, 6)}...`, 'success');
      }
    } catch (err) {
      addLog("Simulation Mode active.", "warning");
      setWalletAddress("0x71C765... (Internal)");
      setBalance(MNEEService.simulateBalance());
    }
  };

  const handleAddProvider = (e: React.FormEvent) => {
    e.preventDefault();
    const provider = { ...newProv, id: Date.now().toString() } as ServiceProvider;
    setProviders([...providers, provider]);
    setNewProv({ name: '', wallet: '', category: 'Tech', description: '' });
    addLog(`Partner ${provider.name} added to directory.`, 'success');
  };

  const runRelay = async () => {
    if (!userPrompt) return addLog("Brief required.", "error");
    setIsProcessing(true);
    setPlan(null);
    addLog(`Contacting Autonomous Relay Proxy...`, 'info');

    try {
      const response = await fetch("/.netlify/functions/gemini-proxy", {
        method: "POST",
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Act as a PM. Decompose: "${userPrompt}" into a JSON ProjectPlan. Budget: ${totalBudget} MNEE.` }] }]
        }),
      });

      const data = await response.json();
      const aiText = data.candidates[0].content.parts[0].text;
      const cleanJson = aiText.replace(/```json|```/g, "").trim();
      setPlan(JSON.parse(cleanJson));
      addLog(`Workflow optimized.`, 'success');
    } catch (e: any) {
      addLog(`Relay Error: ${e.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="main-container">
      <header className="header-relay">
        <div className="brand"><h1>MNEE <span className="highlight">RELAY</span></h1></div>
        <div className="header-actions">
          <nav className="tab-nav">
            {['dashboard', 'directory', 'provider'].map((t) => (
              <button key={t} onClick={() => setActiveTab(t as any)} className={`tab-btn ${activeTab === t ? 'active' : ''}`}>
                {t === 'dashboard' ? 'Console' : t === 'directory' ? 'Directory' : 'Hub'}
              </button>
            ))}
          </nav>
          <div className="balance-box"><span className="amount">{balance} MNEE</span></div>
          <button onClick={handleConnect} className="btn-connect">{walletAddress ? "Connected" : "Connect"}</button>
        </div>
      </header>

      {/* 1. DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <main className="dashboard-grid">
          <div className="side-panel">
            <section className="card-relay">
              <div className="form-group">
                <input type="text" placeholder="Company Name" value={companyName} onChange={e => setCompanyName(e.target.value)} className="input-relay" />
                <textarea value={userPrompt} onChange={e => setUserPrompt(e.target.value)} placeholder="What needs to be done?" className="input-relay textarea" />
                <button onClick={runRelay} disabled={isProcessing} className="btn-primary">{isProcessing ? 'Thinking...' : 'Launch'}</button>
              </div>
            </section>
            <section className="card-relay log-section">
              <div className="log-container">
                {logs.map((l, i) => <div key={i} className={`log-entry ${l.type}`}>{l.message}</div>)}
              </div>
            </section>
          </div>
          <div className="main-panel">
            {plan ? (
              <div className="task-grid">{plan.tasks.map(t => <SubTaskCard key={t.id} task={t} onApprove={()=>{}} onReject={()=>{}} onDownload={()=>{}} />)}</div>
            ) : (<div className="empty-state"><p>Autonomous Pipeline Idle</p></div>)}
          </div>
        </main>
      )}

      {/* 2. DIRECTORY TAB (Restaurée) */}
      {activeTab === 'directory' && (
        <main className="dashboard-grid">
          <div className="side-panel">
            <section className="card-relay">
              <h2 className="card-title">Register Partner</h2>
              <form onSubmit={handleAddProvider} className="form-group">
                <input type="text" placeholder="Entity Name" required value={newProv.name} onChange={e => setNewProv({...newProv, name: e.target.value})} className="input-relay" />
                <input type="text" placeholder="Wallet 0x..." required value={newProv.wallet} onChange={e => setNewProv({...newProv, wallet: e.target.value})} className="input-relay" />
                <button type="submit" className="btn-primary">Onboard</button>
              </form>
            </section>
          </div>
          <div className="main-panel">
            <div className="task-grid">
              {providers.map(p => (
                <div key={p.id} className="card-relay">
                  <h3>{p.name}</h3>
                  <p className="text-blue-400">{p.category}</p>
                  <p className="hash-value">{p.wallet}</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* 3. PROVIDER HUB TAB (Restaurée) */}
      {activeTab === 'provider' && (
        <main className="card-relay">
          <h2 className="card-title">Provider Workspace</h2>
          <select value={actingAsProviderId} onChange={e => setActingAsProviderId(e.target.value)} className="input-relay">
            <option value="">Select Identity...</option>
            {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="empty-state" style={{marginTop: '2rem'}}>No active work orders for this provider.</div>
        </main>
      )}

      <footer className="main-footer"><div>Oracle Active</div><div>© 2026 MNEE Relay</div></footer>
    </div>
  );
};

export default App;