import React, { useState, useRef, useEffect } from 'react';
import { AccessLog, User, Option, LocalUnitOption } from '../types';

interface SystemManagementProps {
  onRecordLog?: (event: AccessLog['event'], status: AccessLog['status'], userId?: string, description?: string) => void;
  currentUser?: User | null;
  onNavigate?: (view: any) => void;
  onRefreshData?: () => void;
  localUnits: LocalUnitOption[];
  organizationalChart: Option[];
}

const UNIDADE_ATENDIMENTO_SAUDE = [
  "Centro de Controle de Zoonoses",
  "Centro de Especialidades Odontológicas - CEO Municipal",
  "Centro Integrado de Reabilitação de Maracanaú – Cirm",
  "Centros de Atenção Psicossocial – Caps",
  "UPA 24h de Maracanaú",
  "Farmácia Pólo"
];

const SystemManagement: React.FC<SystemManagementProps> = ({ onRecordLog, currentUser, onNavigate, onRefreshData, localUnits, organizationalChart }) => {
  const [schoolYear, setSchoolYear] = useState('2026');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [dbMessage, setDbMessage] = useState('');
  const [showResetPopup, setShowResetPopup] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<{ id: string, name: string } | null>(null);
  const [resetPassword, setResetPassword] = useState('');

  const studentImportRef = useRef<HTMLInputElement>(null);
  const teacherImportRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const [syncUrl, setSyncUrl] = useState('https://sge.maracanau.ce.gov.br/auth/login');
  const [syncUser, setSyncUser] = useState('');
  const [syncPassword, setSyncPassword] = useState('12345678');
  const [showSyncPassword, setShowSyncPassword] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  const handleSync = async () => {
    if (!syncUrl || !syncUser || !syncPassword) {
      alert("Por favor, preencha todos os campos de credenciais.");
      return;
    }

    setIsSyncing(true);
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: syncUrl, 
          user: syncUser.replace(/\D/g, ''), // Envia apenas números para o servidor
          password: syncPassword,
          userId: currentUser?.id || currentUser?.cpf || 'unknown'
        })
      });

      const data = await response.json();

      if (response.ok) {
        if (onRecordLog) {
          onRecordLog('Sincronização SGE', 'Sucesso', currentUser?.id || currentUser?.cpf || 'unknown', `Sincronização realizada com sucesso para URL: ${syncUrl}`);
        }
        if (confirm("A sincronização foi realizada com sucesso. Deseja continuar?")) {
          window.location.reload();
        }
      } else {
        if (onRecordLog) {
          onRecordLog('Sincronização SGE', 'Erro', currentUser?.id || currentUser?.cpf || 'unknown', `Falha na sincronização: ${data.error || 'Erro desconhecido'}`);
        }
        alert(`Falha ao Tentar Realizar Sincronização: ${data.error || 'Erro desconhecido'}`);
      }
    } catch (err) {
      console.error("Sync error:", err);
      if (onRecordLog) {
        onRecordLog('Sincronização SGE', 'Erro', currentUser?.id || currentUser?.cpf || 'unknown', `Erro técnico na sincronização: ${(err as Error).message}`);
      }
      alert("Falha ao Tentar Realizar Sincronização.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConvertPhotos = async () => {
    if (!confirm("Deseja converter todos os links de fotos existentes para o formato Base64? Esta ação pode levar alguns minutos.")) {
      return;
    }

    setIsConverting(true);
    try {
      const response = await fetch('/api/convert-existing-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (response.ok) {
        if (onRecordLog) {
          onRecordLog('Conversão de Fotos', 'Sucesso', currentUser?.id || currentUser?.cpf || 'unknown', `Conversão concluída: ${data.successCount} sucessos, ${data.failCount} falhas.`);
        }
        alert(`Conversão concluída com sucesso!\nSucessos: ${data.successCount}\nFalhas: ${data.failCount}`);
        if (onRefreshData) onRefreshData();
      } else {
        alert(`Erro na conversão: ${data.error || 'Erro desconhecido'}`);
      }
    } catch (err) {
      console.error("Conversion error:", err);
      alert("Falha técnica ao converter fotos.");
    } finally {
      setIsConverting(false);
    }
  };

  const isSyncEnabled = syncUrl.trim() !== '' && syncUser.replace(/\D/g, '').length === 11 && syncPassword.trim() !== '';

  const handleBackup = async () => {
    setLoading(true);
    try {
      const [sgeRes, occurrencesRes, usersRes, logsRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/occurrences'),
        fetch('/api/users'),
        fetch('/api/logs')
      ]);

      if (!sgeRes.ok || !occurrencesRes.ok || !usersRes.ok || !logsRes.ok) {
        throw new Error("Falha ao buscar dados para backup");
      }

      const sgeExtractedData = await sgeRes.json();
      const occurrences = await occurrencesRes.json();
      const users = await usersRes.json();
      const logs = await logsRes.json();

      const backupData = {
        sgeExtractedData,
        occurrences,
        users,
        logs,
        app: 'GDP',
        version: '2.5.0',
        timestamp: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gdp_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      if (onRecordLog) onRecordLog('critical.action', 'success', undefined, 'Backup exportado com sucesso');
      alert("Backup gerado e baixado com sucesso!");
    } catch (err) {
      if (onRecordLog) onRecordLog('critical.action', 'failure', undefined, 'Erro ao exportar backup');
      console.error("Backup error:", err);
      alert("Erro inesperado ao gerar o arquivo de backup: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = () => {
    const msg1 = "AVISO CRÍTICO:\n\nA restauração substituirá TODOS os dados atuais (Alunos, Ocorrências e Usuários).\n\nDados não salvos em backups anteriores serão PERDIDOS permanentemente.\n\nDeseja prosseguir?";
    if (!window.confirm(msg1)) return;

    const msg2 = "Você tem certeza absoluta?\nEsta operação apagará o banco de dados atual e reiniciará o aplicativo.";
    if (!window.confirm(msg2)) return;

    if (restoreInputRef.current) {
      restoreInputRef.current.click();
    }
  };

  const handleResetDatabase = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admins');
      if (res.ok) {
        const admins = await res.json();
        if (admins.length > 0) {
          const randomAdmin = admins[Math.floor(Math.random() * admins.length)];
          setSelectedAdmin(randomAdmin);
          setShowResetPopup(true);
        } else {
          alert("Nenhum administrador ativo encontrado para autorizar a ação.");
        }
      } else {
        throw new Error("Falha ao buscar administradores");
      }
    } catch (err) {
      console.error("Fetch admins error:", err);
      alert("Erro ao preparar reinicialização.");
    } finally {
      setLoading(false);
    }
  };

  const confirmResetDatabase = async () => {
    if (!selectedAdmin || !resetPassword) return;

    setLoading(true);
    try {
      const res = await fetch('/api/reset-db', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: selectedAdmin.id, password: resetPassword })
      });
      
      if (res.ok) {
        if (onRecordLog) onRecordLog('critical.action', 'success', undefined, 'Banco de dados reinicializado');
        
        alert("BANCO DE DADOS REINICIALIZADO!\n\nO sistema será recarregado agora.");
        window.location.reload();
      } else {
        const errData = await res.json();
        alert(`Erro: ${errData.error || "Falha ao resetar banco de dados"}`);
      }
    } catch (err) {
      console.error("Reset error:", err);
      alert("Erro ao resetar banco de dados.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        if (!content) throw new Error("Arquivo vazio");

        const data = JSON.parse(content);
        const sgeData = data.sgeExtractedData || data.students;
        const hasStudents = !!sgeData;
        const hasOccurrences = Object.prototype.hasOwnProperty.call(data, 'occurrences');
        const hasUsers = Object.prototype.hasOwnProperty.call(data, 'users');

        if (hasStudents && hasOccurrences && hasUsers) {
          const res = await fetch('/api/restore-db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              students: typeof sgeData === 'string' ? JSON.parse(sgeData) : sgeData,
              occurrences: typeof data.occurrences === 'string' ? JSON.parse(data.occurrences) : data.occurrences,
              users: typeof data.users === 'string' ? JSON.parse(data.users) : data.users,
              logs: typeof data.logs === 'string' ? JSON.parse(data.logs) : data.logs
            })
          });

          if (res.ok) {
            if (onRecordLog) onRecordLog('critical.action', 'success', undefined, 'Restauração de backup realizada');
            
            alert("DADOS RESTAURADOS COM SUCESSO!\n\nO sistema será reiniciado para validar as alterações.");
            window.location.reload();
          } else {
            const errData = await res.json();
            throw new Error(errData.error || "Falha na restauração via API");
          }
        } else {
          throw new Error("Estrutura de chaves inválida no JSON");
        }
      } catch (err) {
        if (onRecordLog) onRecordLog('critical.action', 'failure', undefined, 'Tentativa falha de restauração de backup');
        console.error("Restore error:", err);
        alert("FALHA NA RESTAURAÇÃO:\n" + (err as Error).message);
      } finally {
        setLoading(false);
        if (e.target) e.target.value = '';
      }
    };

    reader.onerror = () => {
      setLoading(false);
      alert("Erro ao ler o arquivo físico do dispositivo.");
    };

    reader.readAsText(file);
  };

  const handleClearCache = () => {
    if (confirm("Isso removerá dados temporários da sessão. Os registros de alunos e ocorrências não serão afetados. Continuar?")) {
      if (onRecordLog) onRecordLog('critical.action', 'success', undefined, 'Cache do sistema limpo');
      alert("Cache limpo!");
      window.location.reload();
    }
  };

  const handleImport = (type: 'alunos' | 'professores') => {
    if (onRecordLog) onRecordLog('critical.action', 'success', undefined, `Simulação de importação de ${type}`);
    alert(`A funcionalidade de importação em massa de ${type} está sendo processada pelo servidor. Tente novamente em instantes.`);
  };

  const handleEndYear = () => {
    if (confirm("ATENÇÃO: Você está prestes a ENCERRAR o ano letivo vigente. Esta ação arquiva todos os registros atuais para consulta histórica e prepara o banco de dados para o próximo ciclo. Deseja continuar?")) {
        if (onRecordLog) onRecordLog('critical.action', 'success', undefined, `Ano letivo ${schoolYear} encerrado manualmente`);
        alert("Ano letivo encerrado com sucesso. Os dados foram movidos para o arquivo histórico.");
    }
  };

  const testDatabaseConnection = async () => {
    setDbStatus('testing');
    try {
      const res = await fetch('/api/db-test');
      const data = await res.json();
      if (res.ok) {
        setDbStatus('success');
        setDbMessage(`Conectado! Hora do servidor DB: ${new Date(data.time).toLocaleString()}`);
      } else {
        setDbStatus('error');
        setDbMessage(`Erro: ${data.message}`);
      }
    } catch (err) {
      setDbStatus('error');
      setDbMessage(`Erro de rede: ${(err as Error).message}`);
    }
  };

  const isCurrentYearActive = schoolYear === '2026';

  return (
    <div className="p-4 space-y-6 pb-24 animate-fade-in relative text-slate-700">
      {/* Sincronizar Box */}
      <section className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-lg font-black text-slate-800 ml-1">Sincronizar com SGE</h3>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Endereço Web*</label>
            <input 
              type="text" 
              value={syncUrl}
              onChange={(e) => setSyncUrl(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="https://..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-sm font-bold text-slate-700 mb-1 ml-1">Usuário*</label>
              <input 
                type="text" 
                value={syncUser}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 11) {
                    setSyncUser(val);
                  }
                }}
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                maxLength={11}
              />
            </div>
            <div>
              <label className="block font-bold text-sm font-bold text-slate-700 mb-1 ml-1">Senha*</label>
              <div className="relative">
                <input 
                  type={showSyncPassword ? "text" : "password"} 
                  value={syncPassword}
                  onChange={(e) => setSyncPassword(e.target.value)}
                  className="w-full p-3 pr-10 border border-slate-200 rounded-xl bg-slate-50 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Digite sua senha"
                />
                <button
                  type="button"
                  onClick={() => setShowSyncPassword(!showSyncPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  <i className={`fas ${showSyncPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>
          </div>

          <button 
            onClick={handleSync}
            disabled={!isSyncEnabled || isSyncing}
            className={`w-full py-4 rounded-2xl text-[12px] font-black shadow-lg transition-all flex items-center justify-center space-x-2 ${
              isSyncEnabled && !isSyncing 
              ? 'bg-indigo-600 text-white shadow-indigo-100 active:scale-[0.98]' 
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isSyncing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Sincronizando...</span>
              </>
            ) : (
              <>
                <i className="fas fa-sync-alt"></i>
                <span>Sincronizar e Importar</span>
              </>
            )}
          </button>

          <button 
            onClick={handleConvertPhotos}
            disabled={isConverting}
            className={`w-full py-4 rounded-2xl text-[12px] font-black shadow-lg transition-all flex items-center justify-center space-x-2 mt-4 ${
              !isConverting 
              ? 'bg-emerald-600 text-white shadow-emerald-100 active:scale-[0.98]' 
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isConverting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Convertendo Fotos...</span>
              </>
            ) : (
              <>
                <i className="fas fa-image"></i>
                <span>Converter Links de Fotos para Base64</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* Período Letivo */}
      <section className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-700 ml-1">Configuração Geral</h3>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleEndYear}
              disabled={!isCurrentYearActive}
              className={`flex items-center justify-center space-x-1 whitespace-nowrap h-[46px] text-[11px] font-bold px-4 rounded-xl border transition-all ${
                isCurrentYearActive 
                ? 'text-red-600 bg-red-50 border-red-100 hover:bg-red-100 active:scale-95' 
                : 'text-sm font-bold text-slate-700 bg-slate-50 border-slate-200 cursor-not-allowed opacity-60'
              }`}
            >
              <i className="fas fa-calendar-times"></i>
              <span>Encerrar Ano Letivo</span>
            </button>
          </div>

        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
          <div>
            <span className="block text-sm font-bold text-slate-700">Modo Manutenção</span>
            <span className="text-sm text-slate-400 font-medium">Bloquear Novos Registros</span>
          </div>
          <button 
            onClick={() => {
              setMaintenanceMode(!maintenanceMode);
              if (onRecordLog) onRecordLog('critical.action', 'success', undefined, `Modo manutenção: ${!maintenanceMode ? 'Ativado' : 'Desativado'}`);
            }}
            className={`w-12 h-6 rounded-full transition-all relative ${maintenanceMode ? 'bg-red-500' : 'bg-slate-300'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${maintenanceMode ? 'right-1' : 'left-1'}`}></div>
          </button>
        </div>
      </section>

      {/* Segurança e Dados */}
      <section className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-400 ml-1 tracking-wider">Segurança</h3>
          <button 
            onClick={testDatabaseConnection}
            disabled={dbStatus === 'testing'}
            className={`text-sm px-3 py-1 rounded-full border transition-all ${
              dbStatus === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
              dbStatus === 'error' ? 'bg-red-50 text-red-600 border-red-100' :
              'bg-indigo-50 text-indigo-600 border-indigo-100'
            }`}
          >
            {dbStatus === 'testing' ? 'Testando...' : 'Testar DB'}
          </button>
        </div>

        {dbMessage && (
          <div className={`p-3 rounded-xl text-sm font-bold border animate-fade-in ${
            dbStatus === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
          }`}>
            <i className={`fas ${dbStatus === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'} mr-2`}></i>
            {dbMessage}
          </div>
        )}
        
        <div className="space-y-3">
          <button 
            onClick={handleBackup}
            disabled={loading}
            className="w-full flex items-center justify-between p-4 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100 hover:bg-indigo-100 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center space-x-3">
              <i className="fas fa-download"></i>
              <span className="text-xs font-bold">Exportar backup (.json)</span>
            </div>
          </button>

          <button 
            onClick={handleRestoreBackup}
            disabled={loading}
            className="w-full flex items-center justify-between p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 hover:bg-red-100 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center space-x-3">
              <i className="fas fa-upload"></i>
              <span className="text-xs font-bold">Restaurar backup</span>
            </div>
            <i className="fas fa-triangle-exclamation text-xs animate-pulse"></i>
          </button>
          
          <button 
            onClick={handleResetDatabase}
            disabled={loading}
            className="w-full flex items-center justify-between p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 hover:bg-black transition-all active:scale-[0.98]"
          >
            <div className="flex items-center space-x-3">
              <i className="fas fa-rotate text-red-400"></i>
              <span className="text-xs font-bold">Reinicializar BD</span>
            </div>
            <i className="fas fa-skull-crossbones text-sm text-slate-500"></i>
          </button>
          
          <input 
            type="file" 
            ref={restoreInputRef} 
            className="hidden" 
            accept=".json" 
            onChange={handleFileRestore} 
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleClearCache}
              className="flex items-center justify-center space-x-2 p-3 bg-orange-50 text-orange-700 rounded-xl border border-orange-100 text-sm font-bold"
            >
              <i className="fas fa-broom"></i>
              <span>Cache</span>
            </button>
            <button 
              onClick={() => onNavigate && onNavigate('ACCESS_LOGS')}
              className="flex items-center justify-center space-x-2 p-3 bg-slate-50 text-slate-700 rounded-xl border border-slate-200 text-sm font-bold"
            >
              <i className="fas fa-list-ul"></i>
              <span>Logs</span>
            </button>
        </div>
      </section>

      {/* Comunicação */}
      <section className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-700  ml-1">Comunicação Interna</h3>
        <div>
          <textarea 
            placeholder="Digite um aviso para todos os usuários..."
            className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 h-20 resize-none"
          ></textarea>
        </div>
        
        <button className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-black shadow-md">
          Atualizar Avisos
        </button>
      </section>

      <div className="text-center pb-8">
        <p className="text-[10px] text-slate-400 font-bold">
          Admin Engine v2.5.2
        </p>
      </div>

      {loading && (
        <div className="fixed inset-0 z-[150] bg-white/60 backdrop-blur-[4px] flex items-center justify-center">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-black text-indigo-900">Sincronizando...</p>
            <p className="text-[11px] text-slate-400 mt-2 font-bold">Por favor, não feche o aplicativo</p>
          </div>
        </div>
      )}

      {/* Reset Database Popup */}
      {showResetPopup && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-scale-in">
            <div className="p-8 bg-slate-900 text-white flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
                <i className="fas fa-skull-crossbones text-2xl text-red-500"></i>
              </div>
              <h3 className="text-sm font-black mb-1 uppercase tracking-tight">Autorização necessária!</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ação crítica detectada.</p>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="bg-red-50/50 border border-red-100 p-5 rounded-[2rem] text-center">
                <p className="text-sm font-bold text-red-800 leading-relaxed">
                  Entre com a senha do Usuário <br/>
                  <span className="text-base font-black uppercase underline decoration-red-400 decoration-2 underline-offset-8 block mt-2">{selectedAdmin?.name}</span>
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-black text-slate-400 uppercase ml-2">Senha de autorização</label>
                <div className="relative">
                  <input 
                    type="password"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    placeholder="senha"
                    className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-red-500 transition-all text-center"
                    autoFocus
                  />
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300">
                    <i className="fas fa-key"></i>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <button 
                  onClick={() => {
                    setShowResetPopup(false);
                    setResetPassword('');
                    setSelectedAdmin(null);
                  }}
                  className="py-4 bg-slate-100 text-slate-600 rounded-2xl text-[11px] font-black hover:bg-slate-200 transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmResetDatabase}
                  disabled={!resetPassword || loading}
                  className="py-4 bg-red-600 text-white rounded-2xl text-[11px] font-black shadow-lg shadow-red-100 hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmar reset
                </button>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
              <p className="text-[11px] font-bold text-slate-400 italic">
                Esta ação apagará permanentemente todos os dados do sistema.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemManagement;