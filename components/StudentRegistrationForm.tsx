import React, { useState, useRef, useEffect } from 'react';
import { Student } from '../types';
import { GRADE_OPTIONS } from '../constants';

interface StudentRegistrationFormProps {
  students: Student[];
  initialData?: Student;
  onBack: () => void;
  onRegister: (student: Omit<Student, 'id'> | Student) => void;
  onDelete?: (id: string, name: string) => void;
}

const RELATIONSHIP_OPTIONS = [
  "Filho(a)", "Pai", "Mãe", "Cônjuge", "Companheiro(a) do Pai", "Companheiro(a) do Mãe",
  "Irmão", "Irmã", "Avô Paterno/Materno", "Avó Paterno/Materno", "Neto(a)", "Tio", "Tia",
  "Sobrinho(a) Pai/Mãe", "Sogro(a) Pai/Mãe", "Genro Pai/Mãe", "Nora Pai/Mãe", "Cunhado(a)",
  "Enteado(a)", "Padrasto", "Madrasta", "Primo(a)", "Outro Vínculo"
];

const StudentRegistrationForm: React.FC<StudentRegistrationFormProps> = ({ students, initialData, onBack, onRegister, onDelete }) => {
  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{1})(\d{4})(\d)/, '$1 $2-$3')
      .slice(0, 16);
  };

  const [formData, setFormData] = useState({
    useSocialName: initialData?.socialName ? true : false,
    name: initialData?.name || '',
    socialName: initialData?.socialName || '',
    birthDate: initialData?.birthDate || '',
    grade: initialData?.grade || '',
    classroom: initialData?.classroom || '',
    room: initialData?.room || '',
    turn: (initialData?.turn as any) || '',
    responsibleName: initialData?.responsibleName || '',
    relationship: initialData?.relationship || '',
    otherRelationship: initialData?.otherRelationship || '',
    contactPhone: initialData?.contactPhone || '',
    backupPhone: initialData?.backupPhone || '',
    landline: initialData?.landline || '',
    workPhone: initialData?.workPhone || '',
    email: initialData?.email || '',
    isAEE: initialData?.isAEE || false,
    pcdStatus: (initialData?.pcdStatus as any) || '',
    cid: initialData?.cid || '',
    investigationDescription: initialData?.investigationDescription || '',
    schoolNeed: (initialData?.schoolNeed as any) || [],
    pedagogicalEvaluationType: initialData?.pedagogicalEvaluationType || '',
    observations: initialData?.observations || ''
  });

  const [age, setAge] = useState<number | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialData?.profileImage || null);
  const [responsibleFound, setResponsibleFound] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maskDate = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{4})(\d)/, '$1').slice(0, 10);
  };

  const maskLandline = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2').slice(0, 14);
  };

  const calculateAge = (dob: string) => {
    const parts = dob.split('/');
    if (parts.length !== 3 || parts[2].length !== 4) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const birthDate = new Date(year, month, day);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }
    return calculatedAge >= 0 ? calculatedAge : null;
  };

  useEffect(() => {
    if (formData.birthDate.length === 10) {
      setAge(calculateAge(formData.birthDate));
    } else {
      setAge(null);
    }
  }, [formData.birthDate]);

  useEffect(() => {
    if (formData.responsibleName.length > 3) {
      const match = students.find(s => 
        s.responsibleName.toLowerCase().trim() === formData.responsibleName.toLowerCase().trim()
      );
      if (match && !responsibleFound) {
        setResponsibleFound(true);
        setFormData(prev => ({
          ...prev,
          relationship: match.relationship,
          otherRelationship: match.otherRelationship || '',
          contactPhone: match.contactPhone,
          backupPhone: match.backupPhone || '',
          landline: match.landline || '',
          email: match.email
        }));
      } else if (!match) {
        setResponsibleFound(false);
      }
    } else {
      setResponsibleFound(false);
    }
  }, [formData.responsibleName, students]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let finalValue = value;
    if (name === 'birthDate') finalValue = maskDate(value);
    if (name === 'contactPhone' || name === 'backupPhone') finalValue = maskPhone(value);
    if (name === 'landline' || name === 'workPhone') finalValue = maskLandline(value);
    if (type === 'checkbox') finalValue = (e.target as HTMLInputElement).checked as any;
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert("O nome completo é obrigatório.");
    if (formData.useSocialName && !formData.socialName) return alert("O nome social é obrigatório.");
    if (formData.birthDate.length < 10) return alert("Insira uma data de nascimento válida.");
    
    const studentData = {
      ...formData,
      name: formData.name,
      age: age || 0,
      profileImage: photoPreview || `https://i.pravatar.cc/150?u=${formData.name}`
    };

    if (initialData) {
      onRegister({ ...studentData, id: initialData.id } as Student);
    } else {
      onRegister(studentData as Omit<Student, 'id'>);
    }
  };

  return (
    <div className="bg-white min-h-full pb-20 text-slate-700">
      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        <section className="flex flex-col items-center">
          <div className="relative w-28 h-28">
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="w-full h-full rounded-full object-cover border-4 border-indigo-100 shadow-md" />
            ) : (
              <div className="w-full h-full rounded-full bg-slate-50 flex items-center justify-center text-slate-300 border-4 border-slate-100 border-dashed">
                <i className="fas fa-user-graduate text-3xl"></i>
              </div>
            )}
            <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-indigo-600 text-white w-9 h-9 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
              <i className="fas fa-camera text-xs"></i>
            </button>
          </div>
          <input type="file" ref={fileInputRef} onChange={handlePhotoChange} className="hidden" accept="image/*" />
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <label className="text-sm font-bold text-slate-700">Utiliza nome social?</label>
            <input type="checkbox" name="useSocialName" checked={formData.useSocialName} onChange={handleInputChange} className="w-5 h-5 text-indigo-600 rounded" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Nome completo *</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Digite o nome civil" className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" required />
          </div>

          {formData.useSocialName && (
            <div className="animate-fade-in">
              <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Nome social *</label>
              <input type="text" name="socialName" value={formData.socialName} onChange={handleInputChange} placeholder="Como o aluno deseja ser chamado" className="w-full p-4 border border-indigo-200 rounded-2xl bg-indigo-50 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" required />
            </div>
          )}
        </section>

        <section>
          <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Data de nascimento *</label>
          <div className="flex items-center space-x-4">
            <input type="text" name="birthDate" value={formData.birthDate} onChange={handleInputChange} placeholder="DD/MM/AAAA" className="w-44 p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" required />
            {age !== null && <span className="text-sm font-bold text-slate-700">Idade: {age} anos</span>}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Série / ano *</label>
            <select name="grade" value={formData.grade} onChange={handleInputChange} className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" required>
              <option value="">Selecione</option>
              {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1 ml-1">Turma *</label>
              <input type="text" name="classroom" value={formData.classroom} onChange={handleInputChange} placeholder="A" maxLength={5} className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 text-sm font-medium" required />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1 ml-1">Sala</label>
              <input type="text" name="room" value={formData.room} onChange={handleInputChange} className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 text-sm font-medium" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1 ml-1">Turno *</label>
              <select name="turn" value={formData.turn} onChange={handleInputChange} className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 text-sm font-medium" required>
                <option value=""></option>
                <option value="Manhã">Manhã</option>
                <option value="Tarde">Tarde</option>
                <option value="Noite">Noite</option>
                <option value="Integral">Integral</option>
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-4 p-4 bg-indigo-50/50 rounded-3xl border border-indigo-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-black text-indigo-900">Dados do responsável</h3>
            {responsibleFound && <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Dados importados</span>}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Responsável pelo aluno *</label>
            <input type="text" name="responsibleName" value={formData.responsibleName} onChange={handleInputChange} placeholder="Nome do tutor legal" className="w-full p-4 border border-indigo-100 rounded-2xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Grau de parentesco *</label>
            <select name="relationship" value={formData.relationship} onChange={handleInputChange} className="w-full p-4 border border-indigo-100 rounded-2xl bg-white text-sm font-medium" required>
              <option value="">Selecione o vínculo</option>
              {RELATIONSHIP_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </section>

        <section className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 ml-1">Celular de contato *</label>
              <div className="relative">
                <input type="text" name="contactPhone" value={formData.contactPhone} onChange={handleInputChange} placeholder="(99) 9 9999-9999" className="w-full p-3 pr-10 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" required />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500"><i className="fab fa-whatsapp text-lg"></i></div>
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 ml-1">Celular para recados</label>
              <input type="text" name="backupPhone" value={formData.backupPhone} onChange={handleInputChange} placeholder="(99) 9 9999-9999" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm font-medium" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 ml-1">Telefone fixo</label>
                <input type="text" name="landline" value={formData.landline} onChange={handleInputChange} placeholder="(99) 9999-9999" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm font-medium" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 ml-1">Telefone do trabalho</label>
                <input type="text" name="workPhone" value={formData.workPhone} onChange={handleInputChange} placeholder="(99) 9999-9999" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm font-medium" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 ml-1">E-mail *</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="exemplo@email.com" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm font-medium" required />
            </div>
          </div>
        </section>

        <section className="space-y-4 p-5 bg-blue-50/50 rounded-3xl border border-blue-100 animate-fade-in">
          <div className="flex flex-col mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-sm">
                <i className="fas fa-universal-access text-sm"></i>
              </div>
              <h3 className="text-xs font-bold text-slate-500 tracking-wider">Aluno PcD (Pessoa com Deficiência)</h3>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-blue-100 shadow-sm">
            <label className="text-sm text-slate-700">Atendimento Educacional Especializado (AEE)</label>
            <input 
              type="checkbox" 
              name="isAEE" 
              checked={formData.isAEE} 
              onChange={handleInputChange} 
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" 
            />
          </div>

          {formData.isAEE && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-white rounded-2xl border border-blue-100 shadow-sm space-y-3">
                <h4 className="text-[10px] font-black text-blue-800">Situação do Aluno</h4>
                <div className="flex items-center space-x-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="pcdStatus" 
                      value="com_laudo" 
                      checked={formData.pcdStatus === 'com_laudo'} 
                      onChange={handleInputChange} 
                      className="w-4 h-4 text-blue-600" 
                    />
                    <span className="text-sm font-medium text-slate-600">Com Laudo</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="pcdStatus" 
                      value="sob_investigacao" 
                      checked={formData.pcdStatus === 'sob_investigacao'} 
                      onChange={handleInputChange} 
                      className="w-4 h-4 text-blue-600" 
                    />
                    <span className="text-sm font-medium text-slate-600">Sob investigação</span>
                  </label>
                </div>

                {formData.pcdStatus === 'com_laudo' && (
                  <div className="animate-fade-in pt-2">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 ml-1">Classificação Internacional de Doenças (CID)</label>
                    <textarea 
                      name="cid" 
                      value={formData.cid} 
                      onChange={handleInputChange} 
                      rows={3} 
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium resize-none"
                    ></textarea>
                  </div>
                )}

                {formData.pcdStatus === 'sob_investigacao' && (
                  <div className="animate-fade-in pt-2">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 ml-1">Descreva a Situação Atual do Aluno</label>
                    <textarea 
                      name="investigationDescription" 
                      value={formData.investigationDescription} 
                      onChange={handleInputChange} 
                      rows={5} 
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium resize-none"
                    ></textarea>
                  </div>
                )}
              </div>

              <div className="p-4 bg-white rounded-2xl border border-blue-100 shadow-sm space-y-3">
                <h4 className="text-[10px] font-black text-blue-800">Necessidade em Ambiente Escolar</h4>
                <div className="space-y-2">
                  <label className="flex items-start space-x-3 cursor-pointer p-2 hover:bg-slate-50 rounded-lg transition-colors">
                    <input 
                      type="checkbox" 
                      checked={formData.schoolNeed.includes('estrutura_fisica')} 
                      onChange={() => {
                        const current = formData.schoolNeed;
                        const next = current.includes('estrutura_fisica') 
                          ? current.filter(i => i !== 'estrutura_fisica')
                          : [...current, 'estrutura_fisica'];
                        setFormData(prev => ({ ...prev, schoolNeed: next }));
                      }} 
                      className="mt-1 w-4 h-4 text-blue-600 rounded" 
                    />
                    <span className="text-xs font-medium text-slate-600 leading-tight">Necessidade de Estrutura Física Adaptada.</span>
                  </label>
                  <label className="flex items-start space-x-3 cursor-pointer p-2 hover:bg-slate-50 rounded-lg transition-colors">
                    <input 
                      type="checkbox" 
                      checked={formData.schoolNeed.includes('adaptacao_curricular')} 
                      onChange={() => {
                        const current = formData.schoolNeed;
                        const next = current.includes('adaptacao_curricular') 
                          ? current.filter(i => i !== 'adaptacao_curricular')
                          : [...current, 'adaptacao_curricular'];
                        setFormData(prev => ({ ...prev, schoolNeed: next }));
                      }} 
                      className="mt-1 w-4 h-4 text-blue-600 rounded" 
                    />
                    <span className="text-xs font-medium text-slate-600 leading-tight">Adaptação Curricular, como Planos de Ensino Individualizados (PEI).</span>
                  </label>
                  <label className="flex items-start space-x-3 cursor-pointer p-2 hover:bg-slate-50 rounded-lg transition-colors">
                    <input 
                      type="checkbox" 
                      checked={formData.schoolNeed.includes('atendimento_especializado')} 
                      onChange={() => {
                        const current = formData.schoolNeed;
                        const next = current.includes('atendimento_especializado') 
                          ? current.filter(i => i !== 'atendimento_especializado')
                          : [...current, 'atendimento_especializado'];
                        setFormData(prev => ({ ...prev, schoolNeed: next }));
                      }} 
                      className="mt-1 w-4 h-4 text-blue-600 rounded" 
                    />
                    <span className="text-xs font-medium text-slate-600 leading-tight">Atendimento Especializado (auxiliar na interação social e gerenciar comportamentos disruptivos).</span>
                  </label>
                </div>
              </div>

              <div className="animate-fade-in">
                <label className="block text-[10px] font-bold text-slate-500 mb-1 ml-1">Tipo de Avaliação Pedagógica</label>
                <textarea 
                  name="pedagogicalEvaluationType" 
                  value={formData.pedagogicalEvaluationType} 
                  onChange={handleInputChange} 
                  rows={4} 
                  className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium resize-none"
                ></textarea>
              </div>
            </div>
          )}
        </section>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Observações importantes</label>
          <textarea name="observations" value={formData.observations} onChange={handleInputChange} placeholder="Informações médicas, comportamentais..." className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none h-32 resize-none text-sm font-medium"></textarea>
        </div>

        <div className="flex space-x-3">
          {initialData && onDelete && (
            <button 
              type="button" 
              onClick={() => onDelete(initialData.id, initialData.name)}
              className="flex-1 bg-red-50 text-red-600 py-5 rounded-2xl font-bold border border-red-100 active:scale-[0.98] transition-all flex items-center justify-center text-sm tracking-wider"
            >
              <i className="fas fa-trash-alt mr-3"></i> Excluir
            </button>
          )}
          <button type="submit" className="flex-[2] bg-indigo-600 text-white py-5 rounded-2xl font-bold shadow-xl active:scale-[0.98] transition-all flex items-center justify-center text-sm tracking-wider">
            <i className="fas fa-save mr-3"></i> Salvar cadastro do aluno
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentRegistrationForm;