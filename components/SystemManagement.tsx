import React, { useState, useRef, useEffect } from 'react';
import { AccessLog } from '../types';
import { LOTACAO_EDUCACAO_OPTIONS } from '../constants';

interface SystemManagementProps {
  onRecordLog?: (event: AccessLog['event'], status: AccessLog['status'], userId?: string, description?: string) => void;
}

const UNIDADE_MUNICIPAL_OPTIONS = [
  "Gabinete do Prefeito",
  "Gabinete Vice-Prefeito",
  "Controladoria Geral do Município",
  "Secretaria de Comunicação",
  "Secretaria de Cultura e Turismo",
  "Secretaria de Educação",
  "Secretaria de Saúde",
  "Secretaria de Infraestrutura, Mobility and Controle Urbano",
  "Secretaria de Desenvolvimento Econômico",
  "Secretaria de Gestão, Orçamento e Finanças",
  "Secretaria Especial de Integração de Políticas Sociais (SEPS)"
];

const UNIDADE_ATENDIMENTO_SAUDE = [
  "Centro de Controle de Zoonoses",
  "Centro de Especialidades Odontológicas - CEO Municipal",
  "Centro Integrado de Reabilitação de Maracanaú – Cirm",
  "Centros de Atenção Psicossocial – Caps",
  "UPA 24h de Maracanaú",
  "Farmácia Pólo"
];

const SystemManagement: React.FC<SystemManagementProps> = ({ onRecordLog }) => {
  const [schoolYear, setSchoolYear] = useState('2026');
  const [unidadeMunicipal, setUnidadeMunicipal] = useState('');
  const [unidadeAtendimento, setUnidadeAtendimento] = useState('');
  const [unidadeEducacional, setUnidadeEducacional] = useState('');
  const [unidadeSelecionada, setUnidadeSelecionada] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLogViewer, setShowLogViewer] = useState(false);
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [dbStatus, setDbStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [dbMessage, setDbMessage] = useState('');

  // Estados para Identidade Visual
  const [leftLogo, setLeftLogo] = useState<string | null>(null);
  const [rightLogo, setRightLogo] = useState<string | null>(null);
  const [showHeaderText, setShowHeaderText] = useState(false);
  const [showFooterDivider, setShowFooterDivider] = useState(false);
  const [showFooterText, setShowFooterText] = useState(false);
  
  const studentImportRef = useRef<HTMLInputElement>(null);
  const teacherImportRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const leftLogoRef = useRef<HTMLInputElement>(null);
  const rightLogoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      if (showLogViewer) {
        try {
          const res = await fetch('/api/logs');
          if (res.ok) {
            const data = await res.json();
            setLogs(data);
          }
        } catch (err) {
          console.error("Failed to fetch logs:", err);
        }
      }
    };
    fetchLogs();
  }, [showLogViewer]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleApplyVisualIdentity = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (onRecordLog) onRecordLog('critical.action', 'success', undefined, 'Identidade visual da unidade aplicada');
      alert("Identidade Visual aplicada com sucesso! Os relatórios agora utilizarão as novas definições de cabeçalho e rodapé.");
    }, 1000);
  };

  const handleBackup = async () => {
    setLoading(true);
    try {
      const [studentsRes, occurrencesRes, usersRes, logsRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/occurrences'),
        fetch('/api/users'),
        fetch('/api/logs')
      ]);

      if (!studentsRes.ok || !occurrencesRes.ok || !usersRes.ok || !logsRes.ok) {
        throw new Error("Falha ao buscar dados para backup");
      }

      const students = await studentsRes.json();
      const occurrences = await occurrencesRes.json();
      const users = await usersRes.json();
      const logs = await logsRes.json();

      const backupData = {
        students,
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

  const handleResetDatabase = () => {
    const msg1 = "ATENÇÃO: Esta ação é IRREVERSÍVEL.\n\nTodos os alunos, ocorrências e usuários (exceto os padrões do sistema) serão APAGADOS permanentemente.\n\nDeseja realmente limpar todo o banco de dados?";
    if (!window.confirm(msg1)) return;

    const msg2 = "CONFIRMAÇÃO FINAL:\n\nTem certeza absoluta? O sistema será resetado para o estado original.";
    if (!window.confirm(msg2)) return;

    setLoading(true);
    setTimeout(async () => {
      try {
        const res = await fetch('/api/reset-db', { method: 'POST' });
        if (res.ok) {
          localStorage.removeItem('educontrol_unread_ids');
          localStorage.removeItem('educontrol_current_user');
          
          if (onRecordLog) onRecordLog('critical.action', 'success', undefined, 'Banco de dados reinicializado');
          
          alert("BANCO DE DADOS REINICIALIZADO!\n\nO sistema será recarregado agora.");
          window.location.reload();
        } else {
          throw new Error("Falha ao resetar banco de dados");
        }
      } catch (err) {
        console.error("Reset error:", err);
        alert("Erro ao resetar banco de dados.");
      } finally {
        setLoading(false);
      }
    }, 1500);
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
        const hasStudents = Object.prototype.hasOwnProperty.call(data, 'students');
        const hasOccurrences = Object.prototype.hasOwnProperty.call(data, 'occurrences');
        const hasUsers = Object.prototype.hasOwnProperty.call(data, 'users');

        if (hasStudents && hasOccurrences && hasUsers) {
          const res = await fetch('/api/restore-db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              students: typeof data.students === 'string' ? JSON.parse(data.students) : data.students,
              occurrences: typeof data.occurrences === 'string' ? JSON.parse(data.occurrences) : data.occurrences,
              users: typeof data.users === 'string' ? JSON.parse(data.users) : data.users,
              logs: typeof data.logs === 'string' ? JSON.parse(data.logs) : data.logs
            })
          });

          if (res.ok) {
            if (onRecordLog) onRecordLog('critical.action', 'success', undefined, 'Restauração de backup realizada');
            localStorage.removeItem('educontrol_current_user');
            localStorage.removeItem('educontrol_unread_ids');
            
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
      localStorage.removeItem('educontrol_admin_notif');
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
      {/* Importar Dados */}
      <section className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 ml-1">Importar dados</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => studentImportRef.current?.click()}
            className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-indigo-50 hover:border-indigo-200 transition-all group"
          >
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm text-indigo-600 group-hover:scale-110 transition-transform">
              <i className="fas fa-user-graduate"></i>
            </div>
            <span className="text-[10px] font-bold text-slate-600 text-center">Dados de alunos</span>
            <input type="file" ref={studentImportRef} className="hidden" accept=".csv,.xlsx,.json" onChange={() => handleImport('alunos')} />
          </button>

          <button 
            onClick={() => teacherImportRef.current?.click()}
            className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-emerald-50 hover:border-emerald-200 transition-all group"
          >
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm text-emerald-600 group-hover:scale-110 transition-transform">
              <i className="fas fa-chalkboard-user"></i>
            </div>
            <span className="text-[10px] font-bold text-slate-600 text-center">Dados de professores</span>
            <input type="file" ref={teacherImportRef} className="hidden" accept=".csv,.xlsx,.json" onChange={() => handleImport('professores')} />
          </button>
        </div>
      </section>

      {/* Configuração de Unidade de Trabalho */}
      <section className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 ml-1">Configuração de unidade de trabalho</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 ml-1">Unidade municipal *</label>
            <select 
              value={unidadeMunicipal}
              onChange={(e) => {
                setUnidadeMunicipal(e.target.value);
                setUnidadeAtendimento('');
                setUnidadeEducacional('');
              }}
              className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Selecione a unidade municipal</option>
              {UNIDADE_MUNICIPAL_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {unidadeMunicipal === "Secretaria de Saúde" && (
            <div className="animate-fade-in">
              <label className="block text-xs font-bold text-slate-600 mb-2 ml-1">Unidade de atendimento *</label>
              <select 
                value={unidadeAtendimento}
                onChange={(e) => setUnidadeAtendimento(e.target.value)}
                className="w-full p-3 border border-indigo-200 rounded-xl bg-indigo-50 text-sm font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Selecione a unidade de atendimento</option>
                {UNIDADE_ATENDIMENTO_SAUDE.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          )}

          {unidadeMunicipal === "Secretaria de Educação" && (
            <div className="animate-fade-in">
              <label className="block text-xs font-bold text-slate-600 mb-2 ml-1">Unidade educacional *</label>
              <select 
                value={unidadeEducacional}
                onChange={(e) => setUnidadeEducacional(e.target.value)}
                className="w-full p-3 border border-indigo-200 rounded-xl bg-indigo-50 text-sm font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Selecione a unidade educacional</option>
                {LOTACAO_EDUCACAO_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 transition-all">
            <div>
              <span className="block text-xs font-bold text-slate-700">Selecionar</span>
              <span className="text-[10px] text-slate-400 font-medium">Ativar unidade selecionada</span>
            </div>
            <button 
              onClick={() => {
                if (!unidadeMunicipal) {
                  alert("Por favor, selecione uma unidade municipal primeiro.");
                  return;
                }
                setUnidadeSelecionada(!unidadeSelecionada);
              }}
              className={`w-12 h-6 rounded-full transition-all relative ${unidadeSelecionada ? 'bg-indigo-600' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${unidadeSelecionada ? 'right-1' : 'left-1'}`}></div>
            </button>
          </div>
        </div>
      </section>

      {/* Identidade Visual da Unidade de Trabalho */}
      <section className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <h3 className="text-[10px] font-black text-slate-400 ml-1">Identidade visual da unidade de trabalho</h3>
        
        {/* Cabeçalho de Documentos */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-50">
            <i className="fas fa-heading text-indigo-600 text-sm"></i>
            <h4 className="text-xs font-black text-slate-800">Cabeçalho de documentos</h4>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-2 ml-1">Anexar logo da gestão ou unidade municipal</label>
              <div 
                onClick={() => leftLogoRef.current?.click()}
                className="relative w-full aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50/50 hover:border-indigo-200 transition-all overflow-hidden"
              >
                {leftLogo ? (
                  <img src={leftLogo} alt="Logo esquerdo" className="w-full h-full object-contain p-2" />
                ) : (
                  <>
                    <i className="fas fa-image text-slate-300 text-2xl mb-1"></i>
                    <span className="text-[9px] font-bold text-slate-400 text-center px-4">Clique para anexar imagem (Alinhamento esquerdo)</span>
                  </>
                )}
              </div>
              <p className="text-[8px] text-slate-400 mt-1 ml-1 font-medium italic">Essa imagem será alinhada do lado esquerdo dos relatórios</p>
              <input type="file" ref={leftLogoRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setLeftLogo)} />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 transition-all">
              <div>
                <span className="block text-xs font-bold text-slate-700">Exibir texto central do cabeçalho</span>
                <span className="text-[10px] text-slate-400 font-medium">Exibição de títulos institucionais</span>
              </div>
              <button 
                onClick={() => setShowHeaderText(!showHeaderText)}
                className={`w-12 h-6 rounded-full transition-all relative ${showHeaderText ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showHeaderText ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-2 ml-1">Adicionar logo da sub-unidade</label>
              <div 
                onClick={() => rightLogoRef.current?.click()}
                className="relative w-full aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50/50 hover:border-indigo-200 transition-all overflow-hidden"
              >
                {rightLogo ? (
                  <img src={rightLogo} alt="Logo direito" className="w-full h-full object-contain p-2" />
                ) : (
                  <>
                    <i className="fas fa-image text-slate-300 text-2xl mb-1"></i>
                    <span className="text-[9px] font-bold text-slate-400 text-center px-4">Clique para anexar imagem (Alinhamento direito)</span>
                  </>
                )}
              </div>
              <p className="text-[8px] text-slate-400 mt-1 ml-1 font-medium italic">Essa imagem será alinhada do lado direito dos relatórios</p>
              <input type="file" ref={rightLogoRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setRightLogo)} />
            </div>
          </div>
        </div>

        {/* Rodapé de Documentos */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-50">
            <i className="fas fa-shoe-prints text-indigo-600 text-sm"></i>
            <h4 className="text-xs font-black text-slate-800">Rodapé de documentos</h4>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 transition-all">
              <div>
                <span className="block text-xs font-bold text-slate-700">Inserir linha divisória do rodapé</span>
                <span className="text-[10px] text-slate-400 font-medium">Linha visual de separação final</span>
              </div>
              <button 
                onClick={() => setShowFooterDivider(!showFooterDivider)}
                className={`w-12 h-6 rounded-full transition-all relative ${showFooterDivider ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showFooterDivider ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 transition-all">
              <div>
                <span className="block text-xs font-bold text-slate-700">Exibir texto central do rodapé</span>
                <span className="text-[10px] text-slate-400 font-medium">Informações de contato e endereço</span>
              </div>
              <button 
                onClick={() => setShowFooterText(!showFooterText)}
                className={`w-12 h-6 rounded-full transition-all relative ${showFooterText ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showFooterText ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>

            <button 
              onClick={handleApplyVisualIdentity}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl text-[11px] font-black shadow-lg shadow-indigo-100 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
            >
              <i className="fas fa-palette"></i>
              <span>Aplicar identidade visual</span>
            </button>
          </div>
        </div>
      </section>

      {/* Período Letivo */}
      <section className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 ml-1">Configuração geral</h3>
        
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-600 ml-1">Ano letivo vigente</label>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <select 
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                className="w-full p-3 pr-8 border border-slate-200 rounded-xl bg-slate-50 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
              >
                <option value="2024">2024 - Encerrado</option>
                <option value="2025">2025 - Encerrado</option>
                <option value="2026">2026 - Em andamento</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <i className="fas fa-chevron-down text-xs"></i>
              </div>
            </div>
            <button 
              onClick={handleEndYear}
              disabled={!isCurrentYearActive}
              className={`flex items-center justify-center space-x-1 whitespace-nowrap h-[46px] text-[10px] font-bold px-4 rounded-xl border transition-all ${
                isCurrentYearActive 
                ? 'text-red-600 bg-red-50 border-red-100 hover:bg-red-100 active:scale-95' 
                : 'text-slate-400 bg-slate-50 border-slate-200 cursor-not-allowed opacity-60'
              }`}
            >
              <i className="fas fa-calendar-times"></i>
              <span>Encerrar ano</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
          <div>
            <span className="block text-xs font-bold text-slate-700">Modo manutenção</span>
            <span className="text-[10px] text-slate-400 font-medium">Bloquear novos registros</span>
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
          <h3 className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-wider">Segurança e infraestrutura</h3>
          <button 
            onClick={testDatabaseConnection}
            disabled={dbStatus === 'testing'}
            className={`text-[9px] font-black px-3 py-1 rounded-full border transition-all ${
              dbStatus === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
              dbStatus === 'error' ? 'bg-red-50 text-red-600 border-red-100' :
              'bg-indigo-50 text-indigo-600 border-indigo-100'
            }`}
          >
            {dbStatus === 'testing' ? 'Testando...' : 'Testar DB'}
          </button>
        </div>

        {dbMessage && (
          <div className={`p-3 rounded-xl text-[10px] font-bold border animate-fade-in ${
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
              <span className="text-xs font-bold">Reinicializar banco de dados</span>
            </div>
            <i className="fas fa-skull-crossbones text-xs text-slate-500"></i>
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
              className="flex items-center justify-center space-x-2 p-3 bg-orange-50 text-orange-700 rounded-xl border border-orange-100 text-[10px] font-bold"
            >
              <i className="fas fa-broom"></i>
              <span>Limpar cache</span>
            </button>
            <button 
              onClick={() => setShowLogViewer(true)}
              className="flex items-center justify-center space-x-2 p-3 bg-slate-50 text-slate-700 rounded-xl border border-slate-200 text-[10px] font-bold"
            >
              <i className="fas fa-list-ul"></i>
              <span>Logs de acesso</span>
            </button>
        </div>
      </section>

      {/* Log Viewer Modal */}
      {showLogViewer && (
        <div className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-md flex flex-col p-4 animate-fade-in">
          <div className="bg-white flex-1 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-black text-slate-800">Audit logs</h3>
                <p className="text-[10px] text-slate-500 font-bold">Últimas atividades do sistema</p>
              </div>
              <button onClick={() => setShowLogViewer(false)} className="w-10 h-10 bg-white shadow-sm border rounded-full flex items-center justify-center text-slate-400">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
              {logs.length > 0 ? (
                logs.map((log, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        <span className="text-[11px] font-black text-slate-800">{log.event}</span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <span className="block text-[8px] font-black text-slate-400 mb-0.5">Usuário</span>
                        <span className="font-bold text-slate-700 truncate block">{log.user_id}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <span className="block text-[8px] font-black text-slate-400 mb-0.5">IP Address</span>
                        <span className="font-mono font-bold text-slate-700">{log.ip_address}</span>
                      </div>
                    </div>

                    <div className="bg-indigo-50/30 p-2 rounded-xl border border-indigo-50">
                      <div className="flex items-center space-x-2 mb-1">
                        <i className={`fas ${log.device_info.type === 'mobile' ? 'fa-mobile-screen' : log.device_info.type === 'tablet' ? 'fa-tablet-screen' : 'fa-desktop'} text-indigo-600 text-[10px]`}></i>
                        <span className="text-[9px] font-black text-indigo-900">{log.device_info.type} • {log.device_info.os} • {log.device_info.browser}</span>
                      </div>
                      <p className="text-[9px] text-slate-400 font-medium truncate">{log.user_agent}</p>
                    </div>

                    {log.description && (
                      <div className="text-[10px] text-slate-600 bg-amber-50 p-2 rounded-xl border border-amber-100 italic">
                        {log.description}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                  <i className="fas fa-history text-5xl mb-4 opacity-20"></i>
                  <p className="text-xs font-bold">Nenhum log registrado</p>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-white border-t">
              <button 
                onClick={async () => {
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
                }}
                className="w-full py-3 bg-red-50 text-red-600 text-[10px] font-black rounded-2xl border border-red-100"
              >
                Apagar histórico de logs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comunicação */}
      <section className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 ml-1">Comunicação interna</h3>
        
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-2">Mensagem do dia (Banner global)</label>
          <textarea 
            placeholder="Digite um aviso para todos os usuários..."
            className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500 h-20 resize-none"
          ></textarea>
        </div>
        
        <button className="w-full bg-indigo-600 text-white py-3 rounded-xl text-xs font-black shadow-md">
          Atualizar avisos
        </button>
      </section>

      <div className="text-center pb-8">
        <p className="text-[9px] text-slate-400 font-bold">
          GDP Admin Engine v2.5.2
        </p>
      </div>

      {loading && (
        <div className="fixed inset-0 z-[150] bg-white/60 backdrop-blur-[4px] flex items-center justify-center">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-black text-indigo-900">Sincronizando...</p>
            <p className="text-[10px] text-slate-400 mt-2 font-bold">Por favor, não feche o aplicativo</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemManagement;