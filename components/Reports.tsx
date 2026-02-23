
import React, { useState } from 'react';
import { Occurrence, Student, OccurrenceType } from '../types';

interface ReportsProps {
  occurrences: Occurrence[];
  students: Student[];
  onIndividualReportSearch: () => void;
}

const Reports: React.FC<ReportsProps> = ({ occurrences, students, onIndividualReportSearch }) => {
  const [filter, setFilter] = useState('month');
  const [generating, setGenerating] = useState(false);

  const disciplinaryCount = occurrences.filter(o => o.type === OccurrenceType.DISCIPLINARY).length;
  const pedagogicalCount = occurrences.filter(o => o.type === OccurrenceType.PEDAGOGICAL).length;
  const totalCount = occurrences.length;

  const disciplinaryPercent = totalCount > 0 ? (disciplinaryCount / totalCount) * 100 : 0;
  const pedagogicalPercent = totalCount > 0 ? (pedagogicalCount / totalCount) * 100 : 0;

  const handleExport = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      alert("Relatório exportado com sucesso em PDF! (Simulação)");
    }, 1500);
  };

  return (
    <div className="p-4 space-y-6">
      {/* Filter Chips */}
      <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
        {['Hoje', 'Semana', 'Mês', 'Ano', 'Custom'].map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item.toLowerCase())}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
              filter === item.toLowerCase() 
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Volume de Ocorrências</h3>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-700">Disciplinares</span>
                <span className="text-orange-600">{disciplinaryCount}</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 rounded-full transition-all duration-1000" 
                  style={{ width: `${disciplinaryPercent}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-700">Pedagógicas</span>
                <span className="text-blue-600">{pedagogicalCount}</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
                  style={{ width: `${pedagogicalPercent}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
            <span className="text-sm font-bold text-slate-800">Total no Período</span>
            <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg font-black">{totalCount}</span>
          </div>
        </div>
      </div>

      {/* Quick Access Reports */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Relatórios Rápidos</h3>
        
        <button 
          className="w-full bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4 active:scale-[0.98] transition-all"
          onClick={onIndividualReportSearch}
        >
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <i className="fas fa-id-card-clip"></i>
          </div>
          <div className="flex-1 text-left">
            <h4 className="text-sm font-bold text-slate-800">Relatório Individual</h4>
            <p className="text-[10px] text-slate-500">Desempenho e comportamento por aluno</p>
          </div>
          <i className="fas fa-search text-slate-300"></i>
        </button>

        <button 
          className="w-full bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4 active:scale-[0.98] transition-all"
          onClick={handleExport}
        >
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <i className="fas fa-file-pdf"></i>
          </div>
          <div className="flex-1 text-left">
            <h4 className="text-sm font-bold text-slate-800">Resumo Comportamental Mensal</h4>
            <p className="text-[10px] text-slate-500">Visão geral de todas as turmas</p>
          </div>
          <i className="fas fa-download text-slate-300"></i>
        </button>

        <button 
          className="w-full bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4 active:scale-[0.98] transition-all"
          onClick={handleExport}
        >
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <i className="fas fa-star"></i>
          </div>
          <div className="flex-1 text-left">
            <h4 className="text-sm font-bold text-slate-800">Alunos em Destaque (IA)</h4>
            <p className="text-[10px] text-slate-500">Análise preditiva de comportamento</p>
          </div>
          <i className="fas fa-download text-slate-300"></i>
        </button>

        <button 
          className="w-full bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4 active:scale-[0.98] transition-all"
          onClick={handleExport}
        >
          <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
            <i className="fas fa-triangle-exclamation"></i>
          </div>
          <div className="flex-1 text-left">
            <h4 className="text-sm font-bold text-slate-800">Zonas de Risco Disciplinar</h4>
            <p className="text-[10px] text-slate-500">Casos críticos que exigem atenção</p>
          </div>
          <i className="fas fa-download text-slate-300"></i>
        </button>
      </div>

      {/* Footer Info */}
      <div className="bg-indigo-600 rounded-3xl p-6 text-white relative overflow-hidden shadow-lg shadow-indigo-200">
        <div className="relative z-10">
          <h4 className="font-bold mb-1">Dica de Gestão</h4>
          <p className="text-xs opacity-90 leading-relaxed">
            Relatórios semanais ajudam a identificar padrões de comportamento antes que se tornem problemas crônicos. Use a IA para analisar o histórico de cada aluno.
          </p>
        </div>
        <i className="fas fa-lightbulb absolute -bottom-4 -right-4 text-7xl opacity-10"></i>
      </div>

      {/* Loading Overlay for Export */}
      {generating && (
        <div className="fixed inset-0 z-[60] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="font-bold text-indigo-900">Compilando Dados...</p>
          <p className="text-xs text-slate-500 mt-1">Isso pode levar alguns segundos.</p>
        </div>
      )}
    </div>
  );
};

export default Reports;
