import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Student, Occurrence, ViewState } from '../types';
import { DEFAULT_STUDENT_IMAGE } from '../constants';

interface PendingOccurrencesProps {
  students: Student[];
  occurrences: Occurrence[];
  onSelectStudent: (student: Student) => void;
  onNavigate: (view: ViewState, student: Student) => void;
  initialAnalyzingStudent?: Student | null;
  onStartAnalysis?: (student: Student | null) => void;
}

// Define interface for students with additional metadata for this view
interface StudentWithMeta extends Student {
  occurrenceCount: number;
  lastOccurrence: Occurrence;
}

interface AttachedFile {
  id: string;
  file: File;
  previewUrl: string;
}

const PendingOccurrences: React.FC<PendingOccurrencesProps> = ({ 
  students, 
  occurrences, 
  onSelectStudent, 
  onNavigate,
  initialAnalyzingStudent,
  onStartAnalysis
}) => {
  const [analyzingStudent, setAnalyzingStudent] = useState<StudentWithMeta | null>(null);
  const [analysisType, setAnalysisType] = useState('Grupo Gestor');
  const [mediationDate, setMediationDate] = useState(new Date().toISOString().slice(0, 16));
  const [disciplinaryMeasure, setDisciplinaryMeasure] = useState('');
  const [externalProtocol, setExternalProtocol] = useState('');
  const [deliberations, setDeliberations] = useState('');
  const [contactType, setContactType] = useState('');
  
  const [contactDateTime, setContactDateTime] = useState(new Date().toISOString().slice(0, 16));
  const [tookNotice, setTookNotice] = useState<string | null>(null);
  const [contactAttempts, setContactAttempts] = useState('');
  
  const [documents, setDocuments] = useState<AttachedFile[]>([]);
  const [videos, setVideos] = useState<AttachedFile[]>([]);
  
  const docInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const studentsWithOccurrences: StudentWithMeta[] = useMemo(() => {
    return students.filter(student => 
      occurrences.some(occ => occ.studentId === student.id)
    ).map(student => {
      const studentOccs = occurrences.filter(occ => occ.studentId === student.id);
      return {
        ...student,
        occurrenceCount: studentOccs.length,
        lastOccurrence: studentOccs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
      };
    }).sort((a, b) => b.occurrenceCount - a.occurrenceCount);
  }, [students, occurrences]);

  // Sincroniza o estado de análise com o aluno selecionado no App.tsx
  useEffect(() => {
    if (initialAnalyzingStudent) {
      const found = studentsWithOccurrences.find(s => s.id === initialAnalyzingStudent.id);
      if (found) {
        setAnalyzingStudent(found);
      }
    }
  }, [initialAnalyzingStudent, studentsWithOccurrences]);

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // Fix: Added explicit File[] cast to fix unknown type errors on lines 92
      const filesArray = Array.from(e.target.files) as File[];
      const remainingSlots = 4 - documents.length;
      
      if (remainingSlots <= 0) {
        alert("Limite de 4 documentos atingido.");
        return;
      }

      const filesToAdd = filesArray.slice(0, remainingSlots);
      if (filesArray.length > remainingSlots) {
        alert(`Apenas ${remainingSlots} arquivo(s) foram adicionados devido ao limite total de 4.`);
      }

      const newFiles = filesToAdd.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file: file,
        previewUrl: URL.createObjectURL(file)
      }));
      setDocuments(prev => [...prev, ...newFiles]);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // Fix: Added explicit File[] cast to fix unknown type errors on lines 110, 111, 116, 117
      const filesArray = Array.from(e.target.files) as File[];
      const maxSize = 400 * 1024 * 1024; // 400MB
      
      const validFiles: AttachedFile[] = [];
      
      for (const file of filesArray) {
        if (videos.length + validFiles.length >= 2) {
          alert("Limite de 2 vídeos atingido.");
          break;
        }
        if (file.size > maxSize) {
          alert(`O vídeo ${file.name} excede o limite de 400MB.`);
          continue;
        }
        validFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          file: file,
          previewUrl: URL.createObjectURL(file)
        });
      }
      setVideos(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (id: string, type: 'doc' | 'video') => {
    if (type === 'doc') {
      setDocuments(prev => prev.filter(f => f.id !== id));
    } else {
      setVideos(prev => prev.filter(f => f.id !== id));
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const pautaStudents = studentsWithOccurrences.filter(s => s.id !== analyzingStudent?.id);

  return (
    <div className="p-4 space-y-6">
      <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
        <p className="text-xs text-indigo-800 font-medium leading-relaxed">
          <i className="fas fa-circle-info mr-2"></i>
          Esta tela lista alunos que possuem registros disciplinares ou pedagógicos ativos que necessitam de acompanhamento da coordenação.
        </p>
      </div>

      {/* BLOCO: Alunos em Pauta */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
          Alunos em Pauta ({pautaStudents.length})
        </h3>
        
        {pautaStudents.length > 0 ? (
          pautaStudents.map(student => (
            <button 
              key={student.id} 
              onClick={() => onSelectStudent(student)} 
              className="w-full bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-4 hover:border-indigo-300 transition-all active:scale-[0.98] text-left"
            >
              <div className="relative">
                <img src={student.profileImage || DEFAULT_STUDENT_IMAGE} alt={student.name} className="w-14 h-14 rounded-full object-cover border-2 border-indigo-50" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm">
                  {student.occurrenceCount}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-0.5">
                  <h3 className="font-bold text-slate-800 text-sm">{student.name}</h3>
                  <span 
                    onClick={(e) => {
                      e.stopPropagation();
                      setAnalyzingStudent(student);
                      if (onStartAnalysis) onStartAnalysis(student);
                      // Scroll suave até o formulário que agora está abaixo
                      setTimeout(() => {
                        const formElement = document.getElementById('analysis-form');
                        formElement?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }}
                    className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer"
                  >
                    Analisar
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-bold">
                  {student.grade} {student.classroom} - Sala {student.room || 'N/A'} - {student.turn}
                </p>
                <p className="text-[10px] text-slate-400 font-medium">Idade: {student.age || '--'} Anos</p>
                <div className="mt-1 space-y-0.5">
                  <p className="text-[10px] text-slate-500 font-medium"><span className="font-bold">Responsável:</span> {student.responsibleName}</p>
                  <p className="text-[10px] text-slate-500 font-medium"><span className="font-bold">Celular:</span> {student.contactPhone}</p>
                  <p className="text-[10px] text-slate-500 font-medium"><span className="font-bold">Celular de Recados:</span> {student.backupPhone || 'N/A'}</p>
                </div>
                <div className="mt-2 flex items-center text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                  <span className="bg-slate-100 px-2 py-0.5 rounded mr-2">Última: {new Date(student.lastOccurrence.date).toLocaleDateString('pt-BR')}</span>
                  <span className={student.lastOccurrence.type === 'Disciplinar' ? 'text-orange-600' : 'text-blue-600'}>
                    {student.lastOccurrence.type}
                  </span>
                </div>
              </div>
              <i className="fas fa-chevron-right text-slate-300"></i>
            </button>
          ))
        ) : (
          <div className="text-center py-10 bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-check-double text-xl"></i>
            </div>
            <h3 className="text-slate-800 font-bold text-sm">Tudo em ordem!</h3>
            <p className="text-slate-400 text-[10px] px-10">Nenhum aluno {analyzingStudent ? 'adicional' : ''} com ocorrências na pauta.</p>
          </div>
        )}
      </div>

      {/* Container Principal da Análise */}
      <div id="analysis-form" className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-6 pb-24">
        
        {/* BLOCO: Ocorrência em Analise */}
        {analyzingStudent && (
          <div className="space-y-4 animate-fade-in p-1 border-b border-slate-100 pb-6">
            <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">Ocorrência em Analise</h3>
            
            {/* Card Principal do Aluno - Reduzido arredondamento conforme pedido */}
            <div className="flex items-center space-x-4 p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100 transition-all">
              <div className="relative">
                <img 
                  src={analyzingStudent.profileImage || DEFAULT_STUDENT_IMAGE} 
                  alt={analyzingStudent.name} 
                  className="w-16 h-16 rounded-full object-cover border-2 border-white/30"
                />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-indigo-600">
                  {analyzingStudent.occurrenceCount}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-base truncate">{analyzingStudent.name}</h4>
                <p className="text-[10px] text-indigo-100 font-bold opacity-90">
                  {analyzingStudent.grade} {analyzingStudent.classroom} - Sala {analyzingStudent.room || 'N/A'} - {analyzingStudent.turn}
                </p>
              </div>
              {/* Botão de remover da análise reduzido de w-10 h-10 para w-8 h-8 */}
              <button 
                onClick={() => {
                  setAnalyzingStudent(null);
                  if (onStartAnalysis) onStartAnalysis(null);
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors flex-shrink-0"
                title="Remover da análise"
              >
                <i className="fas fa-times text-sm"></i>
              </button>
            </div>

            {/* Sub-grupo: Notificações Realizadas */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center border-b border-slate-200 pb-2">
                <i className="fas fa-bell mr-2 text-indigo-500"></i>
                Notificações Realizadas
              </h4>
              
              <div className="space-y-2 text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-100">
                <p><span className="font-bold text-slate-500">Nome do Responsável:</span> {analyzingStudent.responsibleName}</p>
                <div className="space-y-1">
                  <p><span className="font-bold text-slate-500">Celular:</span> {analyzingStudent.contactPhone}</p>
                  <p><span className="font-bold text-slate-500">Celular de Recados:</span> {analyzingStudent.backupPhone || 'N/A'}</p>
                </div>
                <p><span className="font-bold text-slate-500">Telefone:</span> {analyzingStudent.landline || 'N/A'}</p>
                <p><span className="font-bold text-slate-500">E-mail:</span> {analyzingStudent.email}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 ml-1">Tipo de Contato/Notificação Realizada</label>
                  <div className="relative">
                    <select 
                      value={contactType}
                      onChange={(e) => setContactType(e.target.value)}
                      className="w-full p-3 pl-10 border border-slate-200 rounded-xl bg-white text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none transition-all"
                    >
                      <option value="">Selecione o tipo de contato...</option>
                      <option value="Contato via Numero de Celular">Contato via Numero de Celular</option>
                      <option value="Contato via Celular para Recados">Contato via Celular para Recados</option>
                      <option value="Comunicação Direta">Comunicação Direta</option>
                      <option value="Comunicação Formal Escrita">Comunicação Formal Escrita</option>
                      <option value="Comunicação Digital (E-mail)">Comunicação Digital (E-mail)</option>
                      <option value="Comunicação Digital (App de Mensagens)">Comunicação Digital (App de Mensagens)</option>
                      <option value="Contato Telefônico Fixo">Contato Telefônico Fixo</option>
                    </select>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none">
                      <i className="fas fa-headset text-sm"></i>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 ml-1">Data e Hora do Contato</label>
                  <div className="relative">
                    <input 
                      type="datetime-local" 
                      value={contactDateTime}
                      onChange={(e) => setContactDateTime(e.target.value)}
                      className="w-full p-3 pl-10 border border-slate-200 rounded-xl bg-white text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none">
                      <i className="fas fa-calendar-alt text-sm"></i>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-100">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-3 ml-1">O Responsável tomou ciência da ocorrência?</label>
                  <div className="flex space-x-6">
                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="tookNotice" 
                        value="sim" 
                        checked={tookNotice === 'sim'} 
                        onChange={(e) => setTookNotice(e.target.value)}
                        className="w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-bold text-slate-600 group-hover:text-indigo-600">Sim</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="tookNotice" 
                        value="nao" 
                        checked={tookNotice === 'nao'} 
                        onChange={(e) => setTookNotice(e.target.value)}
                        className="w-5 h-5 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-sm font-bold text-slate-600 group-hover:text-red-600">Não</span>
                    </label>
                  </div>
                </div>

                {tookNotice === 'nao' && (
                  <div className="animate-fade-in">
                    <label className="block text-[10px] font-bold text-red-500 uppercase mb-2 ml-1">Descreva as tentativas de contato</label>
                    <textarea 
                      value={contactAttempts}
                      onChange={(e) => setContactAttempts(e.target.value)}
                      placeholder="Relate detalhadamente as tentativas de contato frustradas..."
                      className="w-full p-3 border border-red-200 rounded-xl bg-red-50/30 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-red-500 outline-none h-20 resize-none transition-all"
                    ></textarea>
                  </div>
                )}
              </div>

              {/* LINK: Defesa do Aluno */}
              <div className="pt-2">
                <button 
                  onClick={() => onNavigate('STUDENT_DEFENSE', analyzingStudent)}
                  className="w-full py-3 px-4 bg-white border border-slate-200 rounded-xl text-[11px] font-black uppercase tracking-widest text-indigo-600 flex items-center justify-between hover:bg-indigo-50 transition-all shadow-sm"
                >
                  <div className="flex items-center">
                    <i className="fas fa-comment-dots mr-2 text-indigo-500"></i>
                    Defesa do Aluno
                  </div>
                  <i className="fas fa-chevron-right text-[10px] opacity-40"></i>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BLOCO: Equipe Responsável */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
              Equipe Responsável
            </label>
            <div className="relative">
              <select 
                value={analysisType}
                onChange={(e) => setAnalysisType(e.target.value)}
                className="w-full p-3 pl-10 border border-slate-200 rounded-xl bg-slate-50 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none transition-all"
              >
                <option value="Grupo Gestor">Grupo Gestor</option>
                <option value="Colegiado">Colegiado</option>
                <option value="Conselho de Classe">Conselho de Classe</option>
              </select>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none">
                <i className="fas fa-users-viewfinder text-sm"></i>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
              Data e Hora da Mediação
            </label>
            <div className="relative">
              <input 
                type="datetime-local" 
                value={mediationDate}
                onChange={(e) => setMediationDate(e.target.value)}
                className="w-full p-3 pl-10 border border-slate-200 rounded-xl bg-slate-50 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none">
                <i className="fas fa-calendar-check text-sm"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Bloco: Medidas Educativas e Punitivas */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center space-x-2 pb-1">
            <i className="fas fa-scale-balanced text-indigo-600 text-sm"></i>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-tighter">Medidas Educativas e Punitivas</h4>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-2 ml-1">Selecione uma medida</label>
              <div className="relative">
                <select 
                  value={disciplinaryMeasure}
                  onChange={(e) => setDisciplinaryMeasure(e.target.value)}
                  className="w-full p-3 pl-10 border border-slate-200 rounded-xl bg-slate-50 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none transition-all"
                >
                  <option value="">Selecione uma medida...</option>
                  <option value="Advertência Verbal">Advertência Verbal (Abordagem pedagógica)</option>
                  <option value="Advertência Escrita">Advertência Escrita (Registro formal da ocorrência)</option>
                  <option value="Suspensão">Suspensão (Afastamento temporário)</option>
                  <option value="Transferência Compulsória">Transferência Compulsória</option>
                  <option value="Desligamento">Desligamento</option>
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <i className="fas fa-hand-point-right text-sm"></i>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-2 ml-1">Protocolos Jurídicos e Externos</label>
              <div className="relative">
                <select 
                  value={externalProtocol}
                  onChange={(e) => setExternalProtocol(e.target.value)}
                  className="w-full p-3 pl-10 border border-slate-200 rounded-xl bg-slate-50 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none transition-all"
                >
                  <option value="">Nenhum protocolo externo...</option>
                  <option value="Secretaria Municipal de Educação (SEDUC Maracanaú)">Secretaria Municipal de Educação (SEDUC Maracanaú)</option>
                  <option value="Conselho Tutelar">Conselho Tutelar</option>
                  <option value="Boletim de Ocorrência (BO)">Boletim de Ocorrência (BO)</option>
                  <option value="Termo Circunstanciado de Ocorrência (TCO)">Termo Circunstanciado de Ocorrência (TCO)</option>
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <i className="fas fa-file-contract text-sm"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bloco: Anexos */}
        <div className="space-y-4 pt-2 border-t border-slate-50">
          <div className="flex items-center space-x-2 pb-1">
            <i className="fas fa-paperclip text-indigo-600 text-sm"></i>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-tighter">Anexos</h4>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">
                  Anexo de Documentos (PDF, Imagens, Planilhas, Textos)
                </label>
                <span className={`text-[9px] font-black ${documents.length >= 4 ? 'text-red-500' : 'text-indigo-500'}`}>
                  {documents.length}/4
                </span>
              </div>
              <div 
                onClick={() => documents.length < 4 && docInputRef.current?.click()}
                className={`w-full p-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all ${
                  documents.length >= 4 
                  ? 'bg-slate-50 border-slate-100 cursor-not-allowed opacity-50' 
                  : 'bg-slate-50 border-slate-200 cursor-pointer hover:bg-indigo-50 hover:border-indigo-200'
                }`}
              >
                <i className="fas fa-file-arrow-up text-2xl text-slate-300 mb-2"></i>
                <span className="text-xs font-bold text-slate-500">
                  {documents.length >= 4 ? 'Limite de 4 arquivos atingido' : 'Clique para anexar até 4 documentos'}
                </span>
                <input 
                  type="file" 
                  ref={docInputRef} 
                  multiple 
                  onChange={handleDocumentChange}
                  className="hidden" 
                  accept=".pdf,image/*,.xlsx,.xls,.csv,.txt,.doc,.docx"
                  disabled={documents.length >= 4}
                />
              </div>
              
              {documents.length > 0 && (
                <div className="mt-3 space-y-2">
                  {documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-2 bg-white border border-slate-100 rounded-lg shadow-sm">
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <i className={`fas ${doc.file.type.includes('image') ? 'fa-file-image text-emerald-500' : 'fa-file-pdf text-red-500'} text-lg`}></i>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-slate-700 truncate">{doc.file.name}</p>
                          <p className="text-[9px] text-slate-400">{formatSize(doc.file.size)}</p>
                        </div>
                      </div>
                      <button onClick={() => removeFile(doc.id, 'doc')} className="w-7 h-7 bg-red-50 text-red-600 rounded-full flex items-center justify-center hover:bg-red-100 transition-all">
                        <i className="fas fa-trash text-[10px]"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">
                  Anexo de Vídeos (Máx. 400MB)
                </label>
                <span className={`text-[9px] font-black ${videos.length >= 2 ? 'text-red-500' : 'text-indigo-500'}`}>
                  {videos.length}/2
                </span>
              </div>
              <div 
                onClick={() => videos.length < 2 && videoInputRef.current?.click()}
                className={`w-full p-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all ${
                  videos.length >= 2 
                  ? 'bg-slate-50 border-slate-100 cursor-not-allowed opacity-50' 
                  : 'bg-slate-50 border-slate-200 cursor-pointer hover:bg-blue-50 hover:border-blue-200'
                }`}
              >
                <i className="fas fa-video text-2xl text-slate-300 mb-2"></i>
                <span className="text-xs font-bold text-slate-500">
                  {videos.length >= 2 ? 'Limite de vídeos atingido' : 'Clique para anexar até 2 vídeos'}
                </span>
                <input 
                  type="file" 
                  ref={videoInputRef} 
                  multiple 
                  onChange={handleVideoChange}
                  className="hidden" 
                  accept="video/*"
                  disabled={videos.length >= 2}
                />
              </div>

              {videos.length > 0 && (
                <div className="mt-3 space-y-2">
                  {videos.map(vid => (
                    <div key={vid.id} className="flex items-center justify-between p-2 bg-white border border-slate-100 rounded-lg shadow-sm">
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <i className="fas fa-film text-lg text-blue-500"></i>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-slate-700 truncate">{vid.file.name}</p>
                          <p className="text-[9px] text-slate-400">{formatSize(vid.file.size)}</p>
                        </div>
                      </div>
                      <button onClick={() => removeFile(vid.id, 'video')} className="w-7 h-7 bg-red-50 text-red-600 rounded-full flex items-center justify-center hover:bg-red-100 transition-all">
                        <i className="fas fa-trash text-[10px]"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
            Deliberações Tomadas
          </label>
          <textarea 
            value={deliberations}
            onChange={(e) => setDeliberations(e.target.value)}
            placeholder="Descreva as decisões tomadas pela equipe..."
            className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none transition-all"
          ></textarea>
        </div>

        {/* LINK: Formalização e Validação */}
        <div className="pt-2">
          <button 
            disabled={!analyzingStudent}
            onClick={() => analyzingStudent && onNavigate('FORMALIZATION', analyzingStudent)}
            className={`w-full py-3 px-4 border rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-between transition-all ${
              analyzingStudent 
                ? 'bg-white border-emerald-200 text-emerald-600 hover:bg-emerald-50' 
                : 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed opacity-50'
            }`}
          >
            <div className="flex items-center">
              <i className="fas fa-file-signature mr-2"></i>
              Formalização e Validação
            </div>
            <i className="fas fa-chevron-right text-[10px]"></i>
          </button>
        </div>
        
        <button 
          disabled={!analyzingStudent}
          onClick={() => {
            if (!analyzingStudent) {
              alert("Por favor, selecione um aluno para analisar na lista acima.");
              return;
            }
            alert(`Análise de ${analyzingStudent.name} salva com sucesso no sistema administrativo!`);
            setAnalyzingStudent(null);
            if (onStartAnalysis) onStartAnalysis(null);
            setDeliberations('');
            setDisciplinaryMeasure('');
            setExternalProtocol('');
            setContactType('');
            setContactDateTime(new Date().toISOString().slice(0, 16));
            setTookNotice(null);
            setContactAttempts('');
            setDocuments([]);
            setVideos([]);
          }}
          className={`w-full py-4 rounded-2xl font-black transition-all uppercase tracking-widest text-xs shadow-lg ${
            analyzingStudent 
              ? 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98]' 
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          <i className="fas fa-save mr-2"></i> Finalizar e Salvar Análise
        </button>
      </div>
    </div>
  );
};

export default PendingOccurrences;
