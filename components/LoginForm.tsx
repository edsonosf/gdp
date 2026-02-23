
import React, { useState } from 'react';
import { User, AccessLog } from '../types';

interface LoginFormProps {
  onLogin: (user: User) => void;
  onGoToRegister: () => void;
  onRecordLog: (event: AccessLog['event'], status: AccessLog['status'], userId?: string, description?: string) => void;
  users: User[];
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onGoToRegister, onRecordLog, users }) => {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const maskCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
      .slice(0, 14);
  };

  const handleUsuarioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsuario(maskCPF(value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (usuario.length < 1 || password.length < 4) {
        alert('Por favor, preencha os dados corretamente.');
        return;
    }

    setLoading(true);
    
    // Simulação de busca no banco de dados local
    setTimeout(() => {
        const foundUser = users.find(u => u.cpf === usuario);
        
        if (!foundUser) {
            onRecordLog('user.login', 'failure', usuario, 'Tentativa com CPF não cadastrado');
            alert('Usuário não encontrado.');
            setLoading(false);
            return;
        }

        if (foundUser.status === 'Inativo') {
            onRecordLog('user.login', 'failure', foundUser.cpf, 'Tentativa com conta inativa');
            alert('Seu acesso está desativado. Por favor, contate o administrador do sistema.');
            setLoading(false);
            return;
        }

        setLoading(false);
        onLogin(foundUser);
    }, 1200);
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    setTimeout(() => {
        // Para o login google, pegamos o primeiro usuário ativo como exemplo
        const firstActiveUser = users.find(u => u.status === 'Ativo');
        if (firstActiveUser) {
          onLogin(firstActiveUser);
        } else {
          onRecordLog('user.login', 'failure', undefined, 'Tentativa de login Google sem conta ativa associada');
          alert("Nenhum usuário ativo encontrado para simulação.");
        }
        setLoading(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col min-h-full bg-white p-6 justify-center">
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-white text-3xl mb-4 shadow-lg">
          <i className="fas fa-graduation-cap"></i>
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
              placeholder=""
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
          className="text-sm text-indigo-600 font-bold hover:underline"
        >
          Não possui uma conta?
        </button>
      </div>

      <p className="mt-8 text-center text-xs text-slate-400">
        Problemas com acesso? Contate o suporte técnico escolar.
      </p>
    </div>
  );
};

export default LoginForm;