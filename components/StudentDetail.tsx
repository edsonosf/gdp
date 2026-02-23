import React, { useState } from 'react';
import { Student, Occurrence, Severity } from '../types';
import { analyzeStudentBehavior } from '../services/geminiService';
import { DEFAULT_STUDENT_IMAGE } from '../constants';

interface StudentDetailProps {
  student: Student;
  occurrences: Occurrence[];
}

interface AttachedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  previewUrl: string;
}

const StudentDetail: React.FC<StudentDetailProps> = ({ student, occurrences }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  // Estados de visualização (Simulando dados que viriam do banco/telas de Defesa e Formalização)
  const [medidaAplicada] = useState('Advertência Escrita');
  const [baseRegimental] = useState('Artigo 42, Inciso II do Regimento Escolar Municipal - Descumprimento das normas de convivência e fardamento.');
  const [obsPedagogicas] = useState('Realizado acolhimento individual com a coordenação e encaminhamento para o serviço de psicologia escolar para acompanhamento da regulação emocional.');
  
  // Dados da tela "Defesa do Aluno"
  const [defesaAluno] = useState('O aluno relatou que o incidente ocorreu após uma provocação prévia, mas reconhece que sua reação foi desproporcional e comprometeu-se a utilizar os canais de mediação da escola na próxima vez.');
  const [defenseFiles] = useState<AttachedFile[]>([
    { id: '1', name: 'relato_manuscrito_aluno.pdf', type: 'application/pdf', size: 1024 * 450, previewUrl: '' },
    { id: '2', name: 'foto_evidencia_01.jpg', type: 'image/jpeg', size: 1024 * 850, previewUrl: '' }
  ]);

  // Dados da tela "Formalização e Validação"
  const [notificadoResponsavel] = useState(true); 
  const [cienteAluno] = useState(true);          

  const studentOccurrences = [...occurrences]
    .filter(occ => occ.studentId === student.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleAiAnalysis = async () => {
    if (studentOccurrences.length === 0) {
        alert("O aluno não possui ocorrências para analisar.");
        return;
    }
    setAnalyzing(true);
    const result = await analyzeStudentBehavior(student, studentOccurrences);
    setAiAnalysis(result);
    setAnalyzing(false);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const hasDefenseData = defesaAluno.trim().length > 0 || defenseFiles.length > 0;
  const isFormalized = notificadoResponsavel && cienteAluno;

  return (
    <div className="p-4 space-y-6 pb-32 text-slate-700">
      {/* Student Profile Header */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
        <div className="relative mb-4">
            <img 
                src={student.profileImage || DEFAULT_STUDENT_IMAGE} 
                alt={student.name} 
                className="w-24 h-24 rounded-full object-cover border-4 border-indigo-50 shadow-md"
            />
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 rounded-full border-4 border-white flex items-center justify-center text-white text-xs">
                <i className="fas fa-camera"></i>
            </div>
        </div>
        <h2 className="text-xl font-bold text-slate-800">{student.name}</h2>
        {student.socialName && <p className="text-sm font-medium text-indigo-600 mb-1">Nome Social: {student.socialName}</p>}
        <p className="text-slate-500 font-medium text-xs">
          {student.grade} {student.classroom} - Sala {student.room || 'N/A'} - {student.turn}
        </p>
        
        <div className="grid grid-cols-2 gap-3 mt-6 w-full">
            <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
                <span className="block text-[10px] text-red-600 font-bold mb-1 uppercase tracking-wider">Ocorrências</span>
                <span className="text-lg font-black text-red-700">{studentOccurrences.length}</span>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <span className="block text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-wider">Idade</span>
                <span className="text-lg font-black text-slate-700">{student.age || 'N/A'} anos</span>
            </div>
        </div>
      </div>

      {/* Student Info Details */}
      <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-50 pb-4">
          <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
            <i className="fas fa-info-circle text-sm"></i>
          </div>
          <h3 className="text-sm font-black text-slate-800">Informações do Aluno</h3>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-wider">Data de Nascimento</label>
              <p className="text-sm font-bold text-slate-700">{student.birthDate}</p>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-wider">E-mail</label>
              <p className="text-sm font-bold text-slate-700 truncate">{student.email}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-50">
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-wider">Responsável</label>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-sm font-bold text-slate-800 mb-1">{student.responsibleName}</p>
              <p className="text-xs font-medium text-slate-500 mb-3">{student.relationship === 'Outro Vínculo' ? student.otherRelationship : student.relationship}</p>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-slate-600">
                  <i className="fab fa-whatsapp text-emerald-500 w-4"></i>
                  <span className="text-xs font-bold">{student.contactPhone}</span>
                </div>
                {student.backupPhone && (
                  <div className="flex items-center space-x-2 text-slate-600">
                    <i className="fas fa-phone-alt text-slate-400 w-4"></i>
                    <span className="text-xs font-medium">Recados: {student.backupPhone}</span>
                  </div>
                )}
                {student.landline && (
                  <div className="flex items-center space-x-2 text-slate-600">
                    <i className="fas fa-phone-office text-slate-400 w-4"></i>
                    <span className="text-xs font-medium">Fixo: {student.landline}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {student.isAEE && (
            <div className="pt-4 border-t border-slate-50">
              <div className="flex items-center space-x-2 mb-3">
                <i className="fas fa-universal-access text-blue-600"></i>
                <label className="block text-[10px] font-black text-blue-800 uppercase tracking-wider">Atendimento Especializado (AEE)</label>
              </div>
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase">Situação:</span>
                  <p className="text-sm font-bold text-blue-900">{student.pcdStatus === 'com_laudo' ? 'Com Laudo' : 'Sob Investigação'}</p>
                </div>
                {student.cid && (
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase">CID:</span>
                    <p className="text-xs font-medium text-blue-800">{student.cid}</p>
                  </div>
                )}
                {student.investigationDescription && (
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase">Descrição:</span>
                    <p className="text-xs font-medium text-blue-800">{student.investigationDescription}</p>
                  </div>
                )}
                {student.schoolNeed && student.schoolNeed.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase">Necessidades:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {student.schoolNeed.map(n => (
                        <span key={n} className="bg-white px-2 py-0.5 rounded-full text-[9px] font-bold text-blue-700 border border-blue-200">
                          {n === 'estrutura_fisica' ? 'Estrutura Física' : n === 'adaptacao_curricular' ? 'Adaptação Curricular' : 'Atendimento Especializado'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {student.observations && (
            <div className="pt-4 border-t border-slate-50">
              <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-wider">Observações</label>
              <p className="text-xs font-medium text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">{student.observations}</p>
            </div>
          )}
        </div>
      </section>

      {/* AI Analysis Button */}
      <section>
        <button 
            onClick={handleAiAnalysis}
            disabled={analyzing}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-center space-x-2 active:scale-95 transition-all"
        >
            {analyzing ? (
                <>
                    <i className="fas fa-wand-magic-sparkles animate-pulse"></i>
                    <span className="font-semibold text-sm">Analisando comportamento...</span>
                </>
            ) : (
                <>
                    <i className="fas fa-brain"></i>
                    <span className="font-semibold text-sm">Pedagogical Insight (IA)</span>
                </>
            )}
        </button>

        {aiAnalysis && (
            <div className="mt-4 bg-indigo-50 border border-indigo-100 p-5 rounded-3xl relative overflow-hidden">
                <div className="absolute -top-2 -right-2 opacity-10">
                    <i className="fas fa-brain text-6xl text-indigo-900"></i>
                </div>
                <h3 className="text-indigo-900 font-bold mb-2 flex items-center">
                    <i className="fas fa-sparkles mr-2 text-indigo-500"></i>
                    Sugestão da IA
                </h3>
                <div className="text-indigo-800 text-sm leading-relaxed whitespace-pre-wrap italic">
                    {aiAnalysis}
                </div>
                <button 
                    onClick={() => setAiAnalysis(null)}
                    className="mt-4 text-[10px] text-indigo-600 font-bold"
                >
                    Fechar análise
                </button>
            </div>
        )}
      </section>

      {/* History List */}
      <section>
        <h3 className="text-[10px] font-black text-slate-400 mb-3 px-1">Histórico de ocorrências</h3>
        <div className="space-y-4">
          {studentOccurrences.length > 0 ? (
            studentOccurrences.map(occ => (
              <div key={occ.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${occ.type === 'Disciplinar' ? 'bg-orange-500' : 'bg-blue-500'}`}></span>
                    <span className="text-xs font-bold text-slate-800">{occ.type}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(occ.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {occ.titles.map((t, idx) => (
                    <span key={idx} className="bg-slate-100 text-slate-800 text-[10px] px-2 py-0.5 rounded-full font-semibold border border-slate-200">
                      {t}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-600 line-clamp-3 mb-3">{occ.description}</p>
                <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                    <div className="flex items-center space-x-1 text-slate-400">
                        <i className="fas fa-user-edit text-[10px]"></i>
                        <span className="text-[10px] font-medium">{occ.reporterName}</span>
                    </div>
                    {occ.severity && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          occ.severity === Severity.HIGH || occ.severity === Severity.CRITICAL ? 'bg-red-50 text-red-600' : 
                          occ.severity === Severity.MEDIUM ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'
                      }`}>
                          Gravidade {occ.severity}
                      </span>
                    )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-slate-200">
                <i className="fas fa-check-circle text-emerald-100 text-5xl mb-3"></i>
                <p className="text-slate-400 text-sm font-medium">Nenhuma ocorrência registrada.</p>
            </div>
          )}
        </div>
      </section>

      {/* BLOCO: Procedimentos e sanções */}
      {hasDefenseData && (
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6 animate-fade-in">
          <div className="flex items-center space-x-3 border-b border-slate-50 pb-4">
            <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-gavel text-sm"></i>
            </div>
            <h3 className="text-sm font-black text-slate-800">Procedimentos e sanções</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-1.5 ml-1">Medida aplicada</label>
              <div className="w-full p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm font-bold text-slate-700">
                {medidaAplicada || 'Nenhuma medida registrada'}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-1.5 ml-1">Base regimental</label>
              <div className="w-full p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm font-medium text-slate-700 min-h-[60px] leading-relaxed">
                {baseRegimental || 'O artigo regimento o PPP que fundamenta a medida'}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-1.5 ml-1">Observações pedagógicas</label>
              <div className="w-full p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm font-medium text-slate-700 min-h-[60px] leading-relaxed">
                {obsPedagogicas || 'Estratégias de acompanhamento adotadas'}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* BLOCO: Argumentação de defesa do aluno */}
      {hasDefenseData && (
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4 animate-fade-in">
          <div className="flex items-center space-x-3 border-b border-slate-50 pb-4">
            <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-comment-dots text-sm"></i>
            </div>
            <h3 className="text-sm font-black text-slate-800">Argumentação de defesa do aluno</h3>
          </div>
          
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-1.5 ml-1">Relato da defesa</label>
            <div className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-medium text-slate-700 min-h-[80px] leading-relaxed">
              {defesaAluno || 'Os argumentos e justificativas apresentadas pelo aluno e digitadas na tela Defesa do Aluno'}
            </div>
          </div>

          {defenseFiles.length > 0 && (
            <div className="space-y-3 pt-2 animate-fade-in">
              <label className="block text-[10px] font-black text-slate-400 ml-1">Anexos de defesa (Documentos/Fotos)</label>
              
              <div className="grid grid-cols-1 gap-2">
                {defenseFiles.map(file => (
                  <div key={file.id} className="flex items-center space-x-3 p-3 bg-slate-50 border border-slate-100 rounded-xl shadow-sm">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-slate-100 flex-shrink-0">
                      <i className={`fas ${file.type.includes('image') ? 'fa-file-image text-emerald-500' : 'fa-file-alt text-amber-500'} text-sm`}></i>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-slate-700 truncate">{file.name}</p>
                      <p className="text-[8px] text-slate-400 font-medium">{formatSize(file.size)}</p>
                    </div>
                    <div className="px-2 py-1 bg-white border border-slate-100 rounded-md text-[8px] font-black text-slate-400">
                      Anexado
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* BLOCO: Formalização e validação */}
      {isFormalized && (
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6 animate-fade-in">
          <div className="flex items-center space-x-3 border-b border-slate-50 pb-4">
            <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-file-signature text-sm"></i>
            </div>
            <h3 className="text-sm font-black text-slate-800">Formalização e validação</h3>
          </div>

          <div className="bg-indigo-50/50 p-5 rounded-[2rem] border border-indigo-100 space-y-3">
            <h4 className="text-[10px] font-black text-indigo-900 text-center">Termo de ciência e compromisso</h4>
            <p className="text-[11px] text-indigo-800 text-center leading-relaxed font-medium italic">
              O objetivo desta notificação é promover a reflexão e o alinhamento entre escola e família para o desenvolvimento educacional do aluno.
            </p>
          </div>

          <div className="space-y-4 px-2">
            <div className="flex items-start">
              <span className="text-[11px] font-bold text-slate-600 leading-tight">
                O responsável se considera notificado dos atos, aceita e acata as medidas disciplinares tomadas.
              </span>
            </div>

            <div className="flex items-start">
              <span className="text-[11px] font-bold text-slate-600 leading-tight">
                O aluno(a) está ciente das medidas disciplinares tomadas.
              </span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default StudentDetail;