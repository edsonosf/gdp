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
          <p className="text-[10px] text-slate-400 font-bold tracking-widest">Foto do perfil</p>
        </section>

        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-500 mb-1 tracking-wider">Responsável pelo aluno *</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleInputChange} 
              placeholder="Nome do tutor legal" 
              className="w-full p-3 border border-slate-200 rounded-2xl bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium transition-all" 
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-500 mb-1 tracking-wider">Grau de parentesco *</label>
            <select 
              name="relationship" 
              value={formData.relationship} 
              onChange={handleInputChange} 
              className="w-full p-3 border border-slate-200 rounded-2xl bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium transition-all appearance-none"
              required
            >
              <option value="">Selecione o vínculo</option>
              {kinship.map(opt => <option key={opt.id} value={opt.value}>{opt.value}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-500 mb-1 tracking-wider">Celular de contato *</label>
              <div className="relative">
                <input 
                  type="text" 
                  name="contactPhone" 
                  value={formData.contactPhone} 
                  onChange={handleInputChange} 
                  placeholder="(99) 9 9999-9999" 
                  className="w-full p-3 pr-12 border border-slate-200 rounded-2xl bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium transition-all" 
                  required 
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">
                  <i className="fab fa-whatsapp text-lg"></i>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-500 mb-1 tracking-wider">Recados</label>
              <input 
                type="text" 
                name="backupPhone" 
                value={formData.backupPhone} 
                onChange={handleInputChange} 
                placeholder="(99) 9 9999-9999" 
                className="w-full p-3 border border-slate-200 rounded-2xl bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium transition-all" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-500 mb-1 tracking-wider">Telefone fixo</label>
              <input 
                type="text" 
                name="landline" 
                value={formData.landline} 
                onChange={handleInputChange} 
                placeholder="(99) 9999-9999" 
                className="w-full p-3 border border-slate-200 rounded-2xl bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-500 mb-1 tracking-wider">Trabalho</label>
              <input 
                type="text" 
                name="workPhone" 
                value={formData.workPhone} 
                onChange={handleInputChange} 
                placeholder="(99) 9999-9999" 
                className="w-full p-3 border border-slate-200 rounded-2xl bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium transition-all" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-500 mb-1 tracking-wider">E-mail</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleInputChange} 
              placeholder="exemplo@email.com" 
              className="w-full p-3 border border-slate-200 rounded-2xl bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium transition-all" 
            />
          </div>
        </div>

        {/* Link Students Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-slate-700">Vincular Aluno(s)</h3>
            <button type="button" onClick={() => setIsSearching(!isSearching)} className="text-slate-700 hover:text-indigo-600 transition-colors">
              <i className="fas fa-search text-base"></i>
            </button>
          </div>

          {(isSearching || true) && (
            <div className="bg-indigo-50/50 p-6 rounded-[2.5rem] border border-indigo-100 space-y-5 animate-fade-in shadow-sm">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">Nome Completo *</label>
                <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
                  <input 
                    type="text" 
                    value={studentSearchTerm} 
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    placeholder="Nome completo do aluno" 
                    className="w-full bg-transparent outline-none font-bold text-indigo-700 placeholder:text-indigo-300 text-sm" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-1">Ano</label>
                  <input type="text" className="w-full p-3 border border-indigo-100 rounded-2xl bg-indigo-50/30 shadow-sm outline-none text-sm" />
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-slate-400 mb-1">Turno</label>
                    <div className="relative">
                      <select className="w-full p-3 border border-indigo-100 rounded-2xl bg-indigo-50/30 shadow-sm outline-none appearance-none text-slate-400 text-sm">
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
                      <img src={s.profileImage || `data:image/png;base64,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`} alt="" className="w-8 h-8 rounded-full object-cover mr-3" />
                      <div className="flex-1 text-left">
                        <p className="text-xs font-bold">{s.name}</p>
                        <p className="text-[10px] opacity-70">{s.classroom}</p>
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
            <h4 className="text-sm font-bold text-indigo-700">Aluno(s) Vinculados</h4>
            {linkedStudents.length > 0 ? (
              linkedStudents.map(s => (
                <div key={s.id} className="bg-indigo-50/30 p-4 rounded-3xl border-2 border-red-400/50 shadow-sm flex items-center space-x-4 relative">
                  <div className="w-14 h-14 rounded-full border-2 border-emerald-400 p-0.5">
                    <img src={s.profileImage || `data:image/png;base64,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`} alt="" className="w-full h-full rounded-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h5 className="text-base font-bold text-indigo-800 leading-tight">{s.name}</h5>
                    <p className="text-xs font-bold text-indigo-600 tracking-tight">{s.classroom}</p>
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
                <p className="text-sm font-medium">Nenhum aluno vinculado ainda</p>
              </div>
            )}
          </div>
        </div>

        {/* Observations */}
        <div>
          <label className="block text-sm font-bold text-slate-600 mb-2">Observações importantes</label>
          <textarea 
            name="observations" 
            value={formData.observations} 
            onChange={handleInputChange} 
            className="w-full p-4 border border-slate-200 rounded-3xl bg-slate-50 outline-none h-32 resize-none font-medium text-sm focus:ring-2 focus:ring-indigo-500 transition-all" 
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
            <span className="text-sm">Finalizar Cadastro</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResponsibleRegistrationForm;
