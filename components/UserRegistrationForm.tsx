import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
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

interface UserRegistrationFormProps {
  onBack: () => void;
  onRegister: (userData: Omit<User, 'id' | 'status'>) => void;
}

const UserRegistrationForm: React.FC<UserRegistrationFormProps> = ({ onBack, onRegister }) => {
  const [formData, setFormData] = useState({
    useGoogle: 'nao',
    useSocialName: 'nao',
    fullName: '',
    socialName: '',
    gender: '',
    birthDate: '',
    cpf: '',
    phone: '',
    phoneReceivesMessages: 'nao',
    phone2: '',
    email: '',
    secretaria: '',
    lotacao: '',
    matricula: '',
    cargo: '',
    funcao: '',
    otherFuncao: '',
    additionalInfo: '',
    legalConsent: false,
    hasCustomSchedule: false,
    customSchedule1: '',
    customSchedule2: '',
    customSchedule3: ''
  });

  const [age, setAge] = useState<number | null>(null);
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([]);
  const [selectedCarga, setSelectedCarga] = useState<string[]>([]);
  const [selectedTurno, setSelectedTurno] = useState<string[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

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

  const maskDate = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{4})(\d)/, '$1').slice(0, 10);
  };

  const maskPhone = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{1})(\d{4})(\d)/, '$1 $2-$3').replace(/(-\d{4})\d+?$/, '$1').slice(0, 16);
  };

  const maskCPF = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').slice(0, 14);
  };

  const maskMatricula = (value: string) => {
    return value.replace(/\D/g, '');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let finalValue = value;

    if (name === 'birthDate') finalValue = maskDate(value);
    if (name === 'phone' || name === 'phone2') finalValue = maskPhone(value);
    if (name === 'cpf') finalValue = maskCPF(value);
    if (name === 'matricula') finalValue = maskMatricula(value);

    if (type === 'checkbox') {
        const target = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: target.checked }));
        return;
    }

    setFormData(prev => {
      const nextData = { ...prev, [name]: finalValue };
      if (name === 'secretaria') {
        nextData.lotacao = '';
      }
      return nextData;
    });
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

  const validate = () => {
    if (formData.useSocialName === 'nao' && !formData.fullName) return "Nome Completo é obrigatório.";
    if (formData.useSocialName === 'sim' && !formData.socialName) return "Nome Social é obrigatório.";
    if (!formData.matricula) return "Matrícula é obrigatória.";
    if (!formData.legalConsent) return "Você deve declarar estar ciente dos termos legais.";
    if (!formData.cpf) return "CPF é obrigatório para o login.";
    if (!formData.phone) return "Celular de contato é obrigatório.";
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      alert(error);
      return;
    }

    const userData: Omit<User, 'id' | 'status'> = {
      name: formData.useSocialName === 'sim' ? formData.socialName : formData.fullName,
      socialName: formData.useSocialName === 'sim' ? formData.socialName : '',
      email: formData.email,
      cpf: formData.cpf,
      secretaria: formData.secretaria,
      lotacao: formData.lotacao,
      matricula: formData.matricula,
      phone: formData.phone,
      phone2: formData.phone2,
      gender: formData.gender,
      birthDate: formData.birthDate,
      cargo: formData.cargo,
      role: formData.funcao === 'Outra Função' ? formData.otherFuncao : formData.funcao,
      profileImage: photoPreview || `https://i.pravatar.cc/150?u=${formData.cpf}`,
      isSystemAdmin: false,
      components: formData.funcao === 'Docente' ? selectedComponents : [],
      disciplines: formData.funcao === 'Docente' ? selectedDisciplines : [],
      cargaHoraria: selectedCarga,
      turnoTrabalho: selectedTurno,
      additionalInfo: formData.additionalInfo,
      hasCustomSchedule: formData.hasCustomSchedule,
      customScheduleDetails: formData.hasCustomSchedule ? [formData.customSchedule1, formData.customSchedule2, formData.customSchedule3] : []
    };

    onRegister(userData);
  };

  return (
    <div className="bg-white p-4 pb-20">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-indigo-600 transition-colors">
          <i className="fas fa-arrow-left text-lg"></i>
        </button>
        <h2 className="text-xl font-bold text-slate-800 ml-2">Cadastro de Usuário</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="flex flex-col items-center">
          <div className="relative w-32 h-32 mb-3">
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="w-full h-full rounded-full object-cover border-4 border-indigo-100 shadow-md" />
            ) : (
              <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border-4 border-indigo-50 border-dashed">
                <i className="fas fa-user-plus text-3xl"></i>
              </div>
            )}
            <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-indigo-600 text-white w-10 h-10 rounded-full border-4 border-white flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-colors">
              <i className="fas fa-camera"></i>
            </button>
          </div>
          <input type="file" ref={fileInputRef} onChange={handlePhotoChange} className="hidden" accept="image/*" />
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-2">Foto do Perfil</p>
        </section>

        <section className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <label className="block text-sm font-bold text-slate-700 mb-3">Utiliza Nome Social?</label>
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
              {formData.useSocialName === 'sim' ? 'Nome Social *' : 'Nome Completo *'}
            </label>
            <input 
              type="text" 
              name={formData.useSocialName === 'sim' ? 'socialName' : 'fullName'} 
              value={formData.useSocialName === 'sim' ? formData.socialName : formData.fullName} 
              onChange={handleInputChange} 
              className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-indigo-500 outline-none font-medium" 
              required 
              placeholder={formData.useSocialName === 'sim' ? "Como deseja ser chamado" : "Nome civil completo"}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Identidade de Gênero</label>
            <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none font-medium">
              <option value="">Selecione</option>
              {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Data de nascimento
            </label>
            <input type="text" name="birthDate" value={formData.birthDate} onChange={handleInputChange} placeholder="DD/MM/AAAA" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none font-medium" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">CPF *</label>
            <input type="text" name="cpf" value={formData.cpf} onChange={handleInputChange} placeholder="999.999.999-99" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none font-medium" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Celular de contato *</label>
              <div className="relative">
                <input 
                  type="text" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleInputChange} 
                  placeholder="(99) 9 9999-9999" 
                  className="w-full p-3 pr-10 border border-slate-200 rounded-xl bg-slate-50 outline-none font-medium focus:ring-2 focus:ring-indigo-500" 
                  required 
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none">
                  <i className="fab fa-whatsapp text-lg"></i>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Celular para recados</label>
              <input type="text" name="phone2" value={formData.phone2} onChange={handleInputChange} placeholder="(99) 9 9999-9999" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none font-medium" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">E-mail</label>
            <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="exemplo@email.com" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none font-medium" />
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Secretaria municipal de origem</label>
            <select name="secretaria" value={formData.secretaria} onChange={handleInputChange} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none font-medium">
              <option value="">Selecione</option>
              {SECRETARIA_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Lotação atual</label>
            <select name="lotacao" value={formData.lotacao} onChange={handleInputChange} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none font-medium">
                <option value="">Selecione</option>
                {LOTACAO_EDUCACAO_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Matrícula *</label>
              <input type="text" name="matricula" value={formData.matricula} onChange={handleInputChange} placeholder="Sem dígito" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none font-medium" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Cargo</label>
              <input type="text" name="cargo" value={formData.cargo} onChange={handleInputChange} placeholder="Ex: Professor I" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none font-medium" />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Função</label>
            <select name="funcao" value={formData.funcao} onChange={handleInputChange} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none font-medium">
              <option value="">Selecione</option>
              {FUNCAO_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {formData.funcao === 'Outra Função' && (
            <div className="animate-fade-in">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Especifique sua função *</label>
              <input type="text" name="otherFuncao" value={formData.otherFuncao} onChange={handleInputChange} className="w-full p-3 border border-indigo-200 rounded-xl bg-indigo-50 outline-none font-medium" placeholder="Qual função exerce?" required />
            </div>
          )}

          {formData.funcao === 'Docente' && (
            <div className="space-y-4 animate-fade-in p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
              <div>
                <label className="block text-xs font-bold text-indigo-900 mb-2 uppercase">Componente Curricular (EF)</label>
                <div className="flex flex-wrap gap-2">
                  {COMPONENTE_OPTIONS.map(c => (
                    <button key={c} type="button" onClick={() => handleToggle(selectedComponents, setSelectedComponents, c)} className={`px-3 py-2 rounded-lg text-[10px] font-bold border transition-all ${selectedComponents.includes(c) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-indigo-900 mb-2 uppercase">Disciplina</label>
                <div className="flex flex-wrap gap-2">
                  {DISCIPLINA_OPTIONS.map(d => (
                    <button key={d} type="button" onClick={() => handleToggle(selectedDisciplines, setSelectedDisciplines, d)} className={`px-3 py-2 rounded-lg text-[10px] font-bold border transition-all ${selectedDisciplines.includes(d) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50'}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
          <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Carga Horária</label>
              <div className="flex flex-wrap gap-2">
                {CARGA_OPTIONS.map(o => (
                  <button key={o} type="button" onClick={() => handleToggle(selectedCarga, setSelectedCarga, o)} className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${selectedCarga.includes(o) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    {o}
                  </button>
                ))}
              </div>
            </div>

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

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Turno de Trabalho</label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {TURNO_OPTIONS.map(o => (
                  <button key={o} type="button" onClick={() => handleToggle(selectedTurno, setSelectedTurno, o)} className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all whitespace-nowrap ${selectedTurno.includes(o) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    {o}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Informações Adicionais Relevantes</label>
          <textarea name="additionalInfo" value={formData.additionalInfo} onChange={handleInputChange} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none h-24 resize-none focus:ring-indigo-500 font-medium text-sm" placeholder="Alguma observação importante?"></textarea>
        </div>

        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-start space-x-3">
            <input type="checkbox" name="legalConsent" checked={formData.legalConsent} onChange={handleInputChange} className="mt-1 w-5 h-5 text-indigo-600 border-amber-300 rounded focus:ring-indigo-500" />
            <label className="text-xs text-amber-900 leading-tight">
                Declaro estar ciente de que a falsidade das informações aqui prestadas me sujeita às penalidades legais previstas no Art. 299 do Código Penal.
            </label>
        </div>

        <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center disabled:bg-slate-300 disabled:shadow-none" disabled={!formData.legalConsent}>
          <i className="fas fa-check-circle mr-2"></i>
          Finalizar Cadastro
        </button>
      </form>
    </div>
  );
};

export default UserRegistrationForm;