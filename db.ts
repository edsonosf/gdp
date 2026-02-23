
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export async function initDb() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      social_name TEXT,
      role TEXT,
      email TEXT UNIQUE,
      cpf TEXT UNIQUE,
      status TEXT DEFAULT 'Inativo',
      secretaria TEXT,
      lotacao TEXT,
      matricula TEXT,
      phone TEXT,
      phone2 TEXT,
      cargo TEXT,
      profile_image TEXT,
      is_system_admin BOOLEAN DEFAULT FALSE,
      gender TEXT,
      birth_date TEXT,
      components TEXT[],
      disciplines TEXT[],
      carga_horaria TEXT[],
      turno_trabalho TEXT[],
      additional_info TEXT,
      has_custom_schedule BOOLEAN DEFAULT FALSE,
      custom_schedule_details TEXT[],
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      social_name TEXT,
      grade TEXT,
      classroom TEXT,
      room TEXT,
      turn TEXT,
      birth_date TEXT,
      responsible_name TEXT,
      relationship TEXT,
      other_relationship TEXT,
      contact_phone TEXT,
      backup_phone TEXT,
      landline TEXT,
      work_phone TEXT,
      email TEXT,
      profile_image TEXT,
      observations TEXT,
      is_aee BOOLEAN DEFAULT FALSE,
      pcd_status TEXT,
      cid TEXT,
      investigation_description TEXT,
      school_need TEXT[],
      pedagogical_evaluation_type TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS occurrences (
      id TEXT PRIMARY KEY,
      student_id TEXT REFERENCES students(id),
      date TEXT,
      type TEXT,
      severity TEXT,
      titles TEXT[],
      description TEXT,
      reporter_name TEXT,
      reporter_id TEXT,
      status TEXT DEFAULT 'Pendente',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS access_logs (
      id SERIAL PRIMARY KEY,
      timestamp TEXT,
      user_id TEXT,
      event TEXT,
      status TEXT,
      description TEXT,
      ip_address TEXT,
      user_agent TEXT,
      device_info JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Seed initial admin user if not exists
  const adminCpf = '111.111.111-11';
  await query(`
    INSERT INTO users (id, name, role, email, cpf, status, phone, is_system_admin)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (id) DO UPDATE SET
      cpf = EXCLUDED.cpf,
      status = EXCLUDED.status,
      is_system_admin = EXCLUDED.is_system_admin,
      phone = EXCLUDED.phone
  `, ['admin_seed', 'Administrador', 'Administrador do Sistema', 'admin@educontrol.com', adminCpf, 'Ativo', '(85) 9 9690-3476', true]);
  
  console.log('Seed: Administrator user synchronized');

  // Seed students from user request
  const studentsToSeed = [
    "ANA JULIA SOUSA DA SILVA BRITO",
    "ANNA GABRIELA DO CARMO OLIVEIRA",
    "ARTHUR SOUSA DE OLIVEIRA",
    "BERNARDO MARTINS NUNES",
    "DAVI IARLEY MOREIRA E SILVA",
    "DAVI LUIZ DA SILVA PAIVA",
    "EMERSON GABRIEL NUNES RODRIGUES",
    "GEOVANNA BARROSO FERREIRA",
    "GUSTAVO SILVA LIMA",
    "HAVYLLA HELOIZA PINHEIRO COSTA",
    "HELENA KETELLEN PINTO DO NASCIMENTO",
    "INGRID LORRANY DA SILVA SOUZA",
    "JOAO MIGUEL DA SILVA DE OLIVEIRA",
    "JOSE VICTOR DA SILVA LOURENCO",
    "KAUANY KELLEN DE OLIVEIRA SAMPAIO",
    "KETLEY MARIA PEREIRA MARQUES DE PAULO",
    "MARIA CECILIA SALUSTIANO COSTA",
    "MARIA JULIA LIMA VIANA",
    "MARIA JULIA NOBRE DE OLIVEIRA",
    "MARIA LUIZA GONCALVES CORREIA",
    "MATHEUS DE SOUSA SANTOS",
    "NATANAEL ALBINO MELO",
    "NEEMIAS MEDEIROS DE LIMA SILVA",
    "OTAVIO AIRTON DUTRA DE LIMA",
    "PEDRO ERNESTO RODRIGUES PAIVA",
    "RIAN RIBEIRO DA SILVA ALVES",
    "RONALD CAUAN BARBOZA ALVES",
    "SAMUEL DA SILVA COSTA",
    "THIAGO MENDES DE SA",
    "TICIANY BARBOSA RODRIGUES",
    "VINICIUS NUNES SANTIAGO",
    "WILLAME RYAN BITTENCOURT OLIVEIRA",
    "YASMIM SILVA CAVALCANTE",
    "ADRYAN VICTOR RODRIGUES DE SOUSA",
    "ALIKA VITORIA DA SILVA LOPES",
    "ANA JULIA DO NASCIMENTO NOBRE",
    "DAVI LUCCA DE SOUSA CONCEICAO",
    "DAVI LUIZ PEREIRA DA SILVA",
    "DEBORA FERREIRA BARBOSA MONTE",
    "EDVAN ERICK DE SOUZA QUEIROZ",
    "ERICK DAVID DE SOUZA GOES",
    "FRANCISCO ISMAEL SANTOS PEREIRA",
    "GABRIEL ALIXANDRE DE LIMA GOMES",
    "GLAUBER DE OLIVEIRA MORAIS",
    "GUSTAVO GOMES FREITAS"
  ];

  for (const name of studentsToSeed) {
    const id = `st_seed_${name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_')}`;
    const isEmerson = name === "EMERSON GABRIEL NUNES RODRIGUES";
    
    await query(`
      INSERT INTO students (id, name, grade, classroom, turn, birth_date, responsible_name, relationship, contact_phone, email, is_aee, pcd_status, cid)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (id) DO NOTHING
    `, [
      id, 
      name, 
      '1º Ano', 
      'A', 
      'Manhã', 
      '01/01/2015', 
      'Responsável', 
      'Mãe', 
      '(85) 9 0000-0000', 
      `${name.toLowerCase().split(' ')[0]}@escola.com`,
      isEmerson,
      isEmerson ? 'com_laudo' : '',
      isEmerson ? 'Transtorno do Espectro Autista, TDAH' : ''
    ]);
  }

  console.log('Seed: Students synchronized');

  console.log('Database initialized');
}
