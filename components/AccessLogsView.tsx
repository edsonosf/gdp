import React, { useState, useEffect } from 'react';
import { AccessLog, User } from '../types';

interface AccessLogsViewProps {
  onBack: () => void;
  currentUser?: User | null;
}

const AccessLogsView: React.FC<AccessLogsViewProps> = ({ onBack, currentUser }) => {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/logs');
        if (res.ok) {
          const data = await res.json();
          setLogs(data);
        } else {
          const errData = await res.json();
          setError(errData.error || "Erro ao carregar logs");
        }
      } catch (err) {
        console.error("Failed to fetch logs:", err);
        setError("Erro de conexão ao carregar logs");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    (log.event?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (log.user_id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
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

  const getEventIcon = (event: string) => {
    if (event.includes('user')) return 'fa-user-cog';
    if (event.includes('student')) return 'fa-user-graduate';
    if (event.includes('occurrence')) return 'fa-exclamation-triangle';
    if (event.includes('system')) return 'fa-server';
    if (event.includes('sync')) return 'fa-sync-alt';
    return 'fa-history';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col animate-fade-in text-slate-700">
      {/* Header Actions */}
      <div className="bg-white p-4 border-b border-slate-100 flex justify-center sticky top-0 z-10 shadow-sm">
        <button 
          onClick={handleClearLogs}
          className="px-6 py-2 bg-red-600 text-white text-[10px] font-black rounded-xl hover:bg-red-700 transition-colors shadow-sm"
        >
          Limpar Histórico
        </button>
      </div>

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
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-red-500">
            <i className="fas fa-exclamation-circle text-6xl mb-4 opacity-20"></i>
            <p className="text-sm font-bold">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-slate-200 text-slate-700 text-[10px] font-black rounded-xl"
            >
              Tentar Novamente
            </button>
          </div>
        ) : filteredLogs.length > 0 ? (
          filteredLogs.map((log, idx) => (
            <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3 animate-scale-in">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs ${
                    log.event.includes('system') ? 'bg-indigo-50 text-indigo-600' :
                    log.event.includes('user') ? 'bg-blue-50 text-blue-600' :
                    log.event.includes('student') ? 'bg-emerald-50 text-emerald-600' :
                    log.event.includes('occurrence') ? 'bg-amber-50 text-amber-600' :
                    'bg-slate-50 text-slate-600'
                  }`}>
                    <i className={`fas ${getEventIcon(log.event)}`}></i>
                  </div>
                  <h3 className="text-sm font-black text-slate-800">{log.event}</h3>
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${log.status === 'success' || log.status === 'Sucesso' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {log.status}
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] text-slate-500 font-medium">
                  Usuário: <span className="text-slate-700 font-black">{log.user_name || log.user_id}</span>
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  Endereço IP: <span className="text-slate-700 font-black">{log.ip_address}</span>
                </p>
              </div>

              <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span>Data: {new Date(log.timestamp).toLocaleDateString('pt-BR')}</span>
                <span>Hora: {new Date(log.timestamp).toLocaleTimeString('pt-BR')}</span>
              </div>

              {log.description && (
                <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-100 italic text-[10px] text-slate-600 leading-relaxed">
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
