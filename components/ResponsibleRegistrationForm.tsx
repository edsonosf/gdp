import React, { useState, useRef, useEffect } from 'react';
import { Student, LegalResponsible, Option } from '../types';

interface ResponsibleRegistrationFormProps {
  onBack: () => void;
  onRegister: (data: Omit<LegalResponsible, 'id'>) => void;
  students: Student[];
  kinship: Option[];
  workShifts: Option[];
}

const ResponsibleRegistrationForm: React.FC<ResponsibleRegistrationFormProps> = ({ 
  onBack, 
  onRegister, 
  students,
  kinship,
  workShifts
}) => {
  const [formData, setFormData] = useState({
    name: '',
    relationship: '',
    otherRelationship: '',
    contactPhone: '',
    backupPhone: '',
    landline: '',
    workPhone: '',
    email: '',
    observations: '',
    legalConsent: false,
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [linkedStudentIds, setLinkedStudentIds] = useState<string[]>([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maskPhone = (value: string) => {
    return value.replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{1})(\d{4})(\d)/, '$1 $2-$3')
      .replace(/(-\d{4})\d+?$/, '$1')
      .slice(0, 16);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let finalValue = value;

    if (['contactPhone', 'backupPhone', 'landline', 'workPhone'].includes(name)) {
      finalValue = maskPhone(value);
    }

    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: target.checked }));
      return;
    }

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

  const toggleStudentLink = (studentId: string) => {
    setLinkedStudentIds(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId) 
        : [...prev, studentId]
    );
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
    s.grade.toLowerCase().includes(studentSearchTerm.toLowerCase())
  );

  const linkedStudents = students.filter(s => linkedStudentIds.includes(s.id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.relationship || !formData.contactPhone) {
      alert("Por favor, preencha os campos obrigatórios.");
      return;
    }
    if (!formData.legalConsent) {
      alert("Você deve aceitar o termo de consentimento legal.");
      return;
    }

    onRegister({
      ...formData,
      profileImage: photoPreview || undefined,
      linkedStudents: linkedStudents
    });
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      <form onSubmit={handleSubmit} className="p-4 space-y-6 max-w-2xl mx-auto">
        {/* Photo Section */}
        <section className="flex flex-col items-center py-4">
          <div className="relative w-32 h-32 mb-3 group">
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="w-full h-full rounded-full object-cover border-4 border-white shadow-xl" />
            ) : (
              <div className="w-full h-full rounded-full bg-indigo-50 flex items-center justify-center text-indigo-200 border-4 border-white shadow-inner">
                <i className="fas fa-user-graduate text-5xl"></i>
              </div>
            )}
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()} 
              className="absolute bottom-0 right-0 bg-indigo-600 text-white w-10 h-10 rounded-full border-4 border-white flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-all active:scale-90"
            >
              <i className="fas fa-camera"></i>
            </button>
          </div>
          <input type="file" ref={fileInputRef} onChange={handlePhotoChange} className="hidden" accept="image/*" />
          <p className="text-[9px] text-slate-400 font-bold tracking-widest">Foto do perfil</p>
        </section>

        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-[9px] font-bold text-slate-500 mb-1 tracking-wider">Responsável pelo aluno *</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleInputChange} 
              placeholder="Nome do tutor legal" 
              className="w-full p-3 border border-slate-200 rounded-2xl bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none text-[9px] font-medium transition-all" 
              required 
            />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 mb-1 tracking-wider">Grau de parentesco *</label>
            <select 
              name="relationship" 
              value={formData.relationship} 
              onChange={handleInputChange} 
              className="w-full p-3 border border-slate-200 rounded-2xl bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none text-[9px] font-medium transition-all appearance-none"
              required
            >
              <option value="">Selecione o vínculo</option>
              {kinship.map(opt => <option key={opt.id} value={opt.value}>{opt.value}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-bold text-slate-500 mb-1 tracking-wider">Celular de contato *</label>
              <div className="relative">
                <input 
                  type="text" 
                  name="contactPhone" 
                  value={formData.contactPhone} 
                  onChange={handleInputChange} 
                  placeholder="(99) 9 9999-9999" 
                  className="w-full p-3 pr-12 border border-slate-200 rounded-2xl bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none text-[9px] font-medium transition-all" 
                  required 
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">
                  <i className="fab fa-whatsapp text-lg"></i>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-500 mb-1 tracking-wider">Recados</label>
              <input 
                type="text" 
                name="backupPhone" 
                value={formData.backupPhone} 
                onChange={handleInputChange} 
                placeholder="(99) 9 9999-9999" 
                className="w-full p-3 border border-slate-200 rounded-2xl bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none text-[9px] font-medium transition-all" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-bold text-slate-500 mb-1 tracking-wider">Telefone fixo</label>
              <input 
                type="text" 
                name="landline" 
                value={formData.landline} 
                onChange={handleInputChange} 
                placeholder="(99) 9999-9999" 
                className="w-full p-3 border border-slate-200 rounded-2xl bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none text-[9px] font-medium transition-all" 
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-500 mb-1 tracking-wider">Trabalho</label>
              <input 
                type="text" 
                name="workPhone" 
                value={formData.workPhone} 
                onChange={handleInputChange} 
                placeholder="(99) 9999-9999" 
                className="w-full p-3 border border-slate-200 rounded-2xl bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none text-[9px] font-medium transition-all" 
              />
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 mb-1 tracking-wider">E-mail</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleInputChange} 
              placeholder="exemplo@email.com" 
              className="w-full p-3 border border-slate-200 rounded-2xl bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none text-[9px] font-medium transition-all" 
            />
          </div>
        </div>

        {/* Link Students Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-[9px] font-bold text-slate-700">Vincular Aluno(s)</h3>
            <button type="button" onClick={() => setIsSearching(!isSearching)} className="text-slate-700 hover:text-indigo-600 transition-colors">
              <i className="fas fa-search text-base"></i>
            </button>
          </div>

          {(isSearching || true) && (
            <div className="bg-indigo-50/50 p-6 rounded-[2.5rem] border border-indigo-100 space-y-5 animate-fade-in shadow-sm">
              <div>
                <label className="block text-[9px] font-bold text-slate-600 mb-2">Nome Completo *</label>
                <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
                  <input 
                    type="text" 
                    value={studentSearchTerm} 
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    placeholder="DAVI LUIZ PEREIRA DA SILVA" 
                    className="w-full bg-transparent outline-none font-bold text-indigo-700 uppercase placeholder:text-indigo-300 text-[9px]" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 mb-1">Ano</label>
                  <input type="text" className="w-full p-3 border border-indigo-100 rounded-2xl bg-indigo-50/30 shadow-sm outline-none text-[9px]" />
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1">
                    <label className="block text-[9px] font-bold text-slate-400 mb-1">Turno</label>
                    <div className="relative">
                      <select className="w-full p-3 border border-indigo-100 rounded-2xl bg-indigo-50/30 shadow-sm outline-none appearance-none text-slate-400 text-[9px]">
                        <option value="">Selecione</option>
                        {workShifts.map(o => <option key={o.id} value={o.value}>{o.value}</option>)}
                      </select>
                      <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none text-[8px]"></i>
                    </div>
                  </div>
                  <button type="button" className="p-2 text-indigo-400 hover:text-indigo-600 transition-colors">
                    <i className="fas fa-search text-lg"></i>
                  </button>
                </div>
              </div>

              {/* Search Results */}
              {studentSearchTerm && (
                <div className="max-h-48 overflow-y-auto space-y-2 pt-2">
                  {filteredStudents.map(s => (
                    <button 
                      key={s.id} 
                      type="button" 
                      onClick={() => toggleStudentLink(s.id)}
                      className={`w-full flex items-center p-3 rounded-2xl border transition-all ${linkedStudentIds.includes(s.id) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-indigo-100 text-slate-700 hover:border-indigo-300'}`}
                    >
                      <img src={s.profileImage || `https://i.pravatar.cc/150?u=${s.id}`} alt="" className="w-8 h-8 rounded-full object-cover mr-3" />
                      <div className="flex-1 text-left">
                        <p className="text-xs font-bold uppercase">{s.name}</p>
                        <p className="text-[10px] opacity-70">{s.grade} - {s.classroom}</p>
                      </div>
                      <i className={`fas ${linkedStudentIds.includes(s.id) ? 'fa-check-circle' : 'fa-plus-circle opacity-30'}`}></i>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Linked Students List */}
          <div className="space-y-4 pt-2">
            <h4 className="text-lg font-bold text-indigo-700">Aluno(s) Vinculados</h4>
            {linkedStudents.length > 0 ? (
              linkedStudents.map(s => (
                <div key={s.id} className="bg-indigo-50/30 p-4 rounded-3xl border-2 border-red-400/50 shadow-sm flex items-center space-x-4 relative">
                  <div className="w-14 h-14 rounded-full border-2 border-emerald-400 p-0.5">
                    <img src={s.profileImage || `https://i.pravatar.cc/150?u=${s.id}`} alt="" className="w-full h-full rounded-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h5 className="text-base font-bold text-indigo-800 uppercase leading-tight">{s.name}</h5>
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-tight">{s.grade}{s.classroom}{new Date().getFullYear()}</p>
                    <p className="text-xs text-slate-400 font-medium">{s.age || '13'} Anos</p>
                  </div>
                  <button type="button" onClick={() => toggleStudentLink(s.id)} className="w-10 h-10 flex items-center justify-center text-slate-700 hover:text-red-500 transition-colors">
                    <i className="fas fa-link text-2xl"></i>
                  </button>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-slate-100/50 rounded-3xl border border-dashed border-slate-200 text-slate-400">
                <i className="fas fa-user-friends text-2xl mb-2 block"></i>
                <p className="text-xs font-medium">Nenhum aluno vinculado ainda</p>
              </div>
            )}
          </div>
        </div>

        {/* Observations */}
        <div>
          <label className="block text-[9px] font-bold text-slate-600 mb-2">Observações importantes</label>
          <textarea 
            name="observations" 
            value={formData.observations} 
            onChange={handleInputChange} 
            className="w-full p-4 border border-slate-200 rounded-3xl bg-slate-50 outline-none h-32 resize-none font-medium text-[9px] focus:ring-2 focus:ring-indigo-500 transition-all" 
            placeholder="Digite aqui..."
          ></textarea>
        </div>

        {/* Legal Consent */}
        <div className="bg-amber-50 p-5 rounded-3xl border border-amber-100 flex items-start space-x-4 shadow-sm">
          <div className="pt-1">
            <input 
              type="checkbox" 
              name="legalConsent" 
              checked={formData.legalConsent} 
              onChange={handleInputChange} 
              className="w-6 h-6 text-indigo-600 border-amber-300 rounded-lg focus:ring-indigo-500 transition-all cursor-pointer" 
            />
          </div>
          <label className="text-xs text-amber-900 font-medium leading-relaxed">
            Declaro estar ciente de que a falsidade das informações aqui prestadas me sujeita às penalidades legais previstas no Art. 299 do Código Penal.
          </label>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button 
            type="submit" 
            className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-bold shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center space-x-3"
          >
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <i className="fas fa-check text-xs"></i>
            </div>
            <span className="text-lg">Finalizar Cadastro</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResponsibleRegistrationForm;
