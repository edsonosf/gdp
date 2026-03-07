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
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-2">FOTO DO PERFIL</p>
        </section>

        <section className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-center">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" name="useSocialName" checked={formData.useSocialName} onChange={handleInputChange} className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
              <span className="text-sm font-bold text-slate-700">Utilizar Nome Social.</span>
            </label>
          </div>

          <div className="animate-fade-in">
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              {formData.useSocialName ? 'Nome Social *' : 'Nome Completo *'}
            </label>
            <input 
              type="text" 
              name={formData.useSocialName ? 'socialName' : 'fullName'} 
              value={formData.useSocialName ? formData.socialName : formData.fullName} 
              onChange={handleInputChange} 
              className={`w-full p-3 border rounded-xl outline-none font-medium transition-all focus:ring-2 focus:ring-indigo-500 focus:bg-white ${(formData.useSocialName ? formData.socialName : formData.fullName) ? 'bg-white border-indigo-300 shadow-sm' : 'bg-slate-50 border-slate-200'}`} 
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
                className={`w-full p-3 border rounded-xl outline-none font-medium transition-all focus:ring-2 focus:ring-indigo-500 focus:bg-white ${formData.gender ? 'bg-white border-indigo-300 shadow-sm' : 'bg-slate-50 border-slate-200'}`}
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
                className={`w-full p-3 border rounded-xl outline-none font-medium transition-all focus:ring-2 focus:ring-indigo-500 focus:bg-white ${formData.birthDate ? 'bg-white border-indigo-300 shadow-sm' : 'bg-slate-50 border-slate-200'}`} 
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
              className={`w-full p-3 border rounded-xl outline-none font-medium transition-all focus:ring-2 focus:ring-indigo-500 focus:bg-white ${formData.cpf ? 'bg-white border-indigo-300 shadow-sm' : 'bg-slate-50 border-slate-200'}`} 
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
              className={`w-full p-3 border rounded-xl outline-none font-medium transition-all focus:ring-2 focus:ring-indigo-500 focus:bg-white ${formData.matricula ? 'bg-white border-indigo-300 shadow-sm' : 'bg-slate-50 border-slate-200'}`} 
              required 
            />
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Celular de contato *</label>
            <div className="relative">
              <input 
                type="text" 
                name="phone" 
                value={formData.phone} 
                onChange={handleInputChange} 
                placeholder="(99) 9 9999-9999" 
                className={`w-full p-3 pr-10 border rounded-xl outline-none font-medium transition-all focus:ring-2 focus:ring-indigo-500 focus:bg-white ${formData.phone ? 'bg-white border-indigo-300 shadow-sm' : 'bg-slate-50 border-slate-200'}`} 
                required 
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none">
                <i className="fab fa-whatsapp text-lg"></i>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Celular para recados</label>
            <input 
              type="text" 
              name="phone2" 
              value={formData.phone2} 
              onChange={handleInputChange} 
              placeholder="(99) 9 9999-9999" 
              className={`w-full p-3 border rounded-xl outline-none font-medium transition-all focus:ring-2 focus:ring-indigo-500 focus:bg-white ${formData.phone2 ? 'bg-white border-indigo-300 shadow-sm' : 'bg-slate-50 border-slate-200'}`} 
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
              className={`w-full p-3 border rounded-xl outline-none font-medium transition-all focus:ring-2 focus:ring-indigo-500 focus:bg-white ${formData.email ? 'bg-white border-indigo-300 shadow-sm' : 'bg-slate-50 border-slate-200'}`} 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Secretaria municipal de origem</label>
            <select 
              name="secretaria" 
              value={formData.secretaria} 
              onChange={handleInputChange} 
              className={`w-full p-3 border rounded-xl outline-none font-medium transition-all focus:ring-2 focus:ring-indigo-500 focus:bg-white ${formData.secretaria ? 'bg-white border-indigo-300 shadow-sm' : 'bg-slate-50 border-slate-200'}`}
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
              className={`w-full p-3 border rounded-xl outline-none font-medium transition-all focus:ring-2 focus:ring-indigo-500 focus:bg-white ${formData.lotacao ? 'bg-white border-indigo-300 shadow-sm' : 'bg-slate-50 border-slate-200'}`}
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
              className={`w-full p-3 border rounded-xl outline-none font-medium transition-all focus:ring-2 focus:ring-indigo-500 focus:bg-white ${formData.cargo ? 'bg-white border-indigo-300 shadow-sm' : 'bg-slate-50 border-slate-200'}`}
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
              className={`w-full p-3 border rounded-xl outline-none font-medium transition-all focus:ring-2 focus:ring-indigo-500 focus:bg-white ${formData.funcao ? 'bg-white border-indigo-300 shadow-sm' : 'bg-slate-50 border-slate-200'}`}
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
                className={`w-full p-3 border rounded-xl outline-none font-medium transition-all focus:ring-2 focus:ring-indigo-500 focus:bg-white ${formData.otherFuncao ? 'bg-white border-indigo-300 shadow-sm' : 'bg-slate-50 border-slate-200'}`} 
                placeholder="Qual função exerce?" 
                required 
              />
            </div>
          )}

          {formData.funcao === 'Docente' && (
            <div className="space-y-4 animate-fade-in p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
              <div>
                <label className="block text-xs font-bold text-indigo-900 mb-2 uppercase">Componente Curricular (EF)</label>
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
                      className={`w-full p-3 border rounded-xl outline-none text-xs font-bold transition-all focus:ring-2 focus:ring-indigo-500 focus:bg-white ${formData.customSchedule1 ? 'bg-white border-indigo-300 shadow-sm text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-700'}`} 
                    />
                    <input 
                      type="text" 
                      name="customSchedule2" 
                      value={formData.customSchedule2} 
                      onChange={handleInputChange} 
                      placeholder="Horário" 
                      className={`w-full p-3 border rounded-xl outline-none text-xs font-bold transition-all focus:ring-2 focus:ring-indigo-500 focus:bg-white ${formData.customSchedule2 ? 'bg-white border-indigo-300 shadow-sm text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-700'}`} 
                    />
                    <input 
                      type="text" 
                      name="customSchedule3" 
                      value={formData.customSchedule3} 
                      onChange={handleInputChange} 
                      placeholder="Horário" 
                      className={`w-full p-3 border rounded-xl outline-none text-xs font-bold transition-all focus:ring-2 focus:ring-indigo-500 focus:bg-white ${formData.customSchedule3 ? 'bg-white border-indigo-300 shadow-sm text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-700'}`} 
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
            className={`w-full p-3 border rounded-xl outline-none h-24 resize-none transition-all focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium text-sm ${formData.additionalInfo ? 'bg-white border-indigo-300 shadow-sm' : 'bg-slate-50 border-slate-200'}`} 
            placeholder="Digite aqui..."
          ></textarea>
        </div>

        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-start space-x-3">
            <input type="checkbox" name="legalConsent" checked={formData.legalConsent} onChange={handleInputChange} className="mt-1 w-5 h-5 text-indigo-600 border-amber-300 rounded focus:ring-indigo-500" />
            <label className="text-xs text-amber-900 leading-tight">
                Declaro estar ciente de que a falsidade das informações aqui prestadas me sujeita às penalidades legais previstas no Art. 299 do Código Penal.
            </label>
        </div>

        <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center disabled:bg-slate-300 disabled:shadow-none">
          <i className="fas fa-check-circle mr-2"></i>
          Finalizar Cadastro
        </button>
      </form>
    </div>
  );
};

export default UserRegistrationForm;