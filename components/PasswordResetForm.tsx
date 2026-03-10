
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface PasswordResetFormProps {
  userId: string;
  currentPassword: string;
  onSuccess: () => void;
  onLogout: () => void;
}

const PasswordResetForm: React.FC<PasswordResetFormProps> = ({ userId, currentPassword, onSuccess, onLogout }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (newPassword === currentPassword) {
      setError("A nova senha deve ser diferente da senha atual.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao atualizar a senha.");
      }

      onSuccess();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="bg-indigo-600 p-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-key text-white text-2xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-white">Primeiro Acesso</h2>
          <p className="text-indigo-100 mt-2">Para sua segurança, você deve redefinir sua senha padrão.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                onClick={() => setError(null)}
                className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm font-medium cursor-pointer flex items-center gap-3"
              >
                <i className="fas fa-exclamation-circle"></i>
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                Nova Senha (mín. 6 caracteres)
              </label>
              <div className="relative">
                <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-medium"
                  placeholder="Digite sua nova senha"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <i className="fas fa-check-circle absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-medium"
                  placeholder="Repita a nova senha"
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <i className="fas fa-save"></i>
                  <span>Salvar Nova Senha</span>
                </>
              )}
            </button>
            <button 
              type="button"
              onClick={onLogout}
              className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold active:scale-95 transition-all text-sm"
            >
              Sair e Alterar Depois
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default PasswordResetForm;
