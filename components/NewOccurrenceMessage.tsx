import React from 'react';
import { Occurrence, Student } from '../types';
import { DEFAULT_STUDENT_IMAGE } from '../constants';

interface NewOccurrenceMessageProps {
  occurrence: Occurrence | null;
  student: Student | null;
  occurrences: Occurrence[];
  onBack: () => void;
}

const NewOccurrenceMessage: React.FC<NewOccurrenceMessageProps> = ({ occurrence, student, occurrences, onBack }) => {
  if (!occurrence || !student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full p-6 text-center text-slate-700">
        <div className="w-20 h-20 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mb-4">
          <i className="fas fa-envelope-open text-3xl"></i>
        </div>
        <h2 className="text-lg font-bold text-slate-800">Nenhuma notificação</h2>
        <p className="text-sm text-slate-500 mt-2">Você não possui novas mensagens ou ocorrências registradas recentemente.</p>
        <button 
          onClick={onBack}
          className="mt-8 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg"
        >
          Voltar ao início
        </button>
      </div>
    );
  }

  const studentOccurrenceCount = occurrences.filter(occ => occ.studentId === student.id).length;
  const isRecidivist = studentOccurrenceCount > 1;

  return (
    <div key={occurrence.id} className="p-4 space-y-6 animate-fade-in text-slate-700">
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0">
          <div className="bg-indigo-600 w-24 h-8 rotate-45 translate-x-8 -translate-y-2 shadow-sm"></div>
        </div>

        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <img 
              src={student.profileImage || DEFAULT_STUDENT_IMAGE} 
              alt={student.name} 
              className="w-24 h-24 rounded-full object-cover border-4 border-indigo-50 shadow-md"
            />
            <span className={`absolute bottom-1 right-1 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center ${occurrence.type === 'Disciplinar' ? 'bg-orange-500' : 'bg-blue-500'}`}>
              <i className={`fas ${occurrence.type === 'Disciplinar' ? 'fa-gavel' : 'fa-book-reader'} text-[8px] text-white`}></i>
            </span>
          </div>

          <div>
            <h2 className="text-xl font-black text-slate-800 leading-tight">{student.name}</h2>
            <p className="text-[11px] font-bold text-slate-400 mt-1">
              {student.grade} {student.classroom} - Sala {student.room || 'N/A'} - {student.turn}
            </p>
            
            <div className="mt-4 flex flex-col items-center space-y-1">
              <span className="text-[10px] font-black text-slate-400">Detalhes da ocorrência</span>
              <span className="text-xs font-bold text-slate-600">
                {new Date(occurrence.date).toLocaleDateString('pt-BR')} às {new Date(occurrence.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
              
              {isRecidivist && (
                <div className="mt-6 flex items-center bg-red-50 px-4 py-2.5 rounded-2xl border border-red-200 animate-pulse shadow-sm">
                  <div className="text-[13px] font-black text-red-700 flex items-center">
                    <span className="mr-1">Aluno com</span>
                    <span className="mx-1 bg-white px-2 py-0.5 rounded-lg shadow-sm text-red-600 border border-red-100 font-black">
                      [ {studentOccurrenceCount} ]
                    </span>
                    <span className="ml-1">reincidências.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 justify-center">
              {occurrence.titles.map((title, i) => (
                <span key={i} className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-3 py-1 rounded-full border border-indigo-100">
                  {title}
                </span>
              ))}
            </div>

            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
              <p className="text-sm text-slate-700 leading-relaxed italic">
                "{occurrence.description}"
              </p>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-50">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-500">
                <i className="fas fa-user-edit text-xs"></i>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400">Relatado por</span>
                <span className="text-xs font-bold text-slate-700">{occurrence.reporterName}</span>
              </div>
            </div>

            <div className={`text-[10px] font-black px-3 py-1 rounded-lg ${
              occurrence.severity === 'Alta' || occurrence.severity === 'Crítica' ? 'bg-red-50 text-red-600 border border-red-100' :
              occurrence.severity === 'Média' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-green-50 text-green-600 border border-green-100'
            }`}>
              {occurrence.severity || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 p-5 rounded-[2rem] border border-indigo-100 flex items-start space-x-4">
        <div className="w-10 h-10 bg-white text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
          <i className="fas fa-circle-info text-lg"></i>
        </div>
        <p className="text-xs text-indigo-800 leading-relaxed font-medium">
          {isRecidivist 
            ? `Este aluno possui um histórico acumulado de ${studentOccurrenceCount} ocorrências. O acompanhamento pedagógico intensivo é recomendado para evitar a progressão da gravidade das condutas.`
            : "Esta é a ocorrência mais recente registrada no sistema para este aluno. Utilize a tela de monitoramento para ver o histórico completo."
          }
        </p>
      </div>
      
      <button 
        onClick={onBack}
        className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black shadow-lg shadow-slate-100 active:scale-95 transition-all text-xs"
      >
        <i className="fas fa-check mr-2"></i> Ciente
      </button>
    </div>
  );
};

export default NewOccurrenceMessage;