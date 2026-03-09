import React, { useState, useRef, useEffect } from 'react';
import { Student, Option } from '../types';
import { GRADE_OPTIONS } from '../constants';
import { calculateAge } from '../utils';

interface StudentRegistrationFormProps {
  students: Student[];
  initialData?: Student;
  onBack: () => void;
  onRegister: (student: Omit<Student, 'id'> | Student) => void;
  onDelete?: (id: string, name: string) => void;
  workShifts: Option[];
  genders: Option[];
}

const StudentRegistrationForm: React.FC<StudentRegistrationFormProps> = ({ 
  students, 
  initialData, 
  onBack, 
  onRegister, 
  onDelete,
  workShifts,
  genders
}) => {
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
    gender: initialData?.gender || '',
    cpf: initialData?.cpf || '',
    matricula: initialData?.matricula || '',
    signedForm: initialData?.signedForm || false,
    legalConsent: initialData?.legalConsent || false,
    grade: initialData?.grade || '',
    classroom: initialData?.classroom || '',
    room: initialData?.room || '',
    turn: (initialData?.turn as any) || '',
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maskDate = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{4})(\d)/, '$1').slice(0, 10);
  };

  const maskCPF = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').slice(0, 14);
  };

  const maskMatricula = (value: string) => {
    return value.replace(/\D/g, '');
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

  const generateClassName = () => {
    const { grade, classroom, turn } = formData;
    if (!grade || !classroom || !turn) return '';
    const currentYear = new Date().getFullYear();
    const turnLetter = turn.charAt(0).toUpperCase();
    return `${grade}ANO${classroom.toUpperCase()}${turnLetter}${currentYear}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let finalValue = value;
    if (name === 'birthDate') finalValue = maskDate(value);
    if (name === 'contactPhone' || name === 'backupPhone') finalValue = maskPhone(value);
    if (name === 'cpf') finalValue = maskCPF(value);
    if (name === 'matricula') finalValue = maskMatricula(value);
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
      classroom: generateClassName() || formData.classroom,
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
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-center mb-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" name="useSocialName" checked={formData.useSocialName} onChange={handleInputChange} className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
              <span className="text-xs font-bold text-slate-600">Utilizar Nome Social</span>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">
                {formData.useSocialName ? 'Nome Social *' : 'Nome Completo *'}
              </label>

              {formData.useSocialName && (
                <div className="flex items-start space-x-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 animate-fade-in my-4">
                  <input type="checkbox" name="signedForm" checked={formData.signedForm} onChange={handleInputChange} className="mt-1 w-5 h-5 text-slate-600 rounded" />
                  <label className="text-xs font-medium text-slate-500 leading-tight">
                    O Formulário de requerimento foi assinado pelos responsáveis para a utilização do nome social nesta instituição.
                  </label>
                </div>
              )}

              <input 
                type="text" 
                name={formData.useSocialName ? "socialName" : "name"} 
                value={formData.useSocialName ? formData.socialName : formData.name} 
                onChange={handleInputChange} 
                className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" 
                required 
                placeholder={formData.useSocialName ? "Como deseja ser chamado" : "Nome civil completo"}
              />
            </div>
          </div>

        <section className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Identidade de gênero</label>
            <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full p-4 border border-slate-200 rounded-2xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium">
              <option value=""></option>
              {genders.map(o => <option key={o.id} value={o.value}>{o.value}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">CPF</label>
            <input type="text" name="cpf" value={formData.cpf} onChange={handleInputChange} placeholder="000.000.000-00" className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" />
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1 ml-1">
              <label className="block text-xs font-bold text-slate-500">Dt. Nasc.*</label>
              {age !== null && <span className="text-xs font-bold text-blue-500">( {age} Anos )</span>}
            </div>
            <div className="flex flex-col space-y-1">
              <input type="text" name="birthDate" value={formData.birthDate} onChange={handleInputChange} placeholder="DD/MM/AAAA" className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Matrícula</label>
            <input type="text" name="matricula" value={formData.matricula} onChange={handleInputChange} className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" />
          </div>
        </section>

        <section className="space-y-4 p-5 bg-slate-50 rounded-3xl border border border-blue-100">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-bold text-slate-500 tracking-wider">Ensino Fundamental</h3>
            {generateClassName() && (
              <span className="text-xs font-black text-blue-600 tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                {generateClassName()}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Ano *</label>
              <select name="grade" value={formData.grade} onChange={handleInputChange} className="w-full p-4 border border-slate-200 rounded-2xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" required>
                <option value="">Selecione</option>
                {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Turma *</label>
              <input type="text" name="classroom" value={formData.classroom} onChange={handleInputChange} placeholder="A" maxLength={5} className="w-full p-4 border border-slate-200 rounded-2xl bg-white text-sm font-medium" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Sala</label>
              <input type="text" name="room" value={formData.room} onChange={handleInputChange} className="w-full p-4 border border-slate-200 rounded-2xl bg-white text-sm font-medium" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Turno *</label>
              <select name="turn" value={formData.turn} onChange={handleInputChange} className="w-full p-4 border border-slate-200 rounded-2xl bg-white text-sm font-medium" required>
                <option value=""></option>
                {workShifts.map(o => <option key={o.id} value={o.value}>{o.value}</option>)}
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-4 p-5 bg-blue-50/50 rounded-3xl border border-blue-100">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-sm">
              <i className="fas fa-universal-access text-sm"></i>
            </div>
            <h3 className="text-xs font-bold text-slate-500 tracking-wider">Aluno PcD (Pessoa com Deficiência)</h3>
          </div>

          <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-blue-100 shadow-sm">
            <label className="text-xs font-bold text-blue-800">Atendido pelo AEE</label>
            <input type="checkbox" name="isAEE" checked={formData.isAEE} onChange={handleInputChange} className="w-5 h-5 text-blue-800 rounded focus:ring-blue-500" />
          </div>

          {formData.isAEE && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-white rounded-2xl border border-blue-100 shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-blue-800">Situação do Aluno</h4>
                <div className="flex items-center space-x-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="pcdStatus" value="com_laudo" checked={formData.pcdStatus === 'com_laudo'} onChange={handleInputChange} className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium text-slate-600">Laudo</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="pcdStatus" value="sob_investigacao" checked={formData.pcdStatus === 'sob_investigacao'} onChange={handleInputChange} className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium text-slate-600">Investigação</span>
                  </label>
                </div>

                {formData.pcdStatus === 'com_laudo' && (
                  <div className="animate-fade-in pt-2">
                    <label className="text-xs font-bold text-blue-800 mb-1 ml-1">CID</label>
                    <textarea name="cid" value={formData.cid} onChange={handleInputChange} rows={3} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium resize-none"></textarea>
                  </div>
                )}

                {formData.pcdStatus === 'sob_investigacao' && (
                  <div className="animate-fade-in pt-2">
                    <label className="block text-xs font-bold text-blue-800 mb-1 ml-1">Situação Atual do Aluno</label>
                    <textarea name="investigationDescription" value={formData.investigationDescription} onChange={handleInputChange} rows={5} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium resize-none"></textarea>
                  </div>
                )}
              </div>

              <div className="p-4 bg-white rounded-2xl border border-blue-100 shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-blue-800">Ambiente Escolar</h4>
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
                <label className="block text-xs font-bold text-blue-800 mb-1 ml-1">Tipo de Avaliação Pedagógica</label>
                <textarea name="pedagogicalEvaluationType" value={formData.pedagogicalEvaluationType} onChange={handleInputChange} rows={4} className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium resize-none"></textarea>
              </div>
            </div>
          )}
        </section>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Observações importantes</label>
          <textarea name="observations" value={formData.observations} onChange={handleInputChange} placeholder="Informações médicas, comportamentais..." className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none h-32 resize-none text-sm font-medium"></textarea>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input type="checkbox" name="legalConsent" checked={formData.legalConsent} onChange={handleInputChange} className="mt-1 w-5 h-5 text-indigo-600 rounded" required />
            <span className="text-xs font-medium text-slate-600 leading-tight">
              Declaro estar ciente de que as informações fornecidas são de minha inteira responsabilidade e que a escola poderá solicitar documentos comprobatórios a qualquer momento.
            </span>
          </label>
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
            <i className="fas fa-check-circle mr-3"></i> Finalizar Cadastro
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentRegistrationForm;