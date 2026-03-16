
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
        <div className="w-65 h-30 mx-auto flex items-center justify-center text-white text-3xl mb-4">
          
          <img src="data:image/png;base64,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" alt="icon diciplina" />

        </div>
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