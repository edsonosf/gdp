
import React, { useState, useRef } from 'react';
import { AccessLog, User, Option, LocalUnitOption } from '../types';

interface VisualIdentityProps {
  onRecordLog?: (event: AccessLog['event'], status: AccessLog['status'], userId?: string, description?: string) => void;
  currentUser?: User | null;
  localUnits: LocalUnitOption[];
  organizationalChart: Option[];
}

const VisualIdentity: React.FC<VisualIdentityProps> = ({ onRecordLog, currentUser, localUnits, organizationalChart }) => {
  const [unidadeMunicipal, setUnidadeMunicipal] = useState('');
  const [unidadeTrabalho, setUnidadeTrabalho] = useState('');
  const [unidadeSelecionada, setUnidadeSelecionada] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados para Identidade Visual
  const [leftLogo, setLeftLogo] = useState<string | null>(null);
  const [rightLogo, setRightLogo] = useState<string | null>(null);
  const [showHeaderText, setShowHeaderText] = useState(false);
  const [showFooterDivider, setShowFooterDivider] = useState(false);
  const [showFooterText, setShowFooterText] = useState(false);
  
  const leftLogoRef = useRef<HTMLInputElement>(null);
  const rightLogoRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/visual-identity');
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setUnidadeSelecionada(data.useVisualIdentity);
            setLeftLogo(data.leftLogo);
            setRightLogo(data.rightLogo);
            setShowHeaderText(data.showHeaderText);
            setShowFooterDivider(data.showFooterDivider);
            setShowFooterText(data.showFooterText);
            
            // Try to find the unit and set the selects
            if (data.unitId) {
              const unit = localUnits.find(u => u.id === data.unitId);
              if (unit) {
                const org = organizationalChart.find(o => o.id === unit.organizationChartId);
                if (org) {
                  setUnidadeMunicipal(org.value);
                  setUnidadeTrabalho(unit.value);
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("Error fetching visual identity settings:", err);
      }
    };
    fetchSettings();
  }, [localUnits, organizationalChart]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleApplyVisualIdentity = async () => {
    setLoading(true);
    
    let unitId = null;
    if (unidadeMunicipal && unidadeTrabalho) {
      const unit = localUnits.find(u => u.value === unidadeTrabalho);
      unitId = unit?.id;
    }

    const settings = {
      useVisualIdentity: unidadeSelecionada,
      unitId,
      leftLogo,
      rightLogo,
      showHeaderText,
      showFooterDivider,
      showFooterText,
      headerText: unidadeTrabalho || unidadeMunicipal,
      useFooter: showFooterDivider || showFooterText
    };

    try {
      const res = await fetch('/api/visual-identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (res.ok) {
        if (onRecordLog) onRecordLog('critical.action', 'success', undefined, 'Identidade visual da unidade aplicada.');
        alert("Identidade Visual aplicada com sucesso! Os relatórios agora utilizarão as novas definições de cabeçalho e rodapé.");
      } else {
        throw new Error("Falha ao salvar configurações");
      }
    } catch (err) {
      console.error("Error saving visual identity settings:", err);
      alert("Erro ao aplicar identidade visual.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-6 pb-24 animate-fade-in text-slate-700">
      <div className="flex items-center space-x-3 mb-2">
        <div className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
          <i className="fas fa-palette text-sm"></i>
        </div>
        <div>
          <h2 className="text-sm font-black text-slate-800">Identidade Visual | Relatórios</h2>
        </div>
      </div>

      {/* Configuração de Unidade de Trabalho */}
      <section className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">       
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Nome Unidade *</label>
            <select 
              value={unidadeMunicipal}
              onChange={(e) => {
                setUnidadeMunicipal(e.target.value);
                setUnidadeTrabalho('');
              }}
              className="text-xs w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Selecione a unidade municipal</option>
              {organizationalChart.map(opt => (
                <option key={opt.id} value={opt.value}>{opt.value}</option>
              ))}
            </select>
          </div>

          {unidadeMunicipal && (
            <div className="animate-fade-in">
              <label className="block text-sm font-bold text-slate-600 mb-2 ml-1">Unidade de Trabalho *</label>
              <select 
                value={unidadeTrabalho}
                onChange={(e) => setUnidadeTrabalho(e.target.value)}
                className="text-xs w-full p-3 border border-indigo-200 rounded-xl bg-indigo-50 text-sm font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Selecione a Unidade</option>
                {localUnits
                  .filter(o => {
                    const org = organizationalChart.find(org => org.value === unidadeMunicipal);
                    if (!org) return false;
                    return o.organizationChartId === org.id;
                  })
                  .map(opt => (
                    <option key={opt.id} value={opt.value}>{opt.value}</option>
                  ))
                }
              </select>
            </div>
          )}

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 transition-all">
            <div>
              <span className="block text-sm font-bold text-slate-700">Selecionar</span>
            </div>
            <button 
              onClick={() => {
                if (!unidadeMunicipal) {
                  alert("Por favor, selecione uma unidade municipal primeiro.");
                  return;
                }
                setUnidadeSelecionada(!unidadeSelecionada);
              }}
              className={`text-xs w-12 h-6 rounded-full transition-all relative ${unidadeSelecionada ? 'bg-indigo-600' : 'bg-slate-300'}`}
            >
              <div className={`text-xs absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${unidadeSelecionada ? 'right-1' : 'left-1'}`}></div>
            </button>
          </div>
        </div>
      </section>

      {/* Identidade Visual */}
      <section className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-6">
       
        
        {/* Cabeçalho de Documentos */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-50">
            <i className="text-sm fas fa-heading text-indigo-600 "></i>
            <h4 className="text-sm font-bold text-slate-700">Cabeçalho de Documentos</h4>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-bold text-slate-500 mb-2 ml-1">Anexar Logo</label>
              <div 
                onClick={() => leftLogoRef.current?.click()}
                className="text-sm relative w-full aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50/50 hover:border-indigo-200 transition-all overflow-hidden"
              >
                {leftLogo ? (
                  <img src={leftLogo} alt="Logo esquerdo" className="w-full h-full object-contain p-2" />
                ) : (
                  <>
                    <i className="fas fa-image text-slate-300 text-2xl mb-1"></i>
                    <span className="text-sm font-bold text-slate-500 text-center px-4">Anexar Imagem (LE)</span>
                  </>
                )}
              </div>
              <p className="text-sm font-bold text-slate-400 mt-1 ml-1 font-medium italic">Essa imagem Alinhada [Lado Esquerdo dos Relatórios]</p>
              <input type="file" ref={leftLogoRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setLeftLogo)} />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 transition-all">
              <div>
                <span className="block text-xs font-bold text-slate-700">Exibir texto no Cabeçalho</span>
              </div>
              <button 
                onClick={() => setShowHeaderText(!showHeaderText)}
                className={`w-12 h-6 rounded-full transition-all relative ${showHeaderText ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showHeaderText ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-500 mb-2 ml-1">Logo da Sub-unidade</label>
              <div 
                onClick={() => rightLogoRef.current?.click()}
                className="relative w-full aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50/50 hover:border-indigo-200 transition-all overflow-hidden"
              >
                {rightLogo ? (
                  <img src={rightLogo} alt="Logo LD" className="w-full h-full object-contain p-2" />
                ) : (
                  <>
                    <i className="fas fa-image text-sm font-bold text-slate-500 text-2xl mb-1"></i>
                    <span className="text-sm font-bold text-slate-500 text-center px-4">Anexar Imagem (LD)</span>
                  </>
                )}
              </div>
              <p className="text-sm text-slate-400 mt-1 ml-1 font-medium">Essa imagem será alinhada do lado direito dos relatórios</p>
              <input type="file" ref={rightLogoRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setRightLogo)} />
            </div>
          </div>
        </div>

        {/* Rodapé de Documentos */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-50">
            <i className="fas fa-shoe-prints text-indigo-600 text-sm"></i>
            <h4 className="text-sm font-bold text-slate-700">Rodapé</h4>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 transition-all">
              <div>
                <span className="block text-sm font-bold text-slate-700">Linha Divisória do Rodapé</span>
              </div>
              <button 
                onClick={() => setShowFooterDivider(!showFooterDivider)}
                className={`w-12 h-6 rounded-full transition-all relative ${showFooterDivider ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showFooterDivider ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 transition-all">
              <div>
                <span className="block text-sm font-bold text-slate-700">Exibir o Rodapé [Endereço]</span>
              </div>
              <button 
                onClick={() => setShowFooterText(!showFooterText)}
                className={`w-12 h-6 rounded-full transition-all relative ${showFooterText ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showFooterText ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>

            <button 
              onClick={handleApplyVisualIdentity}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-100 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
            >
              <i className="fas fa-palette"></i>
              <span>Aplicar</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default VisualIdentity;
