import React, { useState, useRef } from 'react';
import { Student } from '../types';

interface StudentDefenseProps {
  student: Student;
  onBack: () => void;
}

interface AttachedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  previewUrl: string;
}

const StudentDefense: React.FC<StudentDefenseProps> = ({ student, onBack }) => {
  const [defesaAluno, setDefesaAluno] = useState('');
  const [defenseFiles, setDefenseFiles] = useState<AttachedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // Fix: Added explicit File[] cast to fix unknown type errors on lines 28, 29, 30, 31
      const filesArray = Array.from(e.target.files) as File[];
      const newFiles = filesArray.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        size: file.size,
        previewUrl: URL.createObjectURL(file)
      }));
      setDefenseFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (id: string) => {
    setDefenseFiles(prev => prev.filter(f => f.id !== id));
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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

      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-50 pb-4">
          <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
            <i className="fas fa-comment-dots text-sm"></i>
          </div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Relato da Defesa</h3>
        </div>
        
        <textarea 
          value={defesaAluno}
          onChange={(e) => setDefesaAluno(e.target.value)}
          placeholder="Insira os argumentos e justificativas apresentados pelo aluno ou seu representante legal..."
          className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-amber-500 outline-none h-48 resize-none transition-all"
        ></textarea>

        <div className="space-y-3">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Anexos de Defesa</label>
          
          <div className="space-y-2">
            {defenseFiles.map(file => (
              <div key={file.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <i className={`fas ${file.type.includes('image') ? 'fa-file-image text-emerald-500' : 'fa-file-alt text-amber-500'} text-sm`}></i>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-700 truncate">{file.name}</p>
                    <p className="text-[8px] text-slate-400">{formatSize(file.size)}</p>
                  </div>
                </div>
                <button onClick={() => removeFile(file.id)} className="w-7 h-7 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                  <i className="fas fa-trash-alt text-[10px]"></i>
                </button>
              </div>
            ))}
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center justify-center hover:bg-slate-50 transition-all"
            >
              <i className="fas fa-paperclip mr-2"></i>
              Anexar Documento de Defesa
            </button>
            <input type="file" ref={fileInputRef} multiple onChange={handleFileChange} className="hidden" />
          </div>
        </div>

        <button 
          onClick={onBack}
          className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-slate-100 active:scale-95 transition-all"
        >
          Confirmar e Voltar à Análise
        </button>
      </div>
    </div>
  );
};

export default StudentDefense;
