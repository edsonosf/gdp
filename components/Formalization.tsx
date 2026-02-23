import React, { useState } from 'react';
import { Student } from '../types';

interface FormalizationProps {
  student: Student;
  onBack: () => void;
}

const Formalization: React.FC<FormalizationProps> = ({ student, onBack }) => {
  const [notificadoResponsavel, setNotificadoResponsavel] = useState(false);
  const [cienteAluno, setCienteAluno] = useState(false);

  const canSave = notificadoResponsavel && cienteAluno;

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      {/* Header do Aluno */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-4">
        <img src={student.profileImage} className="w-12 h-12 rounded-full object-cover border-2 border-indigo-50" alt="" />
        <div>
          <h4 className="font-bold text-slate-800 text-sm">{student.name}</h4>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
            {student.grade} {student.classroom} - Sala {student.room}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-8">
        <div className="flex items-center space-x-3 border-b border-slate-50 pb-4">
          <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
            <i className="fas fa-file-signature text-sm"></i>
          </div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Formalização e Validação</h3>
        </div>

        <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 space-y-3 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-5">
            <i className="fas fa-shield-halved text-6xl text-indigo-900"></i>
          </div>
          <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest text-center">Termo de Ciência e Compromisso</h4>
          <p className="text-[11px] text-indigo-800 text-center leading-relaxed font-medium italic">
            O objetivo desta notificação é promover a reflexão e o alinhamento entre escola e família para o pleno desenvolvimento educacional do aluno, visando sempre o interesse superior da criança/adolescente.
          </p>
        </div>

        <div className="space-y-4 px-2">
          <label className="flex items-start space-x-3 cursor-pointer group p-3 rounded-2xl hover:bg-slate-50 transition-colors">
            <input 
              type="checkbox" 
              checked={notificadoResponsavel}
              onChange={(e) => setNotificadoResponsavel(e.target.checked)}
              className="mt-1 w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <span className="text-[11px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors leading-tight">
              O Responsável se considera oficialmente notificado, aceita as orientações pedagógicas e acata as medidas disciplinares tomadas.
            </span>
          </label>

          <label className="flex items-start space-x-3 cursor-pointer group p-3 rounded-2xl hover:bg-slate-50 transition-colors">
            <input 
              type="checkbox" 
              checked={cienteAluno}
              onChange={(e) => setCienteAluno(e.target.checked)}
              className="mt-1 w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <span className="text-[11px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors leading-tight">
              O aluno(a) declara estar ciente dos termos da ocorrência e compromete-se a observar o regimento escolar.
            </span>
          </label>
        </div>

        <button 
          onClick={onBack}
          disabled={!canSave}
          className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl transition-all flex items-center justify-center ${
            canSave 
              ? 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98]' 
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          <i className="fas fa-check-double mr-3"></i>
          Salvar e voltar
        </button>
      </div>
    </div>
  );
};

export default Formalization;