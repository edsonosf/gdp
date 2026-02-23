
import React, { useState, useRef, useEffect } from 'react';
import { User, Occurrence } from '../types';
import { 
  GENDER_OPTIONS, 
  SECRETARIA_OPTIONS, 
  LOTACAO_EDUCACAO_OPTIONS, 
  FUNCAO_OPTIONS,
  COMPONENTE_OPTIONS,
  DISCIPLINA_OPTIONS,
  CARGA_OPTIONS,
  TURNO_OPTIONS
} from '../constants';

interface UserEditFormProps {
  user: User;
  onBack: () => void;
  onSuccess: (updatedUser: User) => void;
  occurrences?: Occurrence[];
  showAdminToggle?: boolean;
  onDelete?: (userId: string) => void;
}

const UserEditForm: React.FC<UserEditFormProps> = ({ 
  user, 
  onBack, 
  onSuccess, 
  occurrences = [], 
  showAdminToggle = true,
  onDelete
}) => {
  const [formData, setFormData] = useState({
    fullName: user.name,
    socialName: user.socialName || '',
    useSocialName: user.socialName ? 'sim' : 'nao',
    gender: user.gender || '',
    birthDate: user.birthDate || '',
    cpf: user.cpf,
    phone: user.phone || '',
    phone2: user.phone2 || '',
    email: user.email,
    secretaria: user.secretaria,
    lotacao: user.lotacao,
    matricula: user.matricula,
    cargo: user.cargo || '',
    funcao: user.role,
    otherFuncao: user.cargo && !FUNCAO_OPTIONS.includes(user.role) ? user.role : '',
    isSystemAdmin: user.isSystemAdmin || false,
    additionalInfo: user.additionalInfo || '',
    hasCustomSchedule: user.hasCustomSchedule || false,
    customSchedule1: user.customScheduleDetails?.[0] || '',
    customSchedule2: user.customScheduleDetails?.[1] || '',
    customSchedule3: user.customScheduleDetails?.[2] || ''
  });

  const [age, setAge] = useState<number | null>(null);
  const [selectedComponents, setSelectedComponents] = useState<string[]>(user.components || []);
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>(user.disciplines || []);
  const [selectedCarga, setSelectedCarga] = useState<string[]>(user.cargaHoraria || []);
  const [selectedTurno, setSelectedTurno] = useState<string[]>(user.turnoTrabalho || []);
  const [photoPreview, setPhotoPreview] = useState<string | null>(user.profileImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Permitir exclusão se a função onDelete for fornecida
  const canDelete = !!onDelete;

  const maskDate = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{4})(\d)/, '$1').slice(0, 10);
  };

  const maskPhone = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{1})(\d{4})(\d)/, '$1 $2-$3').replace(/(-\d{4})\d+?$/, '$1').slice(0, 16);
  };

  const maskMatricula = (value: string) => {
    return value.replace(/\D/g, '');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let finalValue = value;
    
    if (type === 'checkbox') {
        finalValue = (e.target as HTMLInputElement).checked as any;
    } else if (name === 'birthDate') {
        finalValue = maskDate(value);
    } else if (name === 'phone' || name === 'phone2') {
        finalValue = maskPhone(value);
    } else if (name === 'matricula') {
        finalValue = maskMatricula(value);
    }

    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleToggle = (list: string[], setList: (l: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
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
    const updatedUser: User = {
      ...user,
      name: formData.fullName,
      socialName: formData.useSocialName === 'sim' ? formData.socialName : '',
      gender: formData.gender,
      birthDate: formData.birthDate,
      cpf: formData.cpf,
      phone: formData.phone,
      phone2: formData.phone2,
      email: formData.email,
      secretaria: formData.secretaria,
      lotacao: formData.lotacao,
      matricula: formData.matricula,
      cargo: formData.cargo,
      role: formData.funcao === 'Outra Função' ? formData.otherFuncao : formData.funcao,
      profileImage: photoPreview || user.profileImage,
      isSystemAdmin: formData.isSystemAdmin,
      components: formData.funcao === 'Docente' ? selectedComponents : [],
      disciplines: formData.funcao === 'Docente' ? selectedDisciplines : [],
      cargaHoraria: selectedCarga,
      turnoTrabalho: selectedTurno,
      additionalInfo: formData.additionalInfo,
      hasCustomSchedule: formData.hasCustomSchedule,
      customScheduleDetails: formData.hasCustomSchedule ? [formData.customSchedule1, formData.customSchedule2, formData.customSchedule3] : []
    };
    onSuccess(updatedUser);
  };

  return (
    <div className="bg-white p-4 pb-24 overflow-y-auto h-full font-sans text-slate-700">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Foto */}
        <section className="flex flex-col items-center">
          <div className="relative w-32 h-32 mb-1">
            <img src={photoPreview || 'https://i.pravatar.cc/150'} alt="Preview" className="w-full h-full rounded-full object-cover border-4 border-indigo-100 shadow-md" />
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-indigo-600 text-white w-10 h-10 rounded-full border-4 border-white flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-colors"
            >
              <i className="fas fa-camera"></i>
            </button>
          </div>
          <input type="file" ref={fileInputRef} onChange={handlePhotoChange} className="hidden" accept="image/*" />
          <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-2 uppercase">Foto do perfil</p>
        </section>

        {/* 2. Nome Logic */}
        <section className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <label className="block text-sm font-bold text-slate-700 mb-2">Utiliza nome social?</label>
                <div className="flex space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" name="useSocialName" value="sim" checked={formData.useSocialName === 'sim'} onChange={handleInputChange} className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-medium text-slate-600">Sim</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" name="useSocialName" value="nao" checked={formData.useSocialName === 'nao'} onChange={handleInputChange} className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-medium text-slate-600">Não</span>
                    </label>
                </div>
            </div>

            <div className="animate-fade-in">
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  {formData.useSocialName === 'sim' ? 'Nome social' : 'Nome completo'}
                </label>
                <input 
                  type="text" 
                  name={formData.useSocialName === 'sim' ? "socialName" : "fullName"} 
                  value={formData.useSocialName === 'sim' ? formData.socialName : formData.fullName} 
                  onChange={handleInputChange} 
                  className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-indigo-500 outline-none font-medium" 
                  required 
                />
            </div>
        </section>

        {/* 3. Identidade de Gênero e Data de Nascimento */}
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Identidade de gênero</label>
                <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none font-medium">
                    <option value="">Selecione</option>
                    {GENDER_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Data de nascimento
                </label>
                <input type="text" name="birthDate" value={formData.birthDate} onChange={handleInputChange} placeholder="DD/MM/AAAA" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none font-medium" />
            </div>
        </div>

        {/* 4. CPF e Matrícula */}
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">CPF *</label>
                <input type="text" name="cpf" value={formData.cpf} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-100 text-slate-500 outline-none font-medium" disabled />
            </div>
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Matrícula *</label>
                <input type="text" name="matricula" value={formData.matricula} onChange={handleInputChange} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none font-medium" placeholder="Sem dígito" required />
            </div>
        </div>

        {/* 5. Celular de Contato e Celular para Recados */}
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Celular de contato *</label>
                <div className="relative">
                    <input 
                      type="text" 
                      name="phone" 
                      value={formData.phone} 
                      onChange={handleInputChange} 
                      placeholder="(99) 9 9999-9999" 
                      className="w-full p-4 pr-12 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium" 
                      required 
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none">
                        <i className="fab fa-whatsapp text-xl"></i>
                    </div>
                </div>
            </div>
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Celular para recados</label>
                <input type="text" name="phone2" value={formData.phone2} onChange={handleInputChange} placeholder="(99) 9 9999-9999" className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium" />
            </div>
        </div>

        {/* 6. E-mail */}
        <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">E-mail</label>
            <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none font-medium" />
        </div>

        {/* 7. Secretaria Municipal de Origem */}
        <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Secretaria municipal de origem</label>
            <select name="secretaria" value={formData.secretaria} onChange={handleInputChange} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none font-medium">
                <option value="">Selecione</option>
                {SECRETARIA_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>

        {/* 8. Lotação Atual */}
        <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Lotação atual</label>
            <select name="lotacao" value={formData.lotacao} onChange={handleInputChange} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none font-medium">
                <option value="">Selecione</option>
                {LOTACAO_EDUCACAO_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>

        {/* 9. Cargo */}
        <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Cargo</label>
            <input type="text" name="cargo" value={formData.cargo} onChange={handleInputChange} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none font-medium" />
        </div>

        {/* 10. Função */}
        <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Função</label>
            <select name="funcao" value={formData.funcao} onChange={handleInputChange} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none font-medium">
                <option value="">Selecione</option>
                {FUNCAO_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>

        {/* 11. Outra Função */}
        {formData.funcao === 'Outra Função' && (
            <div className="animate-fade-in">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Especifique a função</label>
                <input type="text" name="otherFuncao" value={formData.otherFuncao} onChange={handleInputChange} className="w-full p-3 border border-indigo-200 rounded-xl bg-indigo-50 outline-none font-medium" />
            </div>
        )}

        {/* 12. Componente e Disciplina */}
        {formData.funcao === 'Docente' && (
            <div className="space-y-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 animate-fade-in">
                <div>
                    <label className="block text-xs font-bold text-indigo-900 mb-2 uppercase">Componente curricular (EF)</label>
                    <div className="flex flex-wrap gap-2">
                        {COMPONENTE_OPTIONS.map(c => (
                            <button key={c} type="button" onClick={() => handleToggle(selectedComponents, setSelectedComponents, c)} className={`px-3 py-2 rounded-lg text-[10px] font-bold border transition-all ${selectedComponents.includes(c) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-indigo-200 text-indigo-700'}`}>
                                {c}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-indigo-900 mb-2 uppercase">Disciplina</label>
                    <div className="flex flex-wrap gap-2">
                        {DISCIPLINA_OPTIONS.map(d => (
                            <button key={d} type="button" onClick={() => handleToggle(selectedDisciplines, setSelectedDisciplines, d)} className={`px-3 py-2 rounded-lg text-[10px] font-bold border transition-all ${selectedDisciplines.includes(d) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-indigo-200 text-indigo-700'}`}>
                                {d}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* 13. Carga Horária & Personalizar Horário Grouped */}
        <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Carga horária</label>
                <div className="flex flex-wrap gap-2">
                    {CARGA_OPTIONS.map(o => (
                        <button key={o} type="button" onClick={() => handleToggle(selectedCarga, setSelectedCarga, o)} className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${selectedCarga.includes(o) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600'}`}>
                            {o}
                        </button>
                    ))}
                </div>
            </div>

            {/* Personalizar Horário */}
            <div className="space-y-4">
                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-4">
                    <div className="flex items-center justify-between">
                        <label htmlFor="hasCustomSchedule" className="text-sm font-bold text-indigo-900">Personalizar Horário</label>
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, hasCustomSchedule: !prev.hasCustomSchedule }))}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.hasCustomSchedule ? 'bg-indigo-600' : 'bg-slate-300'}`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.hasCustomSchedule ? 'translate-x-6' : 'translate-x-1'}`}
                            />
                        </button>
                    </div>

                    {formData.hasCustomSchedule && (
                        <div className="grid grid-cols-3 gap-2 animate-fade-in">
                            <input 
                                type="text" 
                                name="customSchedule1" 
                                value={formData.customSchedule1} 
                                onChange={handleInputChange} 
                                placeholder="Horário" 
                                className="w-full p-3 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                            />
                            <input 
                                type="text" 
                                name="customSchedule2" 
                                value={formData.customSchedule2} 
                                onChange={handleInputChange} 
                                placeholder="Horário" 
                                className="w-full p-3 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                            />
                            <input 
                                type="text" 
                                name="customSchedule3" 
                                value={formData.customSchedule3} 
                                onChange={handleInputChange} 
                                placeholder="Horário" 
                                className="w-full p-3 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* 14. Turno de Trabalho */}
        <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Turno de trabalho</label>
            <div className="flex gap-2 overflow-x-auto pb-1">
                {TURNO_OPTIONS.map(o => (
                    <button key={o} type="button" onClick={() => handleToggle(selectedTurno, setSelectedTurno, o)} className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${selectedTurno.includes(o) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600'}`}>
                        {o}
                    </button>
                ))}
            </div>
        </div>

        {/* 15. Outras informações adicionais */}
        <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Informações adicionais relevantes</label>
            <textarea name="additionalInfo" value={formData.additionalInfo} onChange={handleInputChange} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none h-24 resize-none font-medium text-sm" placeholder="Digite aqui..."></textarea>
        </div>

        {showAdminToggle && (
            <div className="flex items-center space-x-3 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <input type="checkbox" id="isSystemAdmin" name="isSystemAdmin" checked={formData.isSystemAdmin} onChange={handleInputChange} className="w-5 h-5 text-indigo-600 rounded font-medium" />
                <label htmlFor="isSystemAdmin" className="text-sm font-bold text-indigo-900">Habilitar permissões administrativas</label>
            </div>
        )}

        <div className="flex space-x-3 pt-4">
          <button 
            type="submit" 
            className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all"
          >
            Salvar alterações
          </button>
          
          {canDelete && onDelete && (
            <button 
              type="button" 
              onClick={() => onDelete(user.id)}
              className="px-6 bg-red-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-red-200 hover:bg-red-700 active:scale-[0.98] transition-all flex items-center justify-center"
            >
              <i className="fas fa-trash-alt mr-2"></i>
              Excluir
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default UserEditForm;
