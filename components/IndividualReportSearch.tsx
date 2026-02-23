
import React, { useState } from 'react';
import { Student } from '../types';
import { DEFAULT_STUDENT_IMAGE } from '../constants';

interface IndividualReportSearchProps {
  students: Student[];
  onSelectStudent: (student: Student) => void;
}

const IndividualReportSearch: React.FC<IndividualReportSearchProps> = ({ students, onSelectStudent }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [generating, setGenerating] = useState(false);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.grade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (student: Student) => {
    setGenerating(true);
    // Simula geração de relatório
    setTimeout(() => {
      setGenerating(false);
      onSelectStudent(student);
    }, 1200);
  };

  return (
    <div className="p-4 space-y-6 animate-fade-in min-h-full">
      <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
        <p className="text-xs text-blue-800 font-medium leading-relaxed">
          <i className="fas fa-info-circle mr-2"></i>
          Selecione um aluno abaixo para gerar o relatório consolidado de comportamento e desempenho pedagógico.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
          <i className="fas fa-search"></i>
        </span>
        <input 
          type="text" 
          placeholder="Pesquisar por nome ou turma..." 
          className="w-full pl-11 pr-4 py-4 border border-slate-200 rounded-2xl bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
      </div>

      {/* Students List */}
      <div className="space-y-3 pb-20">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
          Alunos Encontrados ({filteredStudents.length})
        </h3>
        
        {filteredStudents.length > 0 ? (
          filteredStudents.map(student => (
            <button 
              key={student.id} 
              onClick={() => handleSelect(student)} 
              className="w-full bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex items-center space-x-4 hover:border-blue-300 transition-all active:scale-[0.98] text-left group"
            >
              <div className="relative">
                <img 
                  src={student.profileImage || DEFAULT_STUDENT_IMAGE} 
                  alt={student.name} 
                  className="w-14 h-14 rounded-full object-cover border-2 border-slate-50 group-hover:border-blue-100 transition-colors" 
                />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{student.name}</h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mt-0.5">
                  {student.grade} • {student.classroom}
                </p>
                <div className="flex items-center mt-2 text-[9px] text-slate-400 font-bold uppercase">
                  <i className="fas fa-calendar-day mr-1 opacity-60"></i>
                  <span>Idade: {student.age || '--'} Anos</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <i className="fas fa-file-invoice text-sm"></i>
              </div>
            </button>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-100">
            <i className="fas fa-user-slash text-4xl text-slate-100 mb-4"></i>
            <h4 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Nenhum aluno encontrado</h4>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {generating && (
        <div className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-blue-600">
              <i className="fas fa-id-card-clip text-xl animate-pulse"></i>
            </div>
          </div>
          <p className="mt-6 font-black text-blue-900 uppercase tracking-widest text-sm">Gerando Relatório...</p>
          <p className="text-[10px] text-slate-500 mt-2 font-bold animate-pulse">Cruzando dados disciplinares e pedagógicos</p>
        </div>
      )}
    </div>
  );
};

export default IndividualReportSearch;
