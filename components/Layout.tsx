import React from 'react';
import { ViewState } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  setView: (view: ViewState) => void;
  title: string;
  showBackButton?: boolean;
  onBack?: () => void;
  onLogout?: () => void;
  isAdmin?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentView, 
  setView, 
  title, 
  showBackButton = false, 
  onBack,
  onLogout,
  isAdmin = false
}) => {
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-50 shadow-xl overflow-hidden relative font-sans text-slate-700">
      <header className="bg-indigo-600 text-white p-4 flex items-center shadow-md sticky top-0 z-20">
        {showBackButton && (
          <button onClick={onBack} className="mr-3 p-1 rounded-full hover:bg-indigo-500 transition-colors">
            <i className="fas fa-arrow-left text-lg"></i>
          </button>
        )}
        <h1 className="text-xl font-bold flex-1 truncate">{title}</h1>
        <button onClick={() => onLogout ? onLogout() : setView('LOGIN')} className="p-1 opacity-80 hover:opacity-100">
          <i className="fas fa-sign-out-alt"></i>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>

      {currentView !== 'LOGIN' && currentView !== 'USER_REGISTRATION' && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200 flex justify-around p-2 z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          <button onClick={() => setView('DASHBOARD')} className={`flex flex-col items-center space-y-1 py-1 ${currentView === 'DASHBOARD' ? 'text-indigo-600' : 'text-slate-400'}`}>
            <i className="fas fa-home text-lg"></i>
            <span className="text-[10px] font-bold">Início</span>
          </button>
          
          <button onClick={() => setView('STUDENT_LIST')} className={`flex flex-col items-center space-y-1 py-1 ${currentView === 'STUDENT_LIST' || currentView === 'STUDENT_DETAIL' ? 'text-indigo-600' : 'text-slate-400'}`}>
            <i className="fas fa-users text-lg"></i>
            <span className="text-[10px] font-bold">Alunos</span>
          </button>

          <button onClick={() => setView('ADD_OCCURRENCE')} className="flex flex-col items-center space-y-1 -mt-6">
            <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg border-4 border-white">
              <i className="fas fa-plus text-xl"></i>
            </div>
          </button>

          {isAdmin && (
            <>
              <button onClick={() => setView('REPORTS')} className={`flex flex-col items-center space-y-1 py-1 ${currentView === 'REPORTS' ? 'text-indigo-600' : 'text-slate-400'}`}>
                <i className="fas fa-chart-pie text-lg"></i>
                <span className="text-[10px] font-bold">Relatórios</span>
              </button>
              <button onClick={() => setView('USER_MANAGEMENT')} className={`flex flex-col items-center space-y-1 py-1 ${currentView === 'USER_MANAGEMENT' ? 'text-indigo-600' : 'text-slate-400'}`}>
                <i className="fas fa-user-gear text-lg"></i>
                <span className="text-[10px] font-bold">Usuários</span>
              </button>
            </>
          )}
        </nav>
      )}
    </div>
  );
};

export default Layout;