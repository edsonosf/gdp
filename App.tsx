
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Student, Occurrence, ViewState, User, AccessLog } from './types';
import { INITIAL_STUDENTS, INITIAL_OCCURRENCES, DEFAULT_STUDENT_IMAGE } from './constants';
import Layout from './components/Layout';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import StudentDetail from './components/StudentDetail';
import OccurrenceForm from './components/OccurrenceForm';
import UserRegistrationForm from './components/UserRegistrationForm';
import UserManagement from './components/UserManagement';
import Reports from './components/Reports';
import UserEditForm from './components/UserEditForm';
import StudentRegistrationForm from './components/StudentRegistrationForm';
import PendingOccurrences from './components/PendingOccurrences';
import SystemManagement from './components/SystemManagement';
import OccurrenceMonitoring from './components/OccurrenceMonitoring';
import NewOccurrenceMessage from './components/NewOccurrenceMessage';
import IndividualReportSearch from './components/IndividualReportSearch';
import StudentDefense from './components/StudentDefense';
import Formalization from './components/Formalization';

const MOCK_USERS: User[] = [
  {
    id: 'u_user_request',
    name: 'Administrador',
    role: 'Administrador do Systema',
    email: 'administrador@adm.com.br',
    cpf: '123.456.789-00',
    status: 'Ativo',
    secretaria: 'Secretaria de Educação',
    lotacao: 'Escola Cívico-Militar Rodolfo Teófilo',
    matricula: '102030',
    phone: '85996904763',
    profileImage: 'https://i.pravatar.cc/150?u=gestor',
    isSystemAdmin: true
  },
  {
    id: 'u1',
    name: 'Edson Oliveira dos Santos Filho',
    role: 'Coordenador Pedagógico',
    email: 'edson.oliveira@escola.ce.gov.br',
    cpf: '408.570.853-87',
    status: 'Ativo',
    secretaria: 'Secretaria de Educação',
    lotacao: 'Escola Cívico-Militar Rodolfo Teófilo',
    matricula: '45678',
    phone: '85996904763',
    profileImage: 'https://i.pravatar.cc/150?u=edson',
    isSystemAdmin: true
  }
];

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('LOGIN');
  const [students, setStudents] = useState<Student[]>([]);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadOccurrenceIds, setUnreadOccurrenceIds] = useState<string[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Helper para inferir dispositivo
  const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    let type: 'mobile' | 'tablet' | 'desktop' = 'desktop';
    if (/tablet|ipad|playbook|silk/i.test(ua)) type = 'tablet';
    else if (/Mobile|Android|iP(hone|od)/.test(ua)) type = 'mobile';

    let os = 'Unknown';
    if (ua.indexOf('Win') !== -1) os = 'Windows';
    else if (ua.indexOf('Mac') !== -1) os = 'MacOS';
    else if (ua.indexOf('Linux') !== -1) os = 'Linux';
    else if (ua.indexOf('Android') !== -1) os = 'Android';
    else if (ua.indexOf('like Mac') !== -1) os = 'iOS';

    let browser = 'Unknown';
    if (ua.indexOf('Chrome') !== -1) browser = 'Chrome';
    else if (ua.indexOf('Firefox') !== -1) browser = 'Firefox';
    else if (ua.indexOf('Safari') !== -1) browser = 'Safari';
    else if (ua.indexOf('Edge') !== -1) browser = 'Edge';

    return { type, os, browser };
  };

  // Inicialização do Banco de Dados via API
  useEffect(() => {
    const fetchData = async () => {
      setIsInitialLoading(true);
      setApiError(null);
      try {
        const [studentsRes, occurrencesRes, usersRes] = await Promise.all([
          fetch('/api/students'),
          fetch('/api/occurrences'),
          fetch('/api/users')
        ]);

        if (!studentsRes.ok || !occurrencesRes.ok || !usersRes.ok) {
          throw new Error("Falha ao conectar com o servidor. Verifique se o banco de dados está configurado.");
        }

        setStudents(await studentsRes.json());
        setOccurrences(await occurrencesRes.json());
        
        const usersList = await usersRes.json();
        setUsers(usersList);
        
        // Verificar Sessão
        const savedCurrentUser = localStorage.getItem('educontrol_current_user');
        if (savedCurrentUser) {
          const user = JSON.parse(savedCurrentUser);
          const freshUser = usersList.find((u: User) => u.id === user.id);
          
          if (freshUser && freshUser.status === 'Ativo') {
            setCurrentUser(freshUser);
            setView('DASHBOARD');
          } else {
            localStorage.removeItem('educontrol_current_user');
            setView('LOGIN');
          }
        }
      } catch (err) {
        console.error("Failed to fetch data from API:", err);
        setApiError((err as Error).message);
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchData();

    // 4. Notificações (IDs das ocorrências não lidas ainda no localStorage por simplicidade)
    const savedUnread = localStorage.getItem('educontrol_unread_ids');
    if (savedUnread) {
      setUnreadOccurrenceIds(JSON.parse(savedUnread));
    }
  }, []);

  const recordLog = useCallback(async (event: AccessLog['event'], status: AccessLog['status'], userId?: string, description?: string) => {
    const newLog: AccessLog = {
      timestamp: new Date().toISOString(),
      user_id: userId || currentUser?.cpf || 'anonymous',
      event,
      status,
      description,
      ip_address: '192.168.1.' + Math.floor(Math.random() * 255), // Mock IP
      user_agent: navigator.userAgent,
      device_info: getDeviceInfo()
    };
    
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog)
      });
    } catch (err) {
      console.error("Failed to record log:", err);
    }
  }, [currentUser]);

  // Efeitos de Persistência Geral (Removidos pois agora usamos API)
  useEffect(() => {
    localStorage.setItem('educontrol_unread_ids', JSON.stringify(unreadOccurrenceIds));
  }, [unreadOccurrenceIds]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('educontrol_current_user', JSON.stringify(user));
    recordLog('user.login', 'success', user.cpf);
    setView('DASHBOARD');
  };

  const handleLogout = useCallback(() => {
    recordLog('user.logout', 'success');
    localStorage.removeItem('educontrol_current_user');
    setCurrentUser(null);
    setView('LOGIN');
  }, [recordLog]);

  const handleRegisterUser = async (userData: Omit<User, 'id' | 'status'>) => {
    const newUser: User = {
      ...userData,
      id: crypto.randomUUID(),
      status: 'Inativo'
    };
    
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      
      if (res.ok) {
        setUsers(prev => [...prev, newUser]);
        recordLog('critical.action', 'success', userData.cpf, 'Novo cadastro de colaborador realizado');
        alert('Cadastro realizado com sucesso! Sua conta está "Desativada" e aguarda ativação pelo administrador.');
        setView('LOGIN');
      } else {
        const errorData = await res.json();
        alert(`Erro ao realizar cadastro: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (err) {
      console.error("Failed to register user:", err);
      alert("Erro ao realizar cadastro.");
    }
  };

  const handleRegisterStudent = async (studentData: Omit<Student, 'id'>) => {
    const newStudent: Student = {
      ...studentData,
      id: crypto.randomUUID()
    };
    
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent)
      });
      
      if (res.ok) {
        setStudents(prev => [...prev, newStudent]);
        recordLog('critical.action', 'success', undefined, `Cadastro de aluno: ${studentData.name}`);
        alert('Aluno cadastrado com sucesso no banco de dados!');
        setView('STUDENT_LIST');
      }
    } catch (err) {
      console.error("Failed to register student:", err);
      alert("Erro ao cadastrar aluno.");
    }
  };

  const handleAddOccurrence = async (newOcc: Omit<Occurrence, 'id'>) => {
    const occurrenceWithId: Occurrence = { ...newOcc, id: crypto.randomUUID() };
    
    try {
      const res = await fetch('/api/occurrences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(occurrenceWithId)
      });
      
      if (res.ok) {
        setOccurrences(prev => [occurrenceWithId, ...prev]);
        setUnreadOccurrenceIds(prev => [...prev, occurrenceWithId.id]);
        recordLog('critical.action', 'success', undefined, `Nova ocorrência registrada para aluno ID: ${newOcc.studentId}`);
        setView('DASHBOARD');
        alert('Ocorrência registrada! Notificação enviada aos administradores.');
      }
    } catch (err) {
      console.error("Failed to add occurrence:", err);
      alert("Erro ao registrar ocorrência.");
    }
  };

  const handleResolveOccurrence = async (id: string) => {
    try {
      const res = await fetch(`/api/occurrences/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Resolvida' })
      });
      
      if (res.ok) {
        setOccurrences(prev => prev.map(occ => 
          occ.id === id ? { ...occ, status: 'Resolvida' as const } : occ
        ));
        alert("Ocorrência marcada como resolvida!");
      }
    } catch (err) {
      console.error("Failed to resolve occurrence:", err);
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
    const userToToggle = users.find(u => u.id === userId);
    if (!userToToggle) return;
    
    const newStatus = userToToggle.status === 'Ativo' ? 'Inativo' : 'Ativo';
    const updatedUser = { ...userToToggle, status: newStatus };
    
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      });
      
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
        recordLog('critical.action', 'success', undefined, `Status alterado para usuário: ${userToToggle.name}`);
      }
    } catch (err) {
      console.error("Failed to toggle user status:", err);
    }
  };

  const handleToggleAdmin = async (userId: string) => {
    const userToToggle = users.find(u => u.id === userId);
    if (!userToToggle) return;
    
    const updatedUser = { ...userToToggle, isSystemAdmin: !userToToggle.isSystemAdmin };
    
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      });
      
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
        recordLog('critical.action', 'success', undefined, `Permissão admin alterada para usuário: ${userToToggle.name}`);
      }
    } catch (err) {
      console.error("Failed to toggle admin status:", err);
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      const res = await fetch(`/api/users/${updatedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      });
      
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        if (currentUser?.id === updatedUser.id) {
            setCurrentUser(updatedUser);
            localStorage.setItem('educontrol_current_user', JSON.stringify(updatedUser));
        }
        recordLog('critical.action', 'success', undefined, `Perfil de usuário atualizado: ${updatedUser.name}`);
        
        if (view === 'MY_PROFILE') {
          setView('DASHBOARD');
        } else {
          setView('USER_MANAGEMENT');
        }
        alert('Dados atualizados com sucesso!');
      }
    } catch (err) {
      console.error("Failed to update user:", err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm("ATENÇÃO: Deseja realmente excluir permanentemente este colaborador? Esta ação não pode ser desfeita.")) {
      try {
        const res = await fetch(`/api/users/${userId}`, {
          method: 'DELETE'
        });
        
        if (res.ok) {
          setUsers(prev => prev.filter(u => u.id !== userId));
          
          if (currentUser?.id === userId) {
            recordLog('user.logout', 'success', userId, 'Usuário excluiu a própria conta');
            localStorage.removeItem('educontrol_current_user');
            setCurrentUser(null);
            setView('LOGIN');
          } else {
            recordLog('critical.action', 'success', undefined, `Colaborador excluído: ${userId}`);
            setView('USER_MANAGEMENT');
          }
          alert('Colaborador removido do sistema.');
        }
      } catch (err) {
        console.error("Failed to delete user:", err);
      }
    }
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (confirm(`ATENÇÃO: Deseja realmente excluir permanentemente o aluno ${studentName}? Esta ação excluirá também todas as ocorrências vinculadas a ele e não pode ser desfeita.`)) {
      try {
        const res = await fetch(`/api/students/${studentId}`, {
          method: 'DELETE'
        });
        
        if (res.ok) {
          setStudents(prev => prev.filter(s => s.id !== studentId));
          setOccurrences(prev => prev.filter(occ => occ.studentId !== studentId));
          recordLog('critical.action', 'success', undefined, `Aluno excluído: ${studentName} (${studentId})`);
          alert('Aluno e suas ocorrências foram removidos do sistema.');
        }
      } catch (err) {
        console.error("Failed to delete student:", err);
        alert("Erro ao excluir aluno.");
      }
    }
  };

  const handleUpdateStudent = async (updatedStudent: Student) => {
    try {
      const res = await fetch(`/api/students/${updatedStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedStudent)
      });
      
      if (res.ok) {
        setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
        recordLog('critical.action', 'success', undefined, `Dados do aluno atualizados: ${updatedStudent.name}`);
        setView('STUDENT_LIST');
        alert('Dados do aluno atualizados com sucesso!');
      }
    } catch (err) {
      console.error("Failed to update student:", err);
      alert("Erro ao atualizar dados do aluno.");
    }
  };

  const handleMarkAsRead = (id: string) => {
    const remaining = unreadOccurrenceIds.filter(unreadId => unreadId !== id);
    setUnreadOccurrenceIds(remaining);
    if (remaining.length === 0) {
      setView('DASHBOARD');
    }
  };

  // Encontrar o usuário inativo mais recente para o dashboard
  const latestInactiveUser = useMemo(() => {
    const inactiveOnes = users.filter(u => u.status === 'Inativo');
    if (inactiveOnes.length === 0) return null;
    // Assume que IDs maiores (Date.now()) são mais recentes
    return [...inactiveOnes].sort((a, b) => b.id.localeCompare(a.id))[0];
  }, [users]);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.grade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderContent = () => {
    if (isInitialLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-bold text-slate-600">Carregando dados do sistema...</p>
        </div>
      );
    }

    if (apiError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 text-2xl">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Erro de Conexão</h2>
          <p className="text-sm text-slate-500 mb-6">{apiError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all"
          >
            Tentar Novamente
          </button>
        </div>
      );
    }

    const isAdminView = ['REPORTS', 'USER_MANAGEMENT', 'EDIT_USER', 'ADD_STUDENT', 'PENDING_OCCURRENCES', 'SYSTEM_MANAGEMENT', 'NEW_OCCURRENCE_MESSAGE', 'INDIVIDUAL_REPORT_SEARCH', 'STUDENT_DEFENSE', 'FORMALIZATION'].includes(view);
    // Note: Restricted access only to users with administrative privileges
    if (isAdminView && !currentUser?.isSystemAdmin) {
      setView('DASHBOARD');
      return null;
    }

    switch (view) {
      case 'LOGIN':
        return <LoginForm users={users} onLogin={handleLogin} onGoToRegister={() => setView('USER_REGISTRATION')} onRecordLog={recordLog} />;
      case 'USER_REGISTRATION':
        return <UserRegistrationForm onBack={() => setView('LOGIN')} onRegister={handleRegisterUser} />;
      case 'DASHBOARD':
        return <Dashboard 
          students={students} 
          occurrences={occurrences} 
          isAdmin={currentUser?.isSystemAdmin}
          hasNewMessage={unreadOccurrenceIds.length > 0 && !!currentUser?.isSystemAdmin}
          onOpenMessages={() => {
            setView('NEW_OCCURRENCE_MESSAGE');
          }}
          onSelectStudent={(s) => { setSelectedStudent(s); setView('STUDENT_DETAIL'); }} 
          onAddStudent={() => currentUser?.isSystemAdmin ? setView('ADD_STUDENT') : alert("Acesso negado.")}
          onAddOccurrence={() => setView('ADD_OCCURRENCE')}
          onAnalyzeOccurrences={() => currentUser?.isSystemAdmin ? setView('PENDING_OCCURRENCES') : alert("Acesso negado.")}
          onSystemManagement={() => setView('SYSTEM_MANAGEMENT')}
          onViewMonitoring={() => setView('OCCURRENCE_MONITORING')}
          onNavigate={setView}
          newRegisteredUser={latestInactiveUser}
        />;
      case 'NEW_OCCURRENCE_MESSAGE':
        const nextId = unreadOccurrenceIds[0];
        const occurrence = occurrences.find(o => o.id === nextId) || null;
        const student = occurrence ? students.find(s => s.id === occurrence.studentId) || null : null;
        return <NewOccurrenceMessage 
          occurrence={occurrence} 
          student={student} 
          occurrences={occurrences}
          onBack={() => nextId ? handleMarkAsRead(nextId) : setView('DASHBOARD')} 
        />;
      case 'OCCURRENCE_MONITORING':
        return (
          <OccurrenceMonitoring 
            currentUser={currentUser} 
            occurrences={occurrences} 
            students={students} 
            onResolve={handleResolveOccurrence}
            onSelectStudent={(s) => { setSelectedStudent(s); setView('STUDENT_DETAIL'); }}
          />
        );
      case 'PENDING_OCCURRENCES':
        return (
          <PendingOccurrences 
            students={students} 
            occurrences={occurrences} 
            initialAnalyzingStudent={selectedStudent}
            onStartAnalysis={(s) => setSelectedStudent(s)}
            onSelectStudent={(s) => { setSelectedStudent(s); setView('STUDENT_DETAIL'); }} 
            onNavigate={(v, s) => { setSelectedStudent(s); setView(v); }}
          />
        );
      case 'SYSTEM_MANAGEMENT':
        return <SystemManagement onRecordLog={recordLog} />;
      case 'STUDENT_LIST':
        return (
          <div className="p-4 space-y-4 relative min-h-full">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><i className="fas fa-search"></i></span>
              <input type="text" placeholder="Buscar por nome ou turma..." className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-2xl bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="space-y-3 pb-20">
              {filteredStudents.map(student => (
                <div key={student.id} className="flex items-center space-x-2">
                  <button onClick={() => { setSelectedStudent(student); setView('STUDENT_DETAIL'); }} className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4 hover:border-indigo-300 transition-all active:scale-[0.98]">
                    <img src={student.profileImage || DEFAULT_STUDENT_IMAGE} alt={student.name} className="w-12 h-12 rounded-full object-cover border-border-slate-100" />
                    <div className="flex-1 text-left">
                      <h3 className="font-bold text-slate-800">{student.name}</h3>
                      <p className="text-xs text-slate-500 font-medium">{student.grade} - {student.classroom}</p>
                    </div>
                    <i className="fas fa-chevron-right text-slate-300"></i>
                  </button>
                  {currentUser?.isSystemAdmin && (
                    <div className="flex flex-col space-y-1">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudent(student);
                          setView('EDIT_STUDENT');
                        }}
                        className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center hover:bg-indigo-100 transition-colors active:scale-90"
                        title="Editar Aluno"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStudent(student.id, student.name);
                        }}
                        className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-100 transition-colors active:scale-90"
                        title="Excluir Aluno"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {currentUser?.isSystemAdmin && (
              <button 
                onClick={() => setView('ADD_STUDENT')}
                className="fixed bottom-24 right-4 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center text-xl z-30 active:scale-90 transition-transform"
              >
                <i className="fas fa-user-plus"></i>
              </button>
            )}
          </div>
        );
      case 'STUDENT_DETAIL':
        return selectedStudent ? <StudentDetail student={selectedStudent} occurrences={occurrences} /> : null;
      case 'STUDENT_DEFENSE':
        return selectedStudent ? <StudentDefense student={selectedStudent} onBack={() => setView('PENDING_OCCURRENCES')} /> : null;
      case 'FORMALIZATION':
        return selectedStudent ? <Formalization student={selectedStudent} onBack={() => setView('PENDING_OCCURRENCES')} /> : null;
      case 'ADD_STUDENT':
        return <StudentRegistrationForm students={students} onBack={() => setView('STUDENT_LIST')} onRegister={handleRegisterStudent} />;
      case 'EDIT_STUDENT':
        return (
          <StudentRegistrationForm 
            students={students} 
            initialData={selectedStudent || undefined}
            onBack={() => setView('STUDENT_LIST')} 
            onRegister={(data) => handleUpdateStudent(data as Student)} 
            onDelete={handleDeleteStudent}
          />
        );
      case 'ADD_OCCURRENCE':
        return <OccurrenceForm students={students} occurrences={occurrences} currentUser={currentUser} onSave={handleAddOccurrence} />;
      case 'USER_MANAGEMENT':
        return <UserManagement users={users} onToggleStatus={handleToggleUserStatus} onToggleAdmin={handleToggleAdmin} onEdit={(u) => { setEditingUser(u); setView('EDIT_USER'); }} />;
      case 'EDIT_USER':
        return editingUser ? <UserEditForm user={editingUser} occurrences={occurrences} onBack={() => setView('USER_MANAGEMENT')} onSuccess={handleUpdateUser} onDelete={handleDeleteUser} showAdminToggle={true} /> : null;
      case 'MY_PROFILE':
        return currentUser ? <UserEditForm user={currentUser} occurrences={occurrences} onBack={() => setView('DASHBOARD')} onSuccess={handleUpdateUser} onDelete={handleDeleteUser} showAdminToggle={false} /> : null;
      case 'REPORTS':
        return <Reports occurrences={occurrences} students={students} onIndividualReportSearch={() => setView('INDIVIDUAL_REPORT_SEARCH')} />;
      case 'INDIVIDUAL_REPORT_SEARCH':
        return <IndividualReportSearch students={students} onSelectStudent={(s) => { setSelectedStudent(s); setView('STUDENT_DETAIL'); }} />;
      default:
        return <div>Em breve...</div>;
    }
  };

  const getTitle = () => {
    switch (view) {
      case 'DASHBOARD': return `Início | ${currentUser?.name || 'Visitante'}`;
      case 'STUDENT_LIST': return 'Lista de Alunos';
      case 'STUDENT_DETAIL': return 'Histórico do Aluno';
      case 'ADD_STUDENT': return 'Cadastro de Aluno';
      case 'EDIT_STUDENT': return 'Editar Cadastro';
      case 'ADD_OCCURRENCE': return 'Nova Ocorrência';
      case 'USER_REGISTRATION': return 'Cadastro de Sistema';
      case 'USER_MANAGEMENT': return 'Gestão de Colaboradores';
      case 'REPORTS': return 'Relatórios Acadêmicos';
      case 'PENDING_OCCURRENCES': return 'Análise de Ocorrências';
      case 'SYSTEM_MANAGEMENT': return 'Gerenciamento do Sistema';
      case 'OCCURRENCE_MONITORING': return 'Acompanhamento de Ocorrências';
      case 'NEW_OCCURRENCE_MESSAGE': return 'Nova Ocorrência Registrada';
      case 'INDIVIDUAL_REPORT_SEARCH': return 'Relatório Individual - Pesquisa';
      case 'STUDENT_DEFENSE': return 'Defesa do Aluno';
      case 'FORMALIZATION': return 'Formalização e Validação';
      case 'EDIT_USER': return 'Editar Perfil';
      case 'MY_PROFILE': return 'Meu Perfil';
      default: return 'GDP';
    }
  };

  // Fix: Unified back navigation logic to resolve JSX complexity and parsing errors
  const handleBack = useCallback(() => {
    if (view === 'EDIT_USER') {
      setView('USER_MANAGEMENT');
    } else if (view === 'MY_PROFILE') {
      setView('DASHBOARD');
    } else if (view === 'ADD_STUDENT' || view === 'EDIT_STUDENT') {
      setView('STUDENT_LIST');
    } else if (view === 'STUDENT_DEFENSE' || view === 'FORMALIZATION') {
      setView('PENDING_OCCURRENCES');
    } else if (['PENDING_OCCURRENCES', 'SYSTEM_MANAGEMENT', 'OCCURRENCE_MONITORING', 'NEW_OCCURRENCE_MESSAGE', 'INDIVIDUAL_REPORT_SEARCH'].includes(view)) {
      setSelectedStudent(null);
      setView('DASHBOARD');
    } else {
      setView('DASHBOARD');
    }
  }, [view]);

  if (view === 'LOGIN' || view === 'USER_REGISTRATION') return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-50 shadow-xl overflow-hidden overflow-y-auto">
      {renderContent()}
    </div>
  );

  return (
    <Layout 
      currentView={view} 
      setView={setView} 
      title={getTitle()} 
      isAdmin={currentUser?.isSystemAdmin} 
      showBackButton={['STUDENT_LIST', 'STUDENT_DETAIL', 'ADD_OCCURRENCE', 'USER_MANAGEMENT', 'REPORTS', 'EDIT_USER', 'ADD_STUDENT', 'EDIT_STUDENT', 'PENDING_OCCURRENCES', 'SYSTEM_MANAGEMENT', 'OCCURRENCE_MONITORING', 'NEW_OCCURRENCE_MESSAGE', 'INDIVIDUAL_REPORT_SEARCH', 'STUDENT_DEFENSE', 'FORMALIZATION', 'MY_PROFILE'].includes(view)} 
      onBack={handleBack}
      onLogout={handleLogout}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
