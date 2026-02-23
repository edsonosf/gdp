import React, { useState } from 'react';
import { User, Occurrence, Student } from '../types';
import { DEFAULT_STUDENT_IMAGE } from '../constants';

interface OccurrenceMonitoringProps {
  currentUser: User | null;
  occurrences: Occurrence[];
  students: Student[];
  onResolve?: (occurrenceId: string) => void;
  onSelectStudent: (student: Student) => void;
}

const OccurrenceMonitoring: React.FC<OccurrenceMonitoringProps> = ({ 
  currentUser, 
  occurrences, 
  students,
  onResolve,
  onSelectStudent
}) => {
  const [filterType, setFilterType] = useState<'All' | 'Pendente' | 'Resolvida'>('Pendente');

  let filteredOccurrences = [...occurrences];

  if (!currentUser?.isSystemAdmin) {
    // Usuários comuns veem apenas o que eles mesmos reportaram
    filteredOccurrences = filteredOccurrences.filter(occ => occ.reporterId === currentUser?.id);
  } else {
    // Admins veem tudo, filtrado pelo tipo selecionado
    filteredOccurrences = filteredOccurrences
      .filter(occ => filterType === 'All' ? true : occ.status === filterType)
      .sort((a, b) => a.reporterName.localeCompare(b.reporterName));
  }

  // Aplicação final do filtro de status para não-admins também
  if (!currentUser?.isSystemAdmin) {
    filteredOccurrences = filteredOccurrences.filter(occ => filterType === 'All' ? true : occ.status === filterType);
  }

  return (
    <div className="p-4 space-y-4 pb-20 animate-fade-in text-slate-700 font-sans">
      <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
        {(['All', 'Pendente', 'Resolvida'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`flex-1 py-2 text-[10px] font-bold rounded-xl transition-all ${
              filterType === type 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-400 hover:bg-slate-50'
            }`}
          >
            {type === 'All' ? 'Todas' : type}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredOccurrences.length > 0 ? (
          filteredOccurrences.map(occ => {
            const student = students.find(s => s.id === occ.studentId);
            return (
              <div key={occ.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 flex items-start space-x-4">
                  <div 
                    onClick={() => student && onSelectStudent(student)}
                    className="cursor-pointer group"
                  >
                    <img 
                      src={student?.profileImage || DEFAULT_STUDENT_IMAGE} 
                      alt={student?.name} 
                      className="w-16 h-16 rounded-full object-cover border-2 border-slate-50 shadow-sm group-hover:border-indigo-200 transition-all"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-sm font-bold text-slate-800 truncate">{student?.name}</h3>
                      <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold ${
                        occ.status === 'Pendente' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {occ.status}
                      </span>
                    </div>
                    
                    <p className="text-[10px] text-slate-500 font-bold mb-2">
                      {student?.grade} • {student?.classroom}
                    </p>

                    <div className="flex flex-wrap gap-1">
                      {occ.titles.slice(0, 2).map((t, idx) => (
                        <span key={idx} className="bg-slate-50 text-slate-600 text-[9px] px-2 py-0.5 rounded-lg border border-slate-100 font-bold">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <span className="block text-[8px] text-slate-400 font-bold">Registrado por</span>
                      <div className="flex items-center space-x-2">
                        <i className="fas fa-user-edit text-indigo-400 text-[10px]"></i>
                        <span className="text-[10px] font-bold text-slate-600">{occ.reporterName}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      {/* Lógica solicitada: O botão 'Resolver' só aparece se for admin e a ocorrência estiver pendente */}
                      {occ.status === 'Pendente' && onResolve && currentUser?.isSystemAdmin && (
                        <button 
                          onClick={() => onResolve(occ.id)}
                          className="px-3 py-1.5 bg-indigo-600 text-white text-[9px] font-bold rounded-lg shadow-sm active:scale-95 transition-all"
                        >
                          Resolver
                        </button>
                      )}
                      <button 
                        onClick={() => student && onSelectStudent(student)}
                        className="p-2 bg-white border border-slate-200 text-slate-400 rounded-lg hover:text-indigo-600 hover:border-indigo-200 transition-all"
                      >
                        <i className="fas fa-eye text-xs"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <i className="fas fa-clipboard-check text-2xl opacity-20"></i>
            </div>
            <p className="text-xs font-bold">Nenhuma ocorrência encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OccurrenceMonitoring;