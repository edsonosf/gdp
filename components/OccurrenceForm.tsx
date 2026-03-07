import React, { useState, useEffect } from 'react';
import { Student, OccurrenceType, Occurrence, User, Severity, Option, OccurrenceClassification } from '../types';
import { GRADE_OPTIONS } from '../constants';

interface OccurrenceFormProps {
  students: Student[];
  occurrences: Occurrence[];
  currentUser: User | null;
  initialStudentId?: string;
  initialStudentIds?: string[];
  onSave: (occurrence: Omit<Occurrence, 'id'>) => void;
  workShifts: Option[];
  classifications: OccurrenceClassification[];
}

interface ClassificationOption {
  title: string;
  severity: Severity;
}

interface SGEStudent {
  id: string;
  profile_image: string;
  name: string;
  social_name: string;
  transgender: boolean;
  classroom: string;
  birth_date: string;
  pcd_info: string;
  month_severity: number;
}

const DEFAULT_STUDENT_IMAGE = 'https://via.placeholder.com/150';

const OccurrenceForm: React.FC<OccurrenceFormProps> = ({ students, occurrences, currentUser, initialStudentId, initialStudentIds, onSave, workShifts, classifications }) => {
  const [studentId, setStudentId] = useState(initialStudentId || (initialStudentIds && initialStudentIds.length > 0 ? initialStudentIds[0] : ''));
  const [type, setType] = useState<OccurrenceType>(OccurrenceType.DISCIPLINARY);
  const [selectedTitles, setSelectedTitles] = useState<string[]>([]);
  const [occurrenceDate, setOccurrenceDate] = useState(new Date().toISOString().slice(0, 16));
  const [description, setDescription] = useState('');
  const [currentSeverity, setCurrentSeverity] = useState<Severity>(Severity.LOW);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SGEStudent[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(true);

  useEffect(() => {
    const fetchStudents = async (search: string) => {
      if (!search.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await fetch(`/api/students?mode=list&search=${encodeURIComponent(search)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error("Error searching students:", err);
      } finally {
        setIsSearching(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchStudents(searchTerm);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const selectedStudent = students.find(s => s.id === studentId);
  const studentOccurrenceCount = occurrences.filter(occ => occ.studentId === studentId).length;
  const isRecidivist = studentOccurrenceCount > 0;

  useEffect(() => {
    const options = type === OccurrenceType.PEDAGOGICAL 
      ? classifications.filter(c => c.level !== Severity.CRITICAL)
      : classifications.filter(c => c.level === Severity.CRITICAL);
    
    let maxSeverity = Severity.LOW;

    selectedTitles.forEach(title => {
      const option = options.find(group => group.items.includes(title));
      if (option) {
        if (option.level === Severity.CRITICAL) maxSeverity = Severity.CRITICAL;
        else if (option.level === Severity.HIGH && maxSeverity !== Severity.CRITICAL) maxSeverity = Severity.HIGH;
        else if (option.level === Severity.MEDIUM && maxSeverity !== Severity.CRITICAL && maxSeverity !== Severity.HIGH) maxSeverity = Severity.MEDIUM;
      }
    });
    
    setCurrentSeverity(maxSeverity);
  }, [selectedTitles, type, classifications]);

  const toggleTitle = (option: string) => {
    if (selectedTitles.includes(option)) {
      setSelectedTitles(selectedTitles.filter(t => t !== option));
    } else if (selectedTitles.length < 3) {
      setSelectedTitles([...selectedTitles, option]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!studentId && (!initialStudentIds || initialStudentIds.length === 0)) || selectedTitles.length === 0 || !description) {
      alert("Por favor, selecione um aluno, preencha todos os campos e selecione pelo menos um item na classificação.");
      return;
    }

    const occurrenceData = {
      studentId: studentId,
      date: occurrenceDate,
      type,
      titles: selectedTitles,
      description,
      severity: currentSeverity,
      reporterName: currentUser?.name || 'Sistema',
      reporterId: currentUser?.id || '00000000-0000-0000-0000-000000000000',
      status: 'Pendente' as const
    };

    if (initialStudentIds && initialStudentIds.length > 1) {
      initialStudentIds.forEach(id => {
        onSave({ ...occurrenceData, studentId: id });
      });
    } else {
      onSave(occurrenceData);
    }
  };

  const currentClassificationGroups = type === OccurrenceType.PEDAGOGICAL 
    ? classifications.filter(c => c.level !== Severity.CRITICAL)
    : classifications.filter(c => c.level === Severity.CRITICAL);

  return (
    <div className="p-4 pb-20 space-y-6 text-slate-700 font-sans">
      {/* Bloco Pesquisar Aluno */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <button 
          type="button"
          onClick={() => (!initialStudentIds || initialStudentIds.length <= 1) && setIsSearchExpanded(!isSearchExpanded)}
          className="w-full p-5 flex items-center justify-between bg-slate-50 border-b border-slate-100"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-user-graduate text-sm"></i>
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              {initialStudentIds && initialStudentIds.length > 1 ? `Alunos Selecionados (${initialStudentIds.length})` : 'Pesquisar aluno'}
            </h3>
          </div>
          {(!initialStudentIds || initialStudentIds.length <= 1) && (
            <i className={`fas fa-chevron-${isSearchExpanded ? 'up' : 'down'} text-slate-400`}></i>
          )}
        </button>

        {initialStudentIds && initialStudentIds.length > 1 ? (
          <div className="p-5 bg-orange-50/50 border-b border-orange-100">
            <p className="text-xs text-orange-800 font-medium mb-3">
              Esta ocorrência será registrada para <strong>{initialStudentIds.length} alunos</strong> selecionados na lista.
            </p>
            <div className="flex flex-wrap gap-2">
              {initialStudentIds.slice(0, 8).map(id => {
                const s = students.find(st => st.id === id);
                return s ? (
                  <span key={id} className="text-[10px] bg-white px-2.5 py-1 rounded-full border border-orange-200 text-orange-700 font-bold shadow-sm">
                    {s.name}
                  </span>
                ) : null;
              })}
              {initialStudentIds.length > 8 && (
                <span className="text-[10px] text-orange-600 font-bold self-center">+{initialStudentIds.length - 8} mais...</span>
              )}
            </div>
          </div>
        ) : (
          <>
            {isSearchExpanded && (
              <div className="p-5 space-y-4 animate-fade-in">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Buscar por nome ou turma..." 
                    className="w-full pl-4 pr-10 py-3 border border-slate-200 rounded-2xl bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                  />
                  <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400">
                    {isSearching ? (
                      <div className="w-4 h-4 border-2 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    ) : (
                      <i className="fas fa-search"></i>
                    )}
                  </span>
                </div>

                <div className="pt-2">
                  <h4 className="text-xs font-bold text-slate-400 mb-3 ml-1">Resultados ({searchResults.length})</h4>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {searchResults.length > 0 ? (
                      searchResults.map(student => {
                        const displayName = student.social_name || student.name;
                        return (
                          <div 
                            key={student.id}
                            onClick={() => {
                              setStudentId(student.id);
                              setIsSearchExpanded(false);
                            }}
                            className={`p-3 rounded-2xl border flex items-center space-x-3 cursor-pointer transition-all ${
                              studentId === student.id 
                                ? 'bg-indigo-600 border-indigo-700 text-white' 
                                : 'bg-white border-slate-100 hover:border-indigo-200 text-slate-700 shadow-sm'
                            }`}
                          >
                            <img 
                              src={student.profile_image || DEFAULT_STUDENT_IMAGE} 
                              alt={displayName} 
                              className={`w-10 h-10 rounded-full object-cover border-2 ${studentId === student.id ? 'border-white/30' : 'border-slate-50'}`} 
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-bold truncate ${studentId === student.id ? 'text-white' : 'text-slate-800'}`}>{displayName}</p>
                              <p className={`text-[10px] font-medium opacity-70 ${studentId === student.id ? 'text-indigo-100' : 'text-slate-500'}`}>
                                {student.classroom}
                              </p>
                            </div>
                            {studentId === student.id && <i className="fas fa-check-circle text-white"></i>}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 text-slate-400 italic text-xs">
                        {searchTerm.length > 0 ? 'Nenhum aluno encontrado.' : 'Digite para pesquisar alunos...'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {selectedStudent && !isSearchExpanded && (
              <div className="p-5 flex items-center space-x-4 bg-indigo-50/50 animate-fade-in">
                <img 
                  src={selectedStudent.profileImage || DEFAULT_STUDENT_IMAGE} 
                  alt={selectedStudent.name} 
                  className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-slate-800">{selectedStudent.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">{selectedStudent.grade} - {selectedStudent.classroom}</p>
                </div>
                <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-sm">
                  <i className="fas fa-check"></i>
                </div>
              </div>
            )}
          </>
        )}
  </div>

      {selectedStudent && isRecidivist && (
        <div className="bg-red-50 p-4 rounded-[1.5rem] border border-red-200 flex items-start space-x-3 animate-fade-in shadow-sm">
          <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center flex-shrink-0">
            <i className="fas fa-triangle-exclamation text-sm"></i>
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-bold text-red-700 mb-1">Atenção: aluno reincidente</h4>
            <p className="text-[10px] text-red-800 leading-tight font-medium">
              Ocorrências classificadas como "baixas" podem se tornar "médias" ou "altas" se forem praticadas de forma contumaz após intervenções pedagógicas.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
        <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-4 mb-2">Dados da ocorrência</h3>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Data e hora do incidente</label>
            <input
              type="datetime-local"
              className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
              value={occurrenceDate}
              onChange={(e) => setOccurrenceDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Tipo de ocorrência</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { setType(OccurrenceType.DISCIPLINARY); setSelectedTitles([]); }}
              className={`p-4 rounded-2xl border text-xs font-bold transition-all ${
                type === OccurrenceType.DISCIPLINARY 
                ? 'bg-indigo-600 border-indigo-700 text-white shadow-lg shadow-indigo-100' 
                : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
              }`}
            >
              <i className="fas fa-gavel mr-2"></i>
              Disciplinar
            </button>
            <button
              type="button"
              onClick={() => { setType(OccurrenceType.PEDAGOGICAL); setSelectedTitles([]); }}
              className={`p-4 rounded-2xl border text-xs font-bold transition-all ${
                type === OccurrenceType.PEDAGOGICAL 
                ? 'bg-indigo-600 border-indigo-700 text-white shadow-lg shadow-indigo-100' 
                : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
              }`}
            >
              <i className="fas fa-book-reader mr-2"></i>
              Pedagógica
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-3 ml-1 flex justify-between items-center">
            <span>Classificação de ocorrências</span>
            <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full text-xs">({selectedTitles.length}/3)</span>
          </label>
          
          <div className="space-y-6 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
            {currentClassificationGroups.map((group) => (
              <div key={group.id} className="space-y-3">
                <div className={`p-3 rounded-2xl border-l-4 ${
                  group.level === Severity.LOW ? 'bg-green-50 border-green-500' :
                  group.level === Severity.MEDIUM ? 'bg-amber-50 border-amber-500' :
                  group.level === Severity.HIGH ? 'bg-red-50 border-red-500' :
                  'bg-red-100 border-red-900'
                }`}>
                  <h4 className={`text-xs font-bold ${
                    group.level === Severity.LOW ? 'text-green-700' :
                    group.level === Severity.MEDIUM ? 'text-amber-700' :
                    'text-red-700'
                  }`}>Gravidade: {group.level}</h4>
                  <p className="text-[10px] text-slate-600 leading-tight mt-1 font-medium italic">{group.description}</p>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {group.items.map((item) => (
                    <div 
                      key={item}
                      onClick={() => toggleTitle(item)}
                      className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition-all ${
                        selectedTitles.includes(item)
                          ? 'bg-white border-indigo-500 shadow-sm ring-1 ring-indigo-500/20'
                          : 'bg-white border-slate-100 hover:bg-slate-50'
                      } ${!selectedTitles.includes(item) && selectedTitles.length >= 3 ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}
                    >
                      <div className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                        selectedTitles.includes(item) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-200'
                      }`}>
                        {selectedTitles.includes(item) && <i className="fas fa-check text-[8px]"></i>}
                      </div>
                      <span className={`text-[11px] leading-tight font-medium ${
                        selectedTitles.includes(item) ? 'text-indigo-900 font-bold' : 'text-slate-600'
                      }`}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Relato detalhado</label>
          <textarea
            className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 outline-none h-40 resize-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 text-sm"
            placeholder="Descreva o que aconteceu em detalhes, incluindo local, testemunhas e atitudes tomadas..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          ></textarea>
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center"
        >
          <i className="fas fa-save mr-3"></i>
          Confirmar registro
        </button>
      </form>
    </div>
  );
};

export default OccurrenceForm;