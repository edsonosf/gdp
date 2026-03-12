
import React, { useState } from 'react';
import { User, AccessLog } from '../types';

interface LoginFormProps {
  onLogin: (user: User, passwordUsed: string) => void;
  onGoToRegister: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onGoToRegister }) => {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const maskCPF = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 11 && /^\d+$/.test(value.replace(/[.-]/g, ''))) {
        return digits
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d{1,2})/, '$1-$2')
          .slice(0, 14);
    }
    return value;
  };

  const handleUsuarioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Se for apenas números ou formato de CPF, aplica a máscara. 
    // Caso contrário (e-mail), deixa digitar livremente.
    if (/^[\d.-]*$/.test(value)) {
        setUsuario(maskCPF(value));
    } else {
        setUsuario(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    
    if (usuario.length < 1 || password.length < 4) {
        setErrorMessage('Por favor, preencha os dados corretamente.');
        return;
    }

    setLoading(true);
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                usuario, 
                password,
                deviceInfo: {
                    userAgent: navigator.userAgent,
                    platform: navigator.platform
                }
            })
        });

        const data = await response.json();

        if (response.ok) {
            onLogin(data, password);
        } else {
            setErrorMessage(data.error || 'Erro ao realizar login.');
        }
    } catch (err) {
        console.error("Login error:", err);
        setErrorMessage('Falha ao conectar com o servidor.');
    } finally {
        setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setErrorMessage("O login via Google não está configurado para este ambiente. Utilize CPF e Senha.");
  };

  return (
    <div className="flex flex-col min-h-full bg-white p-6 justify-center relative">
      {/* Error Message Banner */}
      {errorMessage && (
        <div 
          onClick={() => setErrorMessage(null)}
          className="absolute top-4 left-6 right-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl cursor-pointer z-50 animate-bounce shadow-md flex items-center justify-between"
        >
          <span className="text-sm font-medium">{errorMessage}</span>
          <i className="fas fa-times text-xs opacity-50"></i>
        </div>
      )}

      <div className="text-center mb-10">
        <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center text-white text-3xl mb-4 shadow-lg">
          
          <img src="data:image/png;base64,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" alt="icon diciplina" />

        </div>
        <h1 className="text-2xl font-bold text-slate-800">GDP</h1>
        <p className="text-slate-500">Gestão Disciplinar e Pedagógica</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Usuário</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <i className="fas fa-id-card"></i>
            </span>
            <input
              type="text"
              placeholder="Digite seu usuário"
              className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
              value={usuario}
              onChange={handleUsuarioChange}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <i className="fas fa-lock"></i>
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder=""
              className="block w-full pl-10 pr-12 py-3 border border-slate-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-indigo-600 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center disabled:bg-indigo-400"
        >
          {loading ? (
            <i className="fas fa-circle-notch fa-spin mr-2"></i>
          ) : 'Entrar no Sistema'}
        </button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-slate-500 uppercase font-bold tracking-tighter">ou</span>
        </div>
      </div>

      <button
        onClick={handleGoogleLogin}
        className="w-full border border-slate-300 bg-white text-slate-700 py-3 rounded-xl font-medium flex items-center justify-center space-x-3 hover:bg-slate-50 active:scale-[0.98] transition-all"
      >
        <img src="https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png" alt="Google" className="w-5 h-5" />
        <span>Entrar com conta Google</span>
      </button>

      <div className="mt-8 text-center">
        <br />
        <button 
          onClick={onGoToRegister}
          className="text-sm font-bold text-slate-500 transition-colors duration-300 hover:text-blue-500 cursor-pointer "
        >
          Não possui uma conta?
        </button>
      </div>

      <p className="mt-8 text-center text-xs text-slate-400">
        Problemas com acesso? Contate o suporte.
      </p>
    </div>
  );
};

export default LoginForm;