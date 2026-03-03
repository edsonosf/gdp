import React, { useState, useEffect } from 'react';
import { AccessLog, User } from '../types';

interface AccessLogsViewProps {
  onBack: () => void;
  currentUser?: User | null;
}

const AccessLogsView: React.FC<AccessLogsViewProps> = ({ onBack, currentUser }) => {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/logs');
        if (res.ok) {
          const data = await res.json();
          setLogs(data);
        }
      } catch (err) {
        console.error("Failed to fetch logs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.description && log.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleClearLogs = async () => {
    if (confirm("Tem certeza que deseja apagar todo o histórico de logs?")) {
      try {
        const res = await fetch('/api/logs', { method: 'DELETE' });
        if (res.ok) {
          setLogs([]);
          alert("Logs limpos com sucesso.");
        }
      } catch (err) {
        console.error("Failed to clear logs:", err);
        alert("Erro ao limpar logs.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col animate-fade-in text-slate-700">
      {/* Header */}
      <header className="bg-white p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-800">Logs de Acesso</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Auditoria do Sistema</p>
          </div>
        </div>
        <button 
          onClick={handleClearLogs}
          className="px-4 py-2 bg-red-50 text-red-600 text-[10px] font-black rounded-xl border border-red-100 hover:bg-red-100 transition-colors"
        >
          Limpar Histórico
        </button>
      </header>

      {/* Search Bar */}
      <div className="p-4">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Pesquisar por evento, usuário ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-4 pl-12 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
            <i className="fas fa-search"></i>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-xs font-bold text-slate-400">Carregando logs...</p>
          </div>
        ) : filteredLogs.length > 0 ? (
          filteredLogs.map((log, idx) => (
            <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4 animate-scale-in">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${log.status === 'success' || log.status === 'Sucesso' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    <i className={`fas ${log.event.includes('login') ? 'fa-sign-in-alt' : log.event.includes('logout') ? 'fa-sign-out-alt' : 'fa-bolt'}`}></i>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800">{log.event}</h3>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${log.status === 'success' || log.status === 'Sucesso' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {log.status}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-mono font-bold">
                  {new Date(log.timestamp).toLocaleString('pt-BR')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="block text-[8px] font-black text-slate-400 uppercase mb-1">Usuário</span>
                  <span className="text-xs font-bold text-slate-700 truncate block">{log.user_id}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="block text-[8px] font-black text-slate-400 uppercase mb-1">Endereço IP</span>
                  <span className="text-xs font-mono font-bold text-slate-700">{log.ip_address}</span>
                </div>
              </div>

              {log.device_info && (
                <div className="bg-indigo-50/30 p-3 rounded-2xl border border-indigo-50 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                      <i className={`fas ${log.device_info.type === 'mobile' ? 'fa-mobile-screen' : log.device_info.type === 'tablet' ? 'fa-tablet-screen' : 'fa-desktop'}`}></i>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-indigo-900 block">{log.device_info.type} • {log.device_info.os}</span>
                      <span className="text-[9px] text-indigo-500 font-bold">{log.device_info.browser}</span>
                    </div>
                  </div>
                  <i className="fas fa-info-circle text-indigo-200 text-xs"></i>
                </div>
              )}

              {log.description && (
                <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-100 italic text-xs text-slate-600 leading-relaxed">
                  {log.description}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300">
            <i className="fas fa-history text-6xl mb-4 opacity-20"></i>
            <p className="text-sm font-bold">Nenhum log encontrado</p>
            {searchTerm && <p className="text-[10px] mt-1">Tente outro termo de pesquisa</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccessLogsView;
