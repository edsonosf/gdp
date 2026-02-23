export enum OccurrenceType {
  DISCIPLINARY = 'Disciplinar',
  PEDAGOGICAL = 'Pedagógica'
}

export enum Severity {
  LOW = 'Baixa',
  MEDIUM = 'Média',
  HIGH = 'Alta',
  CRITICAL = 'Crítica'
}

export interface Occurrence {
  id: string;
  studentId: string;
  date: string;
  type: OccurrenceType;
  severity?: Severity;
  titles: string[];
  description: string;
  reporterName: string;
  reporterId: string;
  status: 'Pendente' | 'Resolvida';
}

export interface Student {
  id: string;
  name: string; // Nome Completo
  socialName?: string;
  grade: string;
  classroom: string; // Turma
  room?: string;      // Sala
  turn: 'Integral' | 'Manhã' | 'Tarde' | 'Noite' | '';
  profileImage?: string;
  birthDate: string;
  age?: number;
  responsibleName: string;
  relationship: string;
  otherRelationship?: string;
  contactPhone: string; // Com WhatsApp
  backupPhone?: string; // Recados
  landline?: string;    // Telefone fixo
  workPhone?: string;   // Telefone do trabalho
  email: string;
  observations?: string;
  // PcD fields
  isAEE?: boolean;
  pcdStatus?: 'com_laudo' | 'sob_investigacao' | '';
  cid?: string;
  investigationDescription?: string;
  schoolNeed?: ('estrutura_fisica' | 'adaptacao_curricular' | 'atendimento_especializado')[];
  pedagogicalEvaluationType?: string;
}

export interface User {
  id: string;
  name: string;
  role: string;
  email?: string | null;
  cpf: string;
  status: 'Ativo' | 'Inativo';
  profileImage?: string;
  secretaria: string;
  lotacao: string;
  matricula: string;
  isSystemAdmin?: boolean;
  socialName?: string;
  gender?: string;
  birthDate?: string;
  phone?: string;
  phone2?: string;
  cargo?: string;
  // Novos campos para persistência total
  components?: string[];
  disciplines?: string[];
  cargaHoraria?: string[];
  turnoTrabalho?: string[];
  additionalInfo?: string;
  // Campos para horário personalizado
  hasCustomSchedule?: boolean;
  customScheduleDetails?: string[];
}

export interface AccessLog {
  timestamp: string;
  user_id: string;
  event: 'user.login' | 'user.logout' | 'critical.action';
  status: 'success' | 'failure';
  ip_address: string;
  user_agent: string;
  description?: string;
  device_info: {
    type: 'mobile' | 'tablet' | 'desktop';
    os: string;
    browser: string;
  };
}

export type ViewState = 'LOGIN' | 'DASHBOARD' | 'STUDENT_LIST' | 'STUDENT_DETAIL' | 'ADD_OCCURRENCE' | 'USER_REGISTRATION' | 'USER_MANAGEMENT' | 'REPORTS' | 'EDIT_USER' | 'ADD_STUDENT' | 'EDIT_STUDENT' | 'PENDING_OCCURRENCES' | 'SYSTEM_MANAGEMENT' | 'OCCURRENCE_MONITORING' | 'NEW_OCCURRENCE_MESSAGE' | 'INDIVIDUAL_REPORT_SEARCH' | 'STUDENT_DEFENSE' | 'FORMALIZATION' | 'MY_PROFILE';