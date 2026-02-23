
import React from 'react';
import { Student, Occurrence, User, ViewState } from '../types';
import { DEFAULT_STUDENT_IMAGE } from '../constants';

interface DashboardProps {
  students: Student[];
  occurrences: Occurrence[];
  onSelectStudent: (student: Student) => void;
  onAddStudent: () => void;
  onAddOccurrence: () => void;
  onAnalyzeOccurrences: () => void;
  onSystemManagement?: () => void;
  onViewMonitoring?: () => void;
  onNavigate?: (view: ViewState) => void;
  isAdmin?: boolean;
  hasNewMessage?: boolean;
  onOpenMessages?: () => void;
  newRegisteredUser?: User | null;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  students, 
  occurrences, 
  onSelectStudent, 
  onAddStudent,
  onAddOccurrence,
  onAnalyzeOccurrences,
  onSystemManagement,
  onViewMonitoring,
  onNavigate,
  isAdmin = false,
  hasNewMessage = false,
  onOpenMessages,
  newRegisteredUser
}) => {
  const recentOccurrences = [...occurrences].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4);

  return (
    <div className="p-4 space-y-6 text-slate-700 font-sans">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <span className="text-slate-400 text-xs font-medium mb-1">Total de alunos</span>
          <span className="text-2xl font-bold text-slate-800">{students.length}</span>
          <div className="text-green-500 text-[10px] mt-1"><i className="fas fa-caret-up mr-1"></i> Ativos</div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <span className="text-slate-400 text-xs font-medium mb-1">Ocorrências</span>
          <span className="text-2xl font-bold text-indigo-600">{occurrences.length}</span>
          <div className="text-slate-400 text-[10px] mt-1">Este mês</div>
        </div>
      </div>

      {isAdmin && newRegisteredUser && (
        <section className="animate-fade-in">
          <div 
            onClick={() => onNavigate && onNavigate('USER_MANAGEMENT')}
            className="bg-white p-5 rounded-[1.8rem] border-l-4 border-l-indigo-600 border border-slate-100 shadow-lg shadow-indigo-50/40 flex items-center space-x-4 cursor-pointer hover:shadow-indigo-100/40 active:scale-[0.99] transition-all relative overflow-hidden"
          >
            <div className="absolute -right-4 -bottom-4 opacity-[0.02]">
              <i className="fas fa-user-plus text-7xl text-indigo-900"></i>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-600"></span>
                </span>
                <h3 className="text-[10px] font-extrabold text-indigo-600 tracking-wide">Novo Usuário no Sistema</h3>
              </div>
              
              <div className="flex flex-col space-y-0.5">
                {newRegisteredUser.name && newRegisteredUser.name.trim().length > 0 && (
                  <span className={`text-sm leading-tight text-slate-700 truncate ${newRegisteredUser.socialName ? 'line-through opacity-30 font-medium' : 'font-bold'}`}>
                    {newRegisteredUser.name}
                  </span>
                )}
                {newRegisteredUser.socialName && <span className="text-base font-black text-slate-900 leading-tight">{newRegisteredUser.socialName}</span>}
                <p className="text-[10px] text-slate-400 font-medium mt-0.5 italic">Aguardando revisão de perfil e permissões</p>
              </div>
              
              <div className="flex items-center mt-2.5 bg-emerald-50 w-fit px-2.5 py-1 rounded-full border border-emerald-100 space-x-1.5">
                <i className="fab fa-whatsapp text-emerald-600 text-[10px]"></i>
                <span className="text-[10px] font-bold text-emerald-700">{newRegisteredUser.phone || 'Sem contato cadastrado'}</span>
              </div>
            </div>
            
            <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
              <i className="fas fa-arrow-right-to-bracket text-xs"></i>
            </div>
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold text-slate-800 mb-3 px-1">Ações rápidas</h2>
        <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
            <div onClick={() => onNavigate && onNavigate('STUDENT_LIST')} className="flex-shrink-0 w-24 bg-white p-3 rounded-2xl border border-slate-100 flex flex-col items-center text-center cursor-pointer hover:bg-blue-50 transition-colors">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2">
                    <i className="fas fa-users text-sm"></i>
                </div>
                <span className="text-[10px] font-bold leading-tight text-blue-800">Lista de alunos</span>
            </div>
            <div onClick={() => onNavigate && onNavigate('MY_PROFILE')} className="flex-shrink-0 w-24 bg-white p-3 rounded-2xl border border-slate-100 flex flex-col items-center text-center cursor-pointer hover:bg-indigo-50 transition-colors">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-2">
                    <i className="fas fa-user-circle text-sm"></i>
                </div>
                <span className="text-[10px] font-bold leading-tight text-indigo-800">Meu perfil</span>
            </div>
            <div onClick={onAddOccurrence} className="flex-shrink-0 w-24 bg-white p-3 rounded-2xl border border-slate-100 flex flex-col items-center text-center cursor-pointer hover:bg-orange-50 transition-colors">
                <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-2">
                    <i className="fas fa-clipboard-list text-sm"></i>
                </div>
                <span className="text-[10px] font-bold leading-tight text-orange-800">Registrar ocorrência</span>
            </div>
            <div onClick={onOpenMessages} className="flex-shrink-0 w-24 bg-white p-3 rounded-2xl border border-slate-100 flex flex-col items-center text-center cursor-pointer hover:bg-slate-50 relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${hasNewMessage ? 'bg-indigo-600 text-white animate-blink' : 'bg-purple-100 text-purple-600'}`}>
                    <i className="fas fa-comments text-sm"></i>
                </div>
                <span className="text-[10px] font-medium leading-tight">Mensagens</span>
            </div>
            <div onClick={() => onViewMonitoring && onViewMonitoring()} className="flex-shrink-0 w-24 bg-white p-3 rounded-2xl border border-slate-100 flex flex-col items-center text-center cursor-pointer hover:bg-emerald-50 transition-colors">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
                    <i className="fas fa-file-invoice text-sm"></i>
                </div>
                <span className="text-[10px] font-bold leading-tight text-emerald-800">Acompanhar ocorrências</span>
            </div>

            {isAdmin && (
              <>
                <div onClick={onAddStudent} className="flex-shrink-0 w-24 bg-white p-3 rounded-2xl border border-slate-100 flex flex-col items-center text-center cursor-pointer hover:bg-blue-50 transition-colors">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2">
                        <i className="fas fa-user-plus text-sm"></i>
                    </div>
                    <span className="text-[10px] font-bold leading-tight text-blue-800">Cadastro de aluno</span>
                </div>

                <div onClick={onAnalyzeOccurrences} className="flex-shrink-0 w-24 bg-white p-3 rounded-2xl border border-slate-100 flex flex-col items-center text-center cursor-pointer hover:bg-indigo-50 border-indigo-100 transition-colors">
                    <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center mb-2 shadow-sm">
                        <i className="fas fa-magnifying-glass-chart text-sm"></i>
                    </div>
                    <span className="text-[10px] font-bold leading-tight text-indigo-700">Análise de ocorrências</span>
                </div>

                <div onClick={onSystemManagement} className="flex-shrink-0 w-24 bg-white p-3 rounded-2xl border border-slate-100 flex flex-col items-center text-center cursor-pointer hover:bg-indigo-50 border-indigo-100 transition-colors">
                    <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center mb-2 shadow-sm">
                        <i className="fas fa-gears text-sm"></i>
                    </div>
                    <span className="text-[10px] font-bold leading-tight text-purple-700">Sistema</span>
                </div>
              </>
            )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-semibold text-slate-800">Últimas ocorrências</h2>
            <button className="text-xs text-indigo-600 font-medium">Ver todas</button>
        </div>
        <div className="space-y-3">
          {recentOccurrences.length > 0 ? recentOccurrences.map(occ => {
            const student = students.find(s => s.id === occ.studentId);
            return (
              <div key={occ.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex space-x-3 items-start cursor-pointer active:bg-slate-50 transition-colors" onClick={() => student && onSelectStudent(student)}>
                <img src={student?.profileImage || DEFAULT_STUDENT_IMAGE} alt={student?.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-semibold text-slate-800 truncate max-w-[150px]">{student?.name}</h3>
                    {occ.severity && <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${occ.severity === 'Alta' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{occ.severity}</span>}
                  </div>
                  <p className="text-xs text-slate-600 font-medium line-clamp-1">{occ.titles.join(', ')}</p>
                  <div className="flex items-center mt-2 text-[10px] text-slate-400">
                    <i className="far fa-clock mr-1"></i>
                    <span>{new Date(occ.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            );
          }) : <p className="text-center text-slate-400 text-xs py-4 italic">Nenhuma ocorrência recente.</p>}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
