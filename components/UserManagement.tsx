
import React, { useState } from 'react';
import { User } from '../types';

interface UserManagementProps {
  users: User[];
  onToggleStatus: (userId: string) => void;
  onToggleAdmin: (userId: string) => void;
  onEdit: (user: User) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onToggleStatus, onToggleAdmin, onEdit }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.secretaria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 space-y-6 relative">
      {/* Search Bar */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
          <i className="fas fa-search"></i>
        </span>
        <input
          type="text"
          placeholder="Buscar usuários por nome ou função..."
          className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-2xl bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Stats Summary */}
      <div className="flex space-x-4">
        <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Total de Usuários</span>
            <span className="text-xl font-bold text-slate-800">{users.length}</span>
        </div>
        <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Ativos</span>
            <span className="text-xl font-bold text-green-600">{users.filter(u => u.status === 'Ativo').length}</span>
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Colaboradores Registrados</h3>
        
        {filteredUsers.length > 0 ? (
          filteredUsers.map(user => (
            <div key={user.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-fade-in">
              <div className="p-4 flex items-start space-x-4">
                <img 
                  src={user.profileImage || 'https://i.pravatar.cc/150'} 
                  alt={user.name} 
                  className={`w-14 h-14 rounded-full object-cover border-2 ${user.status === 'Ativo' ? 'border-green-100' : 'border-slate-100 opacity-60'}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className={`font-bold text-slate-800 truncate leading-tight ${user.status === 'Inativo' ? 'text-slate-400' : ''}`}>
                        {user.name}
                    </h4>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      user.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {user.status}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-600 font-semibold mt-0.5">{user.role}</p>
                  <p className="text-[10px] text-slate-500 mt-1 italic">{user.lotacao}</p>
                </div>
              </div>
              
              <div className="bg-slate-50 px-4 py-3 flex justify-between items-center border-t border-slate-100">
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-400 uppercase font-bold">Matrícula</span>
                  <span className="text-[11px] text-slate-700 font-mono">{user.matricula}</span>
                </div>
                
                <div className="flex space-x-2">
                  <button 
                    title="Editar Usuário"
                    onClick={() => onEdit(user)}
                    className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                  >
                    <i className="fas fa-edit text-xs"></i>
                  </button>

                  <button 
                    title="Permissões Administrativas"
                    className={`w-8 h-8 rounded-full border transition-all flex items-center justify-center ${
                      user.isSystemAdmin 
                        ? 'bg-green-600 border-green-700 text-white shadow-inner' 
                        : 'bg-white border-slate-200 text-slate-400 hover:bg-green-50 hover:text-green-600 hover:border-green-200'
                    }`}
                    onClick={() => onToggleAdmin(user.id)}
                  >
                    <i className="fas fa-shield-halved text-xs"></i>
                  </button>

                  <button 
                    title={user.status === 'Ativo' ? "Desativar" : "Ativar"}
                    onClick={() => onToggleStatus(user.id)}
                    className={`w-8 h-8 rounded-full bg-white border flex items-center justify-center transition-colors ${
                      user.status === 'Ativo' 
                        ? 'border-red-100 text-red-500 hover:bg-red-50' 
                        : 'border-green-100 text-green-500 hover:bg-green-50'
                    }`}
                  >
                    <i className={`fas ${user.status === 'Ativo' ? 'fa-user-slash' : 'fa-user-check'} text-xs`}></i>
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-slate-200">
            <i className="fas fa-user-magnifying-glass text-slate-100 text-5xl mb-3"></i>
            <p className="text-slate-400 text-sm">Nenhum usuário encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
