import React, { useState, useEffect } from 'react';
import { Student, OccurrenceType, Occurrence, User, Severity } from '../types';
import { GRADE_OPTIONS, TURNO_OPTIONS } from '../constants';

interface OccurrenceFormProps {
  students: Student[];
  occurrences: Occurrence[];
  currentUser: User | null;
  initialStudentId?: string;
  onSave: (occurrence: Omit<Occurrence, 'id'>) => void;
}

interface ClassificationOption {
  title: string;
  severity: Severity;
}

const PEDAGOGICAL_OPTIONS: { severity: Severity; description: string; items: string[] }[] = [
  {
    severity: Severity.LOW,
    description: "Fatos que atrapalham o ritmo individual do aluno ou pequenos desvios de conduta.",
    items: [
      "Apresentar de forma recorrente esquecimento do material escolar.",
      "Falta de material escolar (livros didáticos) durante as atividades.",
      "Falta de zelo com o material escolar (livros, cadernos, etc).",
      "Dormir durante a aula.",
      "Se debruçar ou baixar a cabeça para ignorar a explicação do professor.",
      "Uso inadequado do uniforme escolar.",
      "Modificar o uniforme escolar com pinturas, riscos ou recortes inapropriados.",
      "Utilização de pinturas corporais com material inapropriados (Liquido corretivo, esmalte ou outros produtos toxicos.",
      "Violação do código escolar de vestimenta.",
      "Uso de má fé ao solicitar ida ao banheiro.",
      "Contribuir para desperdício de água.",
      "Uso inadequado de recursos e materiais coletivos."
    ]
  },
  {
    severity: Severity.MEDIUM,
    description: "Ações que prejudicam o andamento da aula, o coletivo ou demonstram indisciplina moderada.",
    items: [
      "Apresentar-se com fardamento sujo, desalinhado ou rasgado",
      "Atrasos recorrentes à escola.",
      "Utilização de calçados diferentes do previsto pelo regimento escolar.",
      "Faltas injustificadas e não comunicadas.",
      "Circular pelos corredores em horário de aula sem permissão.",
      "Saída da sala de aula sem autorização.",
      "Conversas excessivas/paralelas ou interrupções constantes.",
      "Não realizar atividades em sala ou não apresentar o \"dever de casa\".",
      "Recusar-se a participar de atividades (individuais ou em grupo).",
      "Conduta educacional inadequada (pés nas cadeiras).",
      "Uso indevido de eletrônicos (celular, smartwatch, etc) ou jogos durante a aula.",
      "Não observar a higine corporal no ambiente escolar.",
      "Desperdiçar merenda escolar ou incentivar o desperdício.",
      "Importunar o colega com toques (empurrões, puxões de cabelo, pisões).",
      "Impor ao colega ou a qualquer membro da unidade escolar pseudônimos depreciativos ou não.",
      "Incitar práticas desordeiras.",
      "Prevaricar (faltar ao cumprimento do dever por interesse ou má-fé)."
    ]
  },
  {
    severity: Severity.HIGH,
    description: "Atitudes que rompem o respeito hierárquico, ameaçam a segurança física/emocional ou violam direitos de imagem e privacidade.",
    items: [
      "Agressão verbal, ameaça ou intimidação.",
      "Intimidação através de gestos ou palavras (coação).",
      "Agir de forma grosseira ou usar argumentações pejorativas/depreciativas contra membros da escola.",
      "Desrespeito à autoridade com respostas ofensivas (professores, coordenação, etc).",
      "Desrespeito ou falta de educação (verbal ou gestual) em geral.",
      "Interpelar de forma truculenta membros da comunidade escolar.",
      "Usar palavras de baixo calão (vocabulário vulgar/obsceno).",
      "Uso de termos ofensivos ou linguagem imprópria recorrente.",
      "Filmar ou fotografar membros da escola sem autorização.",
      "Evadir-se (fugir) da escola antes do horário sem autorização.",
      "Importunar colegas usando qualquer tipo de artefato perigoso."
    ]
  }
];

const DISCIPLINARY_OPTIONS: { severity: Severity; description: string; items: string[] }[] = [
  {
    severity: Severity.CRITICAL,
    description: "Violações graves do regimento que exigem intervenção imediata.",
    items: [
      "Porte de armas ou objetos perigosos.",
      "Uso ou comercialização de substâncias ilícitas.",
      "Agressão física contra membros da comunidade escolar.",
      "Vandalismo grave contra o patrimonio.",
      "Furto ou roubo no ambiente escolar.",
      "Assédio ou importunação sexual.",
      "Bullying ou humilhação sistemática",
      "Atos de discriminação (racismo, homofobia, sexismo, etc.)",
      "Vandalismo/Depredação, danos a móveis, equipamentos ou pichação de paredes.",
      "Agressividade física/verbal ou ameaça."
    ]
  }
];

const OccurrenceForm: React.FC<OccurrenceFormProps> = ({ students, occurrences, currentUser, initialStudentId, onSave }) => {
  const [studentId, setStudentId] = useState(initialStudentId || '');
  const [type, setType] = useState<OccurrenceType>(OccurrenceType.DISCIPLINARY);
  const [selectedTitles, setSelectedTitles] = useState<string[]>([]);
  const [occurrenceDate, setOccurrenceDate] = useState(new Date().toISOString().slice(0, 16));
  const [description, setDescription] = useState('');
  const [currentSeverity, setCurrentSeverity] = useState<Severity>(Severity.LOW);

  const [searchName, setSearchName] = useState('');
  const [searchGrade, setSearchGrade] = useState('');
  const [searchTurn, setSearchTurn] = useState('');
  const [searchRoom, setSearchRoom] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(true);

  const filteredStudents = students.filter(s => {
    const matchesName = s.name.toLowerCase().includes(searchName.toLowerCase());
    const matchesGrade = searchGrade === '' || s.grade === searchGrade;
    const matchesTurn = searchTurn === '' || s.turn === searchTurn;
    const matchesRoom = searchRoom === '' || (s.room && s.room.includes(searchRoom));
    return matchesName && matchesGrade && matchesTurn && matchesRoom;
  });

  const selectedStudent = students.find(s => s.id === studentId);
  const studentOccurrenceCount = occurrences.filter(occ => occ.studentId === studentId).length;
  const isRecidivist = studentOccurrenceCount > 0;

  useEffect(() => {
    const options = type === OccurrenceType.PEDAGOGICAL ? PEDAGOGICAL_OPTIONS : DISCIPLINARY_OPTIONS;
    let maxSeverity = Severity.LOW;

    selectedTitles.forEach(title => {
      const option = options.find(group => group.items.includes(title));
      if (option) {
        if (option.severity === Severity.CRITICAL) maxSeverity = Severity.CRITICAL;
        else if (option.severity === Severity.HIGH && maxSeverity !== Severity.CRITICAL) maxSeverity = Severity.HIGH;
        else if (option.severity === Severity.MEDIUM && maxSeverity !== Severity.CRITICAL && maxSeverity !== Severity.HIGH) maxSeverity = Severity.MEDIUM;
      }
    });
    
    setCurrentSeverity(maxSeverity);
  }, [selectedTitles, type]);

  const toggleTitle = (option: string) => {
    if (selectedTitles.includes(option)) {
      setSelectedTitles(selectedTitles.filter(t => t !== option));
    } else if (selectedTitles.length < 3) {
      setSelectedTitles([...selectedTitles, option]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || selectedTitles.length === 0 || !description) {
      alert("Por favor, selecione um aluno, preencha todos os campos e selecione pelo menos um item na classificação.");
      return;
    }

    onSave({
      studentId,
      date: occurrenceDate,
      type,
      titles: selectedTitles,
      description,
      severity: currentSeverity,
      reporterName: currentUser?.name || 'Sistema',
      reporterId: currentUser?.id || '00000000-0000-0000-0000-000000000000',
      status: 'Pendente'
    });
  };

  const currentClassificationGroups = type === OccurrenceType.PEDAGOGICAL ? PEDAGOGICAL_OPTIONS : DISCIPLINARY_OPTIONS;

  return (
    <div className="p-4 pb-20 space-y-6 text-slate-700 font-sans">
      {/* Bloco Pesquisar Aluno */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <button 
          type="button"
          onClick={() => setIsSearchExpanded(!isSearchExpanded)}
          className="w-full p-5 flex items-center justify-between bg-slate-50 border-b border-slate-100"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-search text-sm"></i>
            </div>
            <h3 className="text-sm font-bold text-slate-800">Pesquisar aluno</h3>
          </div>
          <i className={`fas fa-chevron-${isSearchExpanded ? 'up' : 'down'} text-slate-400`}></i>
        </button>

        {isSearchExpanded && (
          <div className="p-5 space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Nome do aluno</label>
                <input 
                  type="text" 
                  value={searchName} 
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="Ex: Ana Maria..."
                  className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Ano escolar</label>
                  <select 
                    value={searchGrade}
                    onChange={(e) => setSearchGrade(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                    <option value="">Todos</option>
                    {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Turno</label>
                  <select 
                    value={searchTurn}
                    onChange={(e) => setSearchTurn(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                    <option value="">Todos</option>
                    {TURNO_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Sala</label>
                <input 
                  type="text" 
                  value={searchRoom}
                  onChange={(e) => setSearchRoom(e.target.value)}
                  placeholder="Ex: 05, 12, Laboratório..."
                  className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-50">
               <h4 className="text-xs font-bold text-slate-400 mb-3 ml-1">Resultados ({filteredStudents.length})</h4>
               <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map(student => (
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
                          src={student.profileImage} 
                          alt={student.name} 
                          className={`w-10 h-10 rounded-full object-cover border-2 ${studentId === student.id ? 'border-white/30' : 'border-slate-50'}`} 
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold truncate ${studentId === student.id ? 'text-white' : 'text-slate-800'}`}>{student.name}</p>
                          <p className={`text-[10px] font-medium opacity-70 ${studentId === student.id ? 'text-indigo-100' : 'text-slate-500'}`}>
                            {student.grade} • {student.classroom} • {student.turn}
                          </p>
                        </div>
                        {studentId === student.id && <i className="fas fa-check-circle text-white"></i>}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-slate-400 italic text-xs">
                      Nenhum aluno encontrado com estes filtros.
                    </div>
                  )}
               </div>
            </div>
          </div>
        )}
      </div>

      {selectedStudent && !isSearchExpanded && (
        <div className="bg-indigo-50 p-4 rounded-3xl border border-indigo-100 flex items-center space-x-4 animate-fade-in shadow-sm">
          <img src={selectedStudent.profileImage} alt="" className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-indigo-900">{selectedStudent.name}</h4>
            <p className="text-xs font-bold text-indigo-600">{selectedStudent.grade} — Turma {selectedStudent.classroom}</p>
          </div>
          <button 
            type="button" 
            onClick={() => setIsSearchExpanded(true)}
            className="text-xs font-bold text-indigo-600 hover:underline"
          >
            Alterar
          </button>
        </div>
      )}

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
              <div key={group.severity} className="space-y-3">
                <div className={`p-3 rounded-2xl border-l-4 ${
                  group.severity === Severity.LOW ? 'bg-green-50 border-green-500' :
                  group.severity === Severity.MEDIUM ? 'bg-amber-50 border-amber-500' :
                  group.severity === Severity.HIGH ? 'bg-red-50 border-red-500' :
                  'bg-red-100 border-red-900'
                }`}>
                  <h4 className={`text-xs font-bold ${
                    group.severity === Severity.LOW ? 'text-green-700' :
                    group.severity === Severity.MEDIUM ? 'text-amber-700' :
                    'text-red-700'
                  }`}>Gravidade: {group.severity}</h4>
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