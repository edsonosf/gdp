import React, { useState, useRef, useEffect } from 'react';
import { User, Option, PositionOption, LocalUnitOption } from '../types';

interface UserRegistrationFormProps {
  onBack: () => void;
  onRegister: (userData: Omit<User, 'id' | 'status'>) => void;
  curricularComponents: Option[];
  subjects: Option[];
  workSchedules: Option[];
  workShifts: Option[];
  positions: PositionOption[];
  genders: Option[];
  organizationalChart: Option[];
  localUnits: LocalUnitOption[];
}

const UserRegistrationForm: React.FC<UserRegistrationFormProps> = ({ 
  onBack, 
  onRegister,
  curricularComponents,
  subjects,
  workSchedules,
  workShifts,
  positions,
  genders,
  organizationalChart,
  localUnits
}) => {
  const [formData, setFormData] = useState({
    useGoogle: 'nao',
    useSocialName: false,
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
    if (!formData.useSocialName && !formData.fullName) return "Nome Completo é obrigatório.";
    if (formData.useSocialName && !formData.socialName) return "Nome Social é obrigatório.";
    if (!formData.gender) return "Identidade de Gênero é obrigatória.";
    if (!formData.birthDate) return "Data de Nascimento é obrigatória.";
    if (!formData.cpf) return "CPF é obrigatório para o login.";
    if (!formData.phone) return "Celular de contato é obrigatório.";
    if (!formData.secretaria) return "Secretaria de origem é obrigatória.";
    if (!formData.lotacao) return "Lotação atual é obrigatória.";
    if (!formData.matricula) return "Matrícula é obrigatória.";
    if (!formData.funcao) return "A função é obrigatória.";
    if (formData.funcao === 'Outra Função' && !formData.otherFuncao) return "Especifique sua função.";
    if (!formData.legalConsent) return "Você deve declarar estar ciente dos termos legais.";
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
      name: formData.useSocialName ? formData.socialName : formData.fullName,
      socialName: formData.useSocialName ? formData.socialName : '',
      email: formData.email || null,
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
      //profileImage: photoPreview || `https://i.pravatar.cc/150?u=${formData.cpf}`,
      profileImage: photoPreview || 'data:image/png;base64,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',
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
        <h2 className="text-sm font-bold text-slate-800 ml-2">Cadastro de Usuário</h2>
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
          <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-2">Foto do Perfil</p>
        </section>

        <section className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-center">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" name="useSocialName" checked={formData.useSocialName} onChange={handleInputChange} className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
              <span className="text-xs font-bold text-slate-700">Utilizar Nome Social.</span>
            </label>
          </div>

          <div className="animate-fade-in">
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              {formData.useSocialName ? 'Nome social *' : 'Nome completo *'}
            </label>
            <input 
              type="text" 
              name={formData.useSocialName ? 'socialName' : 'fullName'} 
              value={formData.useSocialName ? formData.socialName : formData.fullName} 
              onChange={handleInputChange} 
              className={`text-[11px] uppercase w-full p-3 border rounded-xl outline-none font-medium transition-all focus:ring-2 focus:ring-indigo-500 focus:bg-white ${(formData.useSocialName ? formData.socialName : formData.fullName).trim() !== '' ? 'bg-white border-indigo-300 shadow-sm' : 'bg-slate-50 border-slate-200'}`} 
              required 
              placeholder={formData.useSocialName ? "Como deseja ser chamado" : "Nome civil completo"}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Identidade de gênero</label>
              <select 
                name="gender" 
                value={formData.gender} 
                onChange={handleInputChange} 
                className={`text-[11px] w-full p-3 border rounded-xl outline-none font-medium transition-all focus:ring-2 focus:ring-indigo-500 focus:bg-white ${formData.gender.trim() !== '' ? 'bg-white border-indigo-300 shadow-sm' : 'bg-slate-50 border-slate-200'}`}
              >
                <option value="">Selecione</option>
                {genders.map(g => <option key={g.id} value={g.value}>{g.value}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Data de nascimento
              </label>
              <input 
                type="text" 
                name="birthDate" 
                value={formData.birthDate} 
                onChange={handleInputChange} 
                placeholder="DD/MM/AAAA" 
                className={`text-[11px] w-full p-3 border rounded-xl outline-none font-medium transition-all focus:ring-2 focus:ring-indigo-500 focus:bg-white ${formData.birthDate.trim() !== '' ? 'bg-white border-indigo-300 shadow-sm' : 'bg-slate-50 border-slate-200'}`} 
              />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">CPF *</label>
            <input 
              type="text" 
              name="cpf" 
              value={formData.cpf} 
              onChange={handleInputChange} 
              placeholder="999.999.999-99" 
              className={`text-[11px] w-full p-3 border rounded-xl outline-none font-medium transition-all focus:ring-2 focus:ring-indigo-500 focus:bg-white ${formData.cpf.trim() !== '' ? 'bg-white border-indigo-300 shadow-sm' : 'bg-slate-50 border-slate-200'}`} 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Matrícula</label>
            <input 
              type="text" 
              name="matricula" 
              value={formData.matricula} 
              onChange={handleInputChange} 
              placeholder="Sem dígito" 
              className={`text-[11px] w-full p-3 border rounded-xl outline-none font-medium transition-all focus:ring-2 focus:ring-indigo-500 focus:bg-white ${formData.matricula.trim() !== '' ? 'bg-white border-indigo-300 shadow-sm' : 'bg-slate-50 border-slate-200'}`} 
              required 
            />
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Celular *</label>
            <div className="relative">
              <input 
                type="text" 
                name="phone" 
                value={formData.phone} 
                onChange={handleInputChange} 
                placeholder="(99) 9 9999-9999" 
                className={`text-[11px] w-full p-3 pr-10 border rounded-xl outline-none font-medium transition-all focus:ring-2 focus:ring-indigo-500 focus:bg-white ${formData.phone.trim() !== '' ? 'bg-white border-indigo-300 shadow-sm' : 'bg-slate-50 border-slate-200'}`} 
                required 
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none">
                <i className="fab fa-whatsapp text-sm"></i>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Celular de recados</label>
            <input 
              type="text" 
              name="phone2" 
              value={formData.phone2} 
              onChange={handleInputChange} 
              placeholder="(99) 9 9999-9999" 
              className={`text-[11px] w-full p-3 border rounded-xl outline-none font-medium transition-all focus:ring-2 focus:ring-indigo-500 focus:bg-white ${formData.phone2.trim() !== '' ? 'bg-white border-indigo-300 shadow-sm' : 'bg-slate-50 border-slate-200'}`} 
            />
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">E-mail *</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleInputChange} 
              placeholder="exemplo@email.com" 
              className={`text-[11px] w-full p-3 border rounded-xl outline-none font-medium transition-all focus:ring-2 focus:ring-indigo-500 focus:bg-white ${formData.email.trim() !== '' ? 'bg-white border-indigo-300 shadow-sm' : 'bg-slate-50 border-slate-200'}`} 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Secretaria de origem</label>
            <select 
              name="secretaria" 
              value={formData.secretaria} 
              onChange={handleInputChange} 
              className={`text-[11px] w-full p-3 border rounded-xl outline-none font-medium transition-all focus:ring-2 focus:ring-indigo-500 focus:bg-white ${formData.secretaria.trim() !== '' ? 'bg-white border-indigo-300 shadow-sm' : 'bg-slate-50 border-slate-200'}`}
            >
              <option value="">Selecione</option>
              {organizationalChart.map(s => <option key={s.id} value={s.value}>{s.value}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Lotação atual</label>
            <select 
              name="lotacao" 
              value={formData.lotacao} 
              onChange={handleInputChange} 
              className={`text-[11px] w-full p-3 border rounded-xl outline-none font-medium transition-all focus:ring-2 focus:ring-indigo-500 focus:bg-white ${formData.lotacao.trim() !== '' ? 'bg-white border-indigo-300 shadow-sm' : 'bg-slate-50 border-slate-200'}`}
            >
                <option value="">Selecione</option>
                {localUnits
                  .filter(o => {
                    if (formData.secretaria === 'Secretaria de Educação') {
                      const eduOrg = organizationalChart.find(org => org.value === 'Secretaria de Educação');
                      if (!eduOrg) return true;
                      if (!o.organizationChartId) return true; // Fallback for unlinked units
                      return o.organizationChartId === eduOrg.id;
                    }
                    return true;
                  })
                  .map(o => <option key={o.id} value={o.value}>{o.value}</option>)
                }
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Cargo</label>
            <select 
              name="cargo" 
              value={formData.cargo} 
              onChange={handleInputChange} 
              className={`text-[11px] w-full p-3 border rounded-xl outline-none font-medium transition-all focus:ring-2 focus:ring-indigo-500 focus:bg-white ${formData.cargo.trim() !== '' ? 'bg-white border-indigo-300 shadow-sm' : 'bg-slate-50 border-slate-200'}`}
            >
              <option value="">Selecione</option>
              {positions.map(p => <option key={p.id} value={p.value}>{p.value} ({p.abbreviation})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Função</label>
            <select 
              name="funcao" 
              value={formData.funcao} 
              onChange={handleInputChange} 
              className={`text-[11px] w-full p-3 border rounded-xl outline-none font-medium transition-all focus:ring-2 focus:ring-indigo-500 focus:bg-white ${formData.funcao.trim() !== '' ? 'bg-white border-indigo-300 shadow-sm' : 'bg-slate-50 border-slate-200'}`}
            >
              <option value="">Selecione</option>
              {positions.map(p => <option key={p.id} value={p.value}>{p.value}</option>)}
              <option value="Outra Função">Outra Função</option>
            </select>
          </div>
        </section>

        <section className="space-y-4">
          {formData.funcao === 'Outra Função' && (
            <div className="animate-fade-in">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Especifique sua função *</label>
              <input 
                type="text" 
                name="otherFuncao" 
                value={formData.otherFuncao} 
                onChange={handleInputChange} 
                className={`text-[11px] w-full p-3 border rounded-xl outline-none font-medium transition-all focus:ring-2 focus:ring-indigo-500 focus:bg-white ${formData.otherFuncao.trim() !== '' ? 'bg-white border-indigo-300 shadow-sm' : 'bg-slate-50 border-slate-200'}`} 
                placeholder="Qual função exerce?" 
                required 
              />
            </div>
          )}

          {formData.funcao === 'Docente' && (
            <div className="space-y-4 animate-fade-in p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
              <div>
                <label className="block text-xs font-bold text-indigo-900 mb-2 uppercase">Componente Curricular</label>
                <div className="flex flex-wrap gap-2">
                  {curricularComponents.map(c => (
                    <button key={c.id} type="button" onClick={() => handleToggle(selectedComponents, setSelectedComponents, c.value)} className={`px-3 py-2 rounded-lg text-[10px] font-bold border transition-all ${selectedComponents.includes(c.value) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50'}`}>
                      {c.value}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-indigo-900 mb-2 uppercase">Disciplina</label>
                <div className="flex flex-wrap gap-2">
                  {subjects.map(d => (
                    <button key={d.id} type="button" onClick={() => handleToggle(selectedDisciplines, setSelectedDisciplines, d.value)} className={`px-3 py-2 rounded-lg text-[10px] font-bold border transition-all ${selectedDisciplines.includes(d.value) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50'}`}>
                      {d.value}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Carga horária</label>
              <div className="flex flex-wrap gap-2">
                {workSchedules.map(o => (
                  <button key={o.id} type="button" onClick={() => handleToggle(selectedCarga, setSelectedCarga, o.value)} className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${selectedCarga.includes(o.value) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    {o.value}
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
                      className={`text-[11px] w-full p-3 border rounded-xl outline-none text-xs font-bold transition-all focus:ring-2 focus:ring-indigo-500 focus:bg-white ${formData.customSchedule1.trim() !== '' ? 'bg-white border-indigo-300 shadow-sm text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-700'}`} 
                    />
                    <input 
                      type="text" 
                      name="customSchedule2" 
                      value={formData.customSchedule2} 
                      onChange={handleInputChange} 
                      placeholder="Horário" 
                      className={`text-[11px] w-full p-3 border rounded-xl outline-none text-xs font-bold transition-all focus:ring-2 focus:ring-indigo-500 focus:bg-white ${formData.customSchedule2.trim() !== '' ? 'bg-white border-indigo-300 shadow-sm text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-700'}`} 
                    />
                    <input 
                      type="text" 
                      name="customSchedule3" 
                      value={formData.customSchedule3} 
                      onChange={handleInputChange} 
                      placeholder="Horário" 
                      className={`text-[11px] w-full p-3 border rounded-xl outline-none text-xs font-bold transition-all focus:ring-2 focus:ring-indigo-500 focus:bg-white ${formData.customSchedule3.trim() !== '' ? 'bg-white border-indigo-300 shadow-sm text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-700'}`} 
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Turno de trabalho</label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {workShifts.map(o => (
                <button key={o.id} type="button" onClick={() => handleToggle(selectedTurno, setSelectedTurno, o.value)} className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all whitespace-nowrap ${selectedTurno.includes(o.value) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  {o.value}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Informações Adicionais Relevantes</label>
          <textarea 
            name="additionalInfo" 
            value={formData.additionalInfo} 
            onChange={handleInputChange} 
            className={`text-[11px] w-full p-3 border rounded-xl outline-none h-24 resize-none transition-all focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium text-sm ${formData.additionalInfo.trim() !== '' ? 'bg-white border-indigo-300 shadow-sm' : 'bg-slate-50 border-slate-200'}`} 
            placeholder="Digite aqui..."
          ></textarea>
        </div>

        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-start space-x-3">
            <input type="checkbox" name="legalConsent" checked={formData.legalConsent} onChange={handleInputChange} className="mt-1 w-5 h-5 text-indigo-600 border-amber-300 rounded focus:ring-indigo-500" />
            <label className="text-[11px] text-amber-900 leading-tight">
                Declaro estar ciente de que a falsidade das informações aqui prestadas me sujeita às penalidades legais previstas no Art. 299 do Código Penal.
            </label>
        </div>

        <button type="submit" className="txt-sm w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center disabled:bg-slate-300 disabled:shadow-none">
          <i className="fas fa-check-circle mr-2"></i>
          Finalizar Cadastro
        </button>
      </form>
    </div>
  );
};

export default UserRegistrationForm;