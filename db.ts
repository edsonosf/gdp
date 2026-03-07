
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
  // Enable pgcrypto for gen_random_uuid()
  try {
    await query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
  } catch (e) {
    console.warn('pgcrypto extension could not be enabled, gen_random_uuid might fail if not built-in');
  }

  const queries = [
    /*
    
    Users table [Tabela de Usuários]

    */
    `CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      usr_profile_image TEXT DEFAULT 'data:image/png;base64,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';',
      usr_name TEXT NOT NULL,
      usr_social_name TEXT,
      usr_use_social_name BOOLEAN DEFAULT FALSE,
      usr_role TEXT,
      usr_email TEXT UNIQUE,
      usr_cpf TEXT UNIQUE,
      usr_password TEXT,
      usr_status TEXT DEFAULT 'Inativo',
      usr_secretaria TEXT,
      usr_lotacao TEXT,
      usr_matricula TEXT,
      usr_phone TEXT,
      usr_phone2 TEXT,
      usr_cargo TEXT,
      usr_is_system_admin BOOLEAN DEFAULT FALSE,
      usr_gender TEXT,
      usr_birth_date TEXT,
      usr_components TEXT[],
      usr_disciplines TEXT[],
      usr_carga_horaria TEXT[],
      usr_turno_trabalho TEXT[],
      usr_additional_info TEXT,
      usr_has_custom_schedule BOOLEAN DEFAULT FALSE,
      usr_custom_schedule_details TEXT[]
    )`,
    `COMMENT ON TABLE users IS 'Tabela de Usuários.'`,    
    /*
    
    SGE Students Extracted Data Table [Tabela de importação de dados do aluno | SGE -> Aplicativo |]

    */
    `CREATE TABLE IF NOT EXISTS sge_extracted_data (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

      app_responsible_id UUID REFERENCES legal_responsible(id),

      sge_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      sge_photo TEXT, 
      sge_civil_name TEXT NOT NULL,
	  
	    app_gender TEXT,
      
	    sge_application_name BOOLEAN DEFAULT FALSE,
      sge_social_name TEXT,
      sge_transgender BOOLEAN DEFAULT false,
      sge_cpf TEXT,
      sge_class_number TEXT,
      sge_class_name TEXT,
      
      app_observations TEXT,
      app_is_aee BOOLEAN DEFAULT FALSE,
      app_pcd_status TEXT,
      app_cid TEXT,
      app_investigation_description TEXT,
      app_school_need TEXT[],
      app_pedagogical_evaluation_type TEXT,
      app_school_academic_year TEXT,
      app_classroom TEXT,
      app_manual_insert BOOLEAN DEFAULT TRUE,
      
      sge_student_registration TEXT,
      sge_birthday TEXT,
      sge_pcd_info TEXT,
      sge_school_academic_year TEXT,
      sge_status TEXT DEFAULT 'Ativo'
    )`,
    `COMMENT ON TABLE sge_extracted_data IS 'Tabela de importação de dados do aluno | SGE -> Aplicativo |'`,
    `COMMENT ON COLUMN sge_extracted_data.id IS 'Padrão de identificador de 128 bits.'`,
    `COMMENT ON COLUMN sge_extracted_data.sge_created_at IS 'Data e hora atuais do sistema, formatada como uma string. Exemplo: YYYY-MM-DD HH:MM:SS = 2025-10-25 14:30:05'`,
    `COMMENT ON COLUMN sge_extracted_data.sge_photo IS 'Imagem do aluno em formato string Base64.'`,
    `COMMENT ON COLUMN sge_extracted_data.sge_civil_name IS 'Nome civil designação oficial e legal de uma pessoa física, registrada no Cartório.'`,
    `COMMENT ON COLUMN sge_extracted_data.sge_social_name IS 'Nome adotado pela pessoa em sua vida social, refletindo sua identidade de gênero (Decreto 8.727/2016 na administração federal e Lei 19.649 no Ceará.'`,
    `COMMENT ON COLUMN sge_extracted_data.sge_transgender IS 'Usa nome social, é autorizado por responsável maior de 18 anos.'`,
    `COMMENT ON COLUMN sge_extracted_data.sge_class_number IS 'Padrão de identificador de 128 bits.'`,
    `COMMENT ON COLUMN sge_extracted_data.sge_class_name IS 'Padrão de identificador de 128 bits.'`,
    `COMMENT ON COLUMN sge_extracted_data.sge_student_registration IS 'Número da matrícula do estudante.'`,
    `COMMENT ON COLUMN sge_extracted_data.sge_birthday IS 'data de nascimento (aniversário).'`,
    `COMMENT ON COLUMN sge_extracted_data.sge_pcd_info IS 'Padrão de identificador de 128 bits.'`,
    `COMMENT ON COLUMN sge_extracted_data.sge_school_academic_year IS 'Ano letivo vigente.'`,
    `COMMENT ON COLUMN sge_extracted_data.sge_status IS 'Se o aluno esta Ativo = True | Inativo = False.'`,    
    /*
    
      Legal Responsible table [Registro do Resposável Legal do Estudante]

    */      
    `CREATE TABLE IF NOT EXISTS legal_responsible (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      resp_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      resp_name TEXT NOT NULL,
      resp_relationship TEXT NOT NULL,
      resp_other_relationship TEXT,
      resp_contact_phone TEXT NOT NULL,
      resp_backup_phone TEXT,
      resp_landline TEXT,
      resp_work_phone TEXT,
      resp_email TEXT,
      resp_observations TEXT,
      resp_profile_image TEXT,
      resp_legal_consent BOOLEAN DEFAULT FALSE,
      resp_status BOOLEAN DEFAULT TRUE
    )`,    
    `COMMENT ON TABLE legal_responsible IS 'Tabela de Registro do Resposável Legal do Estudante.'`,    
    /*
    
    Organizational chart [Organograma do Órgão]

    */
    `CREATE TABLE IF NOT EXISTS organizational_chart (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_name TEXT NOT NULL,
      org_description TEXT
    )`,
     `COMMENT ON TABLE organizational_chart IS 'Organograma do Órgão.'`, 
    /*
    
    Adress of local unit table [Registro da Unidade de Trabalhoo]

    */
	  `CREATE TABLE IF NOT EXISTS local_unit (
		  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	  	loc_organization_chart_id UUID REFERENCES organizational_chart(id),
      loc_name TEXT, 
      loc_inep TEXT,
      loc_full_address TEXT,
      loc_address_number TEXT,
      loc_address_complement TEXT,
      loc_neighborhood TEXT,
      loc_zipcode TEXT,
      loc_city TEXT,
      loc_state TEXT,
      loc_phone TEXT,
      loc_email TEXT,
      loc_status BOOLEAN DEFAULT true
	  )`,  
     `COMMENT ON TABLE local_unit IS 'Tabela de Registro da Unidade de Trabalhoo (empresa, Órgão Federal, Estadual ou Municipal.'`, 
     `COMMENT ON COLUMN local_unit.loc_status IS 'Se o a unidade loal esta Ativo = True | Inativo = False.'`,       
    /*
    
    Visual Identity table [Identidade Visual dos Relatórios]

    */
	`CREATE TABLE IF NOT EXISTS visual_identity (
	    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	    vis_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	    vis_usevisual_identity BOOLEAN DEFAULT true,
	    vis_name_id UUID REFERENCES local_unit(id),
	    vis_docheaderlft_image TEXT,
	    vis_docheadercnt TEXT,
	    vis_docheaderrgh_image TEXT,
	    vis_footer BOOLEAN DEFAULT true,
      vis_show_header_text BOOLEAN DEFAULT false,
      vis_show_footer_text BOOLEAN DEFAULT false,
      vis_show_footer_divider BOOLEAN DEFAULT false
	  )`,
    `COMMENT ON TABLE visual_identity IS 'Tabela de Identidade Visual dos Relatórios.'`,
    `COMMENT ON COLUMN visual_identity.vis_usevisual_identity IS 'Se será utilizada a identidade visual no sistema e relatórios. Sim = True | Não = False.'`,
    `COMMENT ON COLUMN visual_identity.vis_docheaderlft_image IS 'Imagem do cabeçalho lado esqueerdo.'`,
    `COMMENT ON COLUMN visual_identity.vis_docheadercnt IS 'Texto central do cabeçalho lado esqueerdo.Default = Nome da Unidade Municiapl + Endereço + E-mail + Fone'`,
    `COMMENT ON COLUMN visual_identity.vis_docheaderrgh_image IS 'Imagem do cabeçalho lado direito.'`,
    `COMMENT ON COLUMN visual_identity.vis_footer IS 'Usar rodapé | Sim = True | Não = False.'`,
    /*
    
    Students Occurrences [Tabela de Registro de Ocorrências Disciplinares]

    */
    `CREATE TABLE IF NOT EXISTS occurrences (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      occ_student_id UUID REFERENCES sge_extracted_data(id),
      occ_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      occ_date TEXT,
      occ_type TEXT,
      occ_severity TEXT,
      occ_titles TEXT[],
      occ_description TEXT,
      occ_reporter_name TEXT,
      occ_reporter_id TEXT,
      occ_user_id UUID REFERENCES users(id),
      occ_status TEXT DEFAULT 'Pendente'
    )`,
    `COMMENT ON TABLE occurrences IS 'Tabela de Registro de Ocorrências Disciplinares do Aplicativo.'`,
    /*
    
    Occurrences List and Level Table [Tabela de Grau de Severidde das Ocorrências Disciplinares]

    */
    `CREATE TABLE IF NOT EXISTS severity_categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      level VARCHAR(50) NOT NULL,
      description_level TEXT
    )`,
    `COMMENT ON TABLE severity_categories IS 'Tabela de Registro de Ocorrências Disciplinares do Aplicativo.'`,
    /*
    
    Occurrences List and Level Table [Tabela de Registro de Ocorrências Disciplinares]

    */    
    `CREATE TABLE IF NOT EXISTS occurrence_types (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      category_id UUID REFERENCES severity_categories(id),
      occurrence_description TEXT NOT NULL
    )`,
    `COMMENT ON TABLE occurrence_types IS 'Tabela de Registro de Ocorrências Disciplinares do Aplicativo.'`,
     /*
    
    Sytem Logs Table [Tabela de Logs do Aplicativo]

    */
    `CREATE TABLE IF NOT EXISTS access_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      acc_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      acc_timestamp TEXT,
      acc_user_id TEXT,
      acc_event TEXT,
      acc_status TEXT,
      acc_description TEXT,
      acc_ip_address TEXT,
      acc_user_agent TEXT,
      acc_device_info JSONB
    )`,
    `COMMENT ON TABLE access_logs IS 'Tabela de Logs do Aplicativo.'`,
    /*
    
     Curricular Component table [Tabela de Componentes Curriculares]

    */
    `CREATE TABLE IF NOT EXISTS curricular_component (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      cur_component TEXT
    )`,
    `COMMENT ON TABLE curricular_component IS 'Tabela de Componentes Curriculares ["Linguagens", "Matemática", "Ciências da Natureza", "Ciências Humanas", "Ensino Religioso"]'`,
    /*
     
    Subjects Component table [Tabela de Disciplinas Escolares]

    */
    `CREATE TABLE IF NOT EXISTS subjects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      sbj_subjects TEXT
    )`,
    `COMMENT ON TABLE subjects IS 'Tabela de Disciplinas Escolares ["Língua Portuguesa", "Arte", "Educação Física", "Língua Inglesa", "Matemática", "Ciências", "História", "Geografia", "Ensino Religioso"]'`,
    /*
    
    Work Shift table [Tabela de Turnos de Trabalho]

    */
    `CREATE TABLE IF NOT EXISTS work_shift (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      wrk_shift TEXT
    )`,
    `COMMENT ON TABLE work_shift IS 'Tabela de Turnos de Trabalho [Integral, Manhã, Tarde, Noite]'`, 
    /*
    
    Work Schedules table [Tabela de Horários de Trabalhlo]

    */
    `CREATE TABLE IF NOT EXISTS work_schedules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      wrk_schedules TEXT
    )`,
    `COMMENT ON TABLE work_schedules IS 'Tabela de Horários de Trabalhlo ["50 H", "100 H", "150 H", "200 H"]'`,
    /*
    
    Kinship table [Tabela de Grau de Parentesco]

    */
    `CREATE TABLE IF NOT EXISTS kinship (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      kns_kinship TEXT
    )`,
    `COMMENT ON TABLE kinship IS 'Tabela de Parentesco ["Pai", "Mãe", "Avô", "Avó", "Tio", "Tia", "Irmão", "Irmã", "Tutor Legal", "Outro"]'`,
    /*
    
    Gender table [Tabela de Gênero]

    */
    `CREATE TABLE IF NOT EXISTS gender_types (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      gen_type TEXT,
      gen_description TEXT
    )`,
    `COMMENT ON TABLE gender_types IS 'Tabela de Genero [ "Agênero", "Assexual", "Bigênero", "Bissexual", "Cisgênero", "Demigênero (Demiboy/Demigirl)", "Gênero-fluido", "Heterossexual", "Homossexual", "Intersexo", "Não-binário", "Neutrois", "Pansexual", "Poligênero", "Queer (Genderqueer)"]'`,
    /*
    
    Positions and Functions table [Tabela de Cargos e Funções de Trabalho]

    */
    `CREATE TABLE IF NOT EXISTS positions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      pos_type TEXT,
      pos_abbreviation TEXT
    )`,
    `COMMENT ON TABLE positions IS 'Tabela de Cargos [("Agente Escolar","Ag. Esc."), ("Analista de Educação Básica", "Anal. Ed. Básica"), ("Coordenador(a) Pedagógico", "Coord. Ped."), ("Diretor(a)", "Dir."), ("Professor(a)", "Prof."), ("Professora" ,"Prof.ª"), ("Secretário(a) Escolar" ,"Sec. Esc."), ("Vice-diretor(a)" ,"Vice-dir."), ("Vigilante" , "Vig."), ("Aluno","Aln.")]'`,
    /*
    
    Functions table [Tabela de Funções de Trabalho]

    */
    `CREATE TABLE IF NOT EXISTS functions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      position_id UUID REFERENCES positions(id),
      func_name TEXT
    )`,
    `COMMENT ON TABLE functions IS 'Tabela de Funções de Trabalho'`,
  ];

  for (const q of queries) {
    try {
      await query(q);
    } catch (err) {
      console.error(`Database init error on query: ${q.substring(0, 50)}...`, err);
    }
  }

  // Permanently deletes the database and all its contents (tables, views, data, etc.). This action cannot be undone.
  const delete_databsase = [
    `DROP DATABASE IF EXISTS gbd;`
  ];

  for (const delete_dtb of delete_databsase) {
    try {
      await query(delete_dtb);
    } catch (err) {
      // Ignore errors if database already exist or database doesn't exist yet
    }
  }
  
  // Seed initial admin user if not exists
  const adminId = '00000000-0000-0000-0000-000000000001';
  const adminCpf = '999.999.999-99';
  const adminPhone = '9999999999';
  const adminEmail = 'admin@gdpadmin.com';
  const adminPassword = 'admin123';
  const adminProfilePhoto = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIwAAACtCAYAAABiMJetAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsEAAA7BAbiRa+0AAAGHaVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8P3hwYWNrZXQgYmVnaW49J++7vycgaWQ9J1c1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCc/Pg0KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyI+PHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj48cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0idXVpZDpmYWY1YmRkNS1iYTNkLTExZGEtYWQzMS1kMzNkNzUxODJmMWIiIHhtbG5zOnRpZmY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vdGlmZi8xLjAvIj48dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPjwvcmRmOkRlc2NyaXB0aW9uPjwvcmRmOlJERj48L3g6eG1wbWV0YT4NCjw/eHBhY2tldCBlbmQ9J3cnPz4slJgLAAAgvUlEQVR4Xu2de5AcV33vP6e7p2dmd70re21rLWtRRGTZBgvbkg2RkElIeNquWzZRQqgL5kKIcaiYCoRXeF1fyKMIFKTChUtICDbBgXt52NcYU8Q8LkF+BGIbR2UjY4MttNiS7bW1q52d6e7T59w/zjkzPbO70o48s7u96k9Vl1Yz0zP9+Pbv9zvn/M7vCK21pqBgkXidLxQUHIlCMAVdUQimoCsKwRR0RSGYgq4oBFPQFYVgCrqiEExBVxSCKeiKQjAFXVEIpqArCsEUdEUhmIKuKART0BWFYAq6ohBMQVcUginoikIwBV1RCKagKwrBFHRFIZiCrigEU9AVhWAKuqIQTEFXiH5NZGs0Gp0vFSwBlUql86WechxZGGU2DciG+de9Nu8W2819LvM9fXnE8sHxIxjtmU0oosD828IDZOb/AKHdlHnPCixCgnBCOv44DlySAu1RF1BtWowAtMeBwxEPRQFPzjQ4ODPQttd4qc7wYJUNJwrGh6xoAHSIliBKGBGJtt2WnX67pNUvGE3TmtTxuOuJlFt+qfjxZIBOBJ4Psg549jIoQZraXSXoFLwybBuJeMl4yo5NIWsCZUTXNNBqxRjrQjCLxlgSIw4JOjR/y5iJCK7fp/jBU1XSzGEpBUIZE6GsSJTUc0TT/HykCeRhfuvZgj+88ATGh2IrHOvynJvT3rJZnkIwiyYbk0gg4MB0wnUTKT+YGoCkZUW0FCipUXYXocRRBaNT0LJ1qeLDgp1nRrzrBTA2LNotzjK6qkIwi8XdJNmAIOTGh+v801ODyBhIM6eoBFoZYXQjGDpEE8jDxGIYgPdum+Wl5waUSagzSHUZXVQhmCPh4hNtb46IqRPyd/fPclt9wIjFkVohxOZ0s2JhkS4pKxiVtkxIUoOLzor4y5eWqYJpjjuXCEsqnn4LZunOpNdkzb4A0gYTNcXb7pvlttkBdAq+b9+3YtFZr5XBiSVLc1+LnuczAEpCaRB2P1Dm9ddJDkxHANQFmab6Aj+cQ/IrGCsWnXhEmMD2Lx5RPNoYwAtBeDStRL9JY00wAPtqAa/6apkD09q4JamAessCrgLyfSYaREnx9LRuisUPIW2ATOZaiX7hh8bVaWXE89YbfA5JBUEFKHV0EuabHAumFR98+mDCQQbwSpDauCUIl9bCAIhAoxLBL54OeO8NKRGu2Z3jy9xBjs/EAxHzhcci/rM+BIBKzDvCWzjm6CdatgLhHx8oc90P5xtyyDc5FkzMRE1xw1NlRCjbOuSWGy8wgv3MvwfsOaiLoHdFoEM++6h5etNagB92fmD50Br8isYL4JPfLFHP8WXuJGdn4rre4Y7Dmj2xcUV+xdyklYIQkDaMe7rllynf3ztrUyVU7q1NzgRjEfCtg7Xmf5cjXjkSKhO2jFYCrv33kDphK8Uix+To6N2TqZioNdiT9rdH85kgMs35UkVw+8Oa/RNJK49mBVnDbsmRYLCHK/ne9DKN7B0jo5WAb9wDZgTUDmfklBwJxgMNdUJumGrvkRMrWD9Kgh8IvvTzEhEl+2qOLnsH+TpyoZiszW0/r6SAdyGShuZnB3WurQu5EwywPy13vpQLJhuSBydyd7nnkLMzkDxYy18Cdio1k9Lj4Uc738kfORMMPDRjA8fUpkbmAD8QbB7ymJjKtzsij4J5PFi5zemFSG3S1dO1oh9miclYFT9/g3r3xaW2DL48ki/B5PTp9APT7hcCGq5lnVNydAfUsmXi9wqRo6u9EDk7BcWol79WkuPciqKqi6GBJcIc6pmhn6sWkmOyIRkME9Nxl2NLmSPB0Mpey2HAC3D2Bjekkd/mdc4EE3DOQP4eT9es3nKyE0zOLnuG3B35swc9Zv0Ukvy4pXDQiHzj6XHuc3xzJhjJGj/ggjDN1ZGnEVz8LJ+x4VJ7X1IOyc9lt6kNiJjtQ5U5ccxKS3EQfivz7qeHUl5xrksLlEUMsyQIRRVFBOwcyVxwX6LilXUmOgWvZJLAAc5e47PjDHfM+Z6nlJ8jt/mwZWBNoLh8JDW5vGmAX11Zeb1+CMmMaKZq/v7Zs8Yd5bSnOkt+zqDpckKQit8e1oiw5ZbcJLYVgatDk5oW0iUX+LbIUGxFU7ikpUObeSXrB8OmldGpmWqyrNiyIWCmmPg2z+s1W+psWStA1IjAJoLn77I78nXkIrNpj/9yis/YCRLht7ukhcp69AvhiVaNvMysgXOqCVe93M2wG6TcrMyZX/IlmCxCsSbweN8pwZwW01KjlZ2Mb6+m55um9J9dpliDzL1IsuRXMPbQx4cUry9HTCdTnR9YWrIuKYb3vzhhy1pBPYcJX0civ4JpegCPyzbC68ZG8ErglYxLSLMVqPqMH9rqVp4mjeDVFypetc0HAjM6neMgt5P8CkaQOfxB3nB6zGurGpXYINiKZilwFaiSGcFbXpjyzhd69thc+dX8XuZOVs+Z6JBdZ8yya52pMbfUraZ4Gt7ywpQ3bRe2kNDqJN9VNLNo13qCO2szfOgng6aUWNpeFFG5KpjWS2RLrkKriiYYC5Wt0wtzq2gqaerBXPuyhM3rY7B1NJfrWSyqaLbhVhKxZTOc1LXp36gDNz+luOmBMuFwq3RqFs/m1/aSNNb8rz0eX78rNLXtXI9u81hNqQ+dkCn7kU/yY2G0edobJUwgKWjWw9USfhU3uPoXFdIIZsQUlXikFcdYC4Pto1moqDPPwMLE0ybYFgJuuiJibEBDEDaLCVU1RCKmrG0Tu/e6hcLCzKWKapbNODBt5irHpZj1gx5f3hKzrjrLYDpCOJjZye/P3XHFENOGqTh14VjEv14lzbiRXwEkkZR4xCAUZWmPPcfzq3NlYYxQAvYcTPjUkymP1gf4882a7cMJOgnNkjSywR2zZf76QdGqBO7WGThK2XiOwcKksaZaOsw7Lgi49FzdrNBQJmH3/gHe8z143kDMH78Itqztf/WGfluYlS0Yd2TWokzUFDdO+Hx7qmSfanPDrjx9llduLFEmMXVxCTkkJTccDLjhAMi6NlYmMZ93cYx05VKtaFxADDTLxzvBiMD8raJ2wbzx7JRdF2rWBB7IGAIPdMhXH9J87PuCoGw+n9Thhb8e8/YdmvWDXmbxLnoqoONbMHYFtDIJNz4M1x4ebKuWmaatGj3bRzX/bYNZDMvsEwCSA9OaOycl332sws+VN8fKuLUGHM01B+JWP45bN0lLjQgEW8KIizen7HxuaISSWetgoqb4+O2CHz0aNhew8HyNSk3x51IV/nQH7DojyWTfFYLpjWA0TMw2uH6fYvfMQLP3VvjmYSbVBBWBTEBHIMrwlnWKS59lUwmkfYIDjzohT87AvZOK259MuedwCRlrdOKC1/ldEUBQhnMrKb+zLuLcXx/g1KGYMtgFKGpAlToe3987y9/cJpHBCeY7rRVygjG/Y8aedmxQvPuFkrFhCWQDrmfGcS2YO6Y1f7VXIDzwQpPz0racjS/a/05M4Z4LRyWvWa/YtLZsu+Zb8Y+zBodSSWM2bS7hJ+UAk5lDHq3AWAU2jcRUBvzMKmxZJHVC9k8kvOXeEo0njQXKrqs0n2iwsY8fCv7mpZqd470Lyle5YLJL15BZNqbG5381yA2PzU1VcG7C91utlOzAX9bdnDWk+J3TGvzWeNnecIcVTrO1IucVQ/trXibmgAPTCbsPhnzmZ4LGkwtfwqxlyaJVKwi/clvKm7anbYI+1tXdVrdgdObCYFYmEaWYj9wvuUMOLFjdu9kh56xLh2DAlo+34vECwY5TNC8+VbGpbJu9TUG4O9kpmCzmMwemNQ9NhXx9b8xdU2XSmrEoLh8na1k4gljICMZx+YZZ3nPxQNPFtQtn8THOcSIYc/MiJH97v+S2ulnhdaE83W4EI2NNEIpmvOKXNZsHFKeHsGnEY6wCI2HMmsH2UmiHahFTcch9h2B6WvPtQx5JvfW+lqbl5FDRMxCMp0kbguefHvFXl/tzAulu8mlWt2Aw/SYEpkv9PQ/EZr2jkolXnolgOunse2m+3tmczqJsJl0mGO5EmbFO4JkJBtu0v3DMicadyOLFwhIIZvG2rtdoTMziV4iQc8TSC5TUyFi3iaXtfSuAeceX3M3MLOfn0LK1ZYs4HzM2lhECfvSrMldej8n/xV2nlcPyCUZg4gah+Nv7JQcxi2P1Gq9HZ5jtk+knXgCPHA5421d08/qsJHp0OY+dDz44y51eaILGFfY0LQfuGty5r8xHb2PFzcVeRsEobp6EPfEQaS1YcVNdlwvPN6IJKvDFHwq+ftfKujBLKxiNzUZT3D0l+dyjnp1W2nqyehW/9IrO+KVfuBkHreWQzcIW/+PWgN37tc2jiZc9pllawQhFmYBDUvHhx7yl/vVc4YJpPxC861ZhUjlWAMtwyyQff7iRy7JjS0m2S6HxFHzkJlojrcvI0gnGPiA3TwbsaQyZyWd9bAAs2LcCaE+jPY23iCbxfFNVsh12/cYLzPa9iZBb9grbanKuqY8XcAH6LBhlNm3c0SGp+ORTradkKVtFQSgIQhNACiXaEqdEqZUj08TTrXGrkjabFU+/m9adKGmqWL3/5gGTM9y0NHWbJ7x09FUwOvFMTmvaACQ3PeF6ylhylyRj04mHtTAiaFmYtJ5Jb8huDiVIE9OBJ4KltTAOVwni/9yBGWsSCqiaLMMlpP9DAzb5+Yma4oq9ESOVkdaH1Fwrk20lPZOhgU6X5JKlVGqarn4FNoUp55zgMWp70yuh2acRCyYb8HSk+NVhj/umIU3EnOw7R2f6piObztA5PNA5+Ghea12PznN3A5wHDiXc9NaU80+oEJdimyjWeu77PTTQZ8HYdAXgfb+c5f667cp11qWHgskOOro0TDdSnTYgGIDzBhN2nOxz7qjHyUM2obyJZ5uu7ga490zOy9R0xN2Ppnxnv982Uk3mZi4kmE6x0IVgsvt6gcn3+e31MZ94rTCuSQ+2pT/kXDDmok/UYq5+xNaly7qiZyoYMqLBJFHpqH2k+qwhxavHPc45LTWjwM20BieKxXpl1dz3kFTc/lDMrQ+X+fHjHoE8TFoZbn6yM1H8mQjG4b4jlZrJhuR7b4LN6+f6o3wLRgMi5n37pLEunXFLjwXjEsMBzqtKdm1M2XpSmLEemNFfTVdJSe0om+wdAnX2HAz4p7sD7nm0hhocbiaJ0yfBOH5zLLJWhrYR7XwLBsVELeaKvRGl4QoDjXL7A91Lwbh0TSV470bNznH3xdK2KkzerZnI2o1lwX7eYRYrbeXxAATs3i94720COWvSMemTYLzA/P34TMId7ygxPtSeL9NvwXRz1Y6Jb0U+I4ODDKR+T35tPrH4oSCtabafCF97EewcT5o3s05okqy1Z2MWKxanp+y/2Q0yQvEyl0q1suC0qygl2TkuuGmX5GUbDyMjIwRXtsxV0+wFTjijlYDrfzBr/qOxx5oVdn/owS08Eh57ps1JzfppT8/H941Q8M1TffX5mg88V1OVDXsTTZzipsa3ym7YUxaxGdfK/IvIzkzMHmyncNx32JdtYL8mUFzz4kHe/3Lz+TQy1sbzWyVYe8nXfmEyE1vMY8p6TP8Eo03W/wNJBZKgZxbG4SxNEMJnL4BLR7GxxSJNsg4Jk5BD0uOJmmKiZtzn/pmQ/TMeE7XYTlGw33skhMJkb5oc4Us3wJd+VxAMGLfkLE6vSKXGDwSPTSbs3l+yecA9vLhHoI8xzCzv29eY25TOcgwxTLZJHVQEnz67YWYSSmXFYq3BUbPtjQg++GDMf9aHoOO3N3tTfOz8qp3F0Hp9flq/WRdQpQaUODAp+IMb68TCtKCyscyxxjBkBJNKzQtO1Xz2jRJ0SCRiRjKttX7QP1lqryWWHuCG/33fbEFF8KmzYP2gdT9BxYpANm8cYLrO58QlylqDgMdj88VNsdjP/kyNcEia94z1cG7J7W83TcsVCLuAFoNAwNiozz+/epj1tmijGxfqBW6FlFt+mdpyrj3090egb4K5e/ooZrxLtLKdcvbJ+9RZMG4Mg/2AcTMQ2qfciEWUXJDqRGNPWRu3c5CBOXm5Wpkn/Bc1BaJmLUbH/hhXFdkJcnVspn/HjRsfUnzgFS1z0ZxL1SMmpce+CfN0LMUS8H0TzF2ZbvGeIYx1effG1DYnMzdHKGtVlA18TRkQ8/RbiyMyN13U2J+WSRt2qEvb3lr7lWkKtx8QdnJ/Zp6QpiWOoMITNbNDlVomsFZtl3bLWjPDMW24Aoq9E81ooPjGPQCylTjeR/onmKneC0an8KrTYecpqXUpZE5B2haRJAo8/uGplFsnjdsBs7AFuOXzFIdkmX+bqDcrb2anpzgr9u2pEruf8M0IsbBmP21QxViWj/5oiiu+U+bv91hhyYZ1X1lr5AEBO0+L2HWuIo21KQTdI0YrAV/6eYkIbOHo/tK3oPfKvQd5IKmY1pGjM/A9StDr0KkZr/FK8KXnuQpU7U8xGuoCKgn84+GEWx43N2VtGnPl+oCtIyEQc/cU3Ph4zJ7GEKnzmtoIpm2MKlMexA8F20c1l50cs2ltme/uU3zyQUFqWz+eD797uubNWxIbJHccm7WEEZLXXeexrxY0S5WYt833LCbodeNJ2Gy8x2cSXnIaXPvmGPQgleoiW4nHSN8E88jjU1wz6fOwTI1okgBK3Y0lNdHGnVyzKWbrSGCn1M4VDKLGzZNVPveEYta3v5uaSuHPqcb4seKep4fwK+1BbtYNdY6AazvdVkvRHHZIakYk2UJE8WH4/fMT/mRzaZ7Ziq4EScju/Zo/+4b5rrRB20S5xQgmlZpwUJBGrdbSLVdGjAyXqVKjUhlt37HH9M0ljQ0LU9YdY1lmK9FcC7MYrFgurGi2jpgcm3kXCxeKLzwWNBO0BuIyOrZl5ZOAPU8O8JPpIYJsZY2MZWlal0wujBOLF5gb3CxAVNJtYgFTEuQre0p89HaVcZcOIxaosXM8YcfG1FiXjFgWix+0xDLZkNzyhsSIRdOsftVP+iaYyLYQ/vpUwWwYmae9yzUBvBJIa34vWW/MvSjZtISOtYfunpJcP2OEMuubuymEdYOeGZT0SiBr1rrM54as1dGqPabJJl8lNZNwBUZMbsMzWXm1uDZPj6uJo0zbLeCNWyUqEaan+hiZbEi+/IcBY6Oxid2yBRf7SN8EUyYE7bF1JOGatR0j1VY4ne6ok7QB4bBgXWWWrSO2lQPmsDuu9dYR2BgYUTbF6dmWT2q+Swg7mm1/N4216QAMzej29lHN9lHN+SckCM8IJY1aqZ3YeMXl2jjSxFilNBH86UXVeeZDu8tsguAtawUXjkUmPlpEyOH6blw/zk8PpXzmDb4dM3NWZWlmSfYthmk0GkRY1Ysad0+V+PBEaKxNZtR6jq+eJ4b58zM024f1kfVtq1Vd/UjrDmS/W/jGugjPCE+ncP6JM/zRaUOsL2NTHd0F96gDP32qwa0HFN/9ZWvMZs7k/UwtvLdu0+w6Y3YRFaUUu/cL3najaEtEXyiGcQlaShqxfO21ERefOdAq45p5eHI9Wl3GmAmdDLJ1BD6wPmYgLkNJzhHKfHj24dk+sIgeBgHrBz0uPykCv/37VWItjBXLOST8w1kRHzpjgPEhZQPouWw9yePdz6nwhR0RZw6nc+KWrFi2jaRccoZtXh8N7bFzPMEr2TjmKMQ185nHZxJ+dLXk4rOMKMq41uLS0VfBoEPqQQUhGtQJ2ToCf7fBxBUiPPo0k7gG5w3P2GSlxRDwe6fZYNfiLJbrlHvZUMJ/36YZGxaZOMiz1sW4jFa/jbm5Jw4LPrYj5eWnTJkFSWm1osAlhkuqxDad4ignBkDA5eP1o8Yxys6AVBK+9ceKLWtNR6TpYWaeeKm/9FcwtoueoGL+1SHjQzGfP1OyNo2ZiqfMcr1Ja6afsyoAQQkuGzUjwJ1B7nzoxOPemZnm95meVfOe8GHn0Cx/cqa2idPOlGdF43DCMZ8pE1IG3vn8gJeNt5sZv2Se/h89GrJ7f4kqMTpxAlwAe7NfdW4JOTs3yAZz3C52efaJkluujGydX9M92VrdbbEPU284+l3oOQFrAsUnnjvA9pNLaLte43wuygvh2cO2t/aopte4lmv3mVNKGzZuqds6vcC7n2PvwCLE10mdEKTP2y5Im3OY0tQseQPglQX/cqcZVxKl+IiXVichIDl1zFgON7CKbdl5ttmuJPzmc1Oue33A2IAmWuSD00+W9tftTddJSBX4y2cN8KbTVfPmdiIErAmcezn6oU7UYg6kNkDVdrEtD4Kq4JqNbtqLK5XaHVXZoB5UKAOfuCBqz/wDvNo0PzlcZv/M0Y/TzGsyD8451fYoX2uzyKgQ8N6LEj7xytRaaY8wcb3Iy8fRz66X2KdDlGxagIBLRyWfPqvBWmbntJB+w58FlB3sy7zR/NtdPPPvfzyemqX8dKZMa0Oz2Zvi7JMqViymC/2ILmMe6kGlmc23aW2ZrYMpWoJXhrSmUYPD+GX48r3K/I7G/sY8vyOc24Kz1idtwbROjQv64mUJr9qmbR+OsVxmMHV5WVrBNGOGTD+KVKwfDPnEcwfYtS5CJa045tSRATuo6AJQ90W0boSG/TMeN0/CdTODDDECwoolNqPDO9cEtnOLeWKXxeFiMff3SzdGJpC2MaeKzPJ9X7vPY8fn4UX/Gz77Q8UtexscmI7sTXfiCZots5NPaiUlaA1XbpNc9/qAzeutWLRn4xTPxi3dHXevWd5f19gWkBHFFaeVuGZTzKZ0ChnDWSeYixY1E5TsfsK4ny88lnDV/bNc/Qv47CMeaTw3FkpjzbNOWkRTtysU4yf6aKmbv9cs4ByY34wOaa59MOD9Nw/w0FRoLYXDtWwC1p1ohPdrJ0iuvzzhyotsC02bjs/ldkGdLK9gmrQu5tbhkI+dfwJ/8GsR4/58/S/mAu5Py3z9iTIHVatTzbOrzsjYdNK5yfPPHuz9aZ5is8vbqn5Ls7mmctpozRxoomk73/ETfa56Qco/v14Zq6LNA4TIPCAriN5fyW4QdkxIWzeVcVVXnFbilMFMvdo2Wk9dGhv344fmBsUunnVGxRd2xmMv8RgZbikha1200m1ZdTqF6VqmwG8HW9aWeNP21Kyl1Gwihy0XNu/5Lx/LfDRWIHOeJCOecqYfxHwmI5RItQXJ0t4T37cDiam9cam2q6L10LRnYik3I8ClH3QmRynZXsu3LY5rbmFrtkNzdxuvzLk2y8syC+ZYMIc84CcmONZmc30Z2eaulgItBU/O0NseUaF4csZYFte5ppVJwXTplyoRJLNQGtKsOcnNjupo7eWQHAmm3UKcElbY5mtmxBQygWQmkwClzAQ3JU0dmH31eXoFnyF7JmZbSU0uT8aKZ0M15Y/Ok1z3uoj/d5Uwq5UcbW5TTujraHXvUVbjpm+masuJ3D0d86gMuOeA4I5pW8GhbNdQ8uDFlSne+fwTOvZ137UYsmI1+7z91ojbHy6bVpEtAhBPw64zZnnPJbZ3uq2VI5ekGz/Xo9W9xx2umwJrYputIyGXjsJLxs28exHopliShub78TATNbNMcZTt11ks2mtzaQemI277edgKcD3jjgB2Pi/jftrilf6LZSnImWCOzHnDrcJCSmq0MqXjk1n44k9LVKk1l/br6tSF7RdBAjEfuS1oBrcuc06lpmjRtnHRnGu9Guniqq1wbHWGN2+okTZMVpx76tM6fOegz837zNNvBv+6waUTBNyyV3LHfr+5+KfnY0acU3jXtsQuk9ylBcsRq0cwtk/nlRtLbQnbAEFZIEqaj/9EsPsJjSjVbFxitvapsObvzumxZllhwYf+bQCtNNG0aYFlE6Beua3XPcorj9UjGBtjlAk5ryqbayJpadyFTgRBWfDB3T5ffdCMUbn9mlNhmyIyo9OmZRMDdW6+V/COb7Wa0UKYsR+VCPOvhO/eO2tnYq+iy9pBzlpJC1O3N/nuaXj3f5SbgnE5uNkiiUkdnjeqefU5ys6ixHbXt8Z4wLi53ROaf7kz5q4nylTL0zTSYdKOEYs0MkMAaQR3vCNekhmIC9HvVtKqEYwh5urvl/hZSnNWYmf5VUeaCFRkOtZedrpqLucHpiv/vskK39w7w2x9GBGY2Y9prFGJyVWZL1k7aWhes6XOey7pLPSzdBSCWTSKGx+u8+kHBk3h5gVWuyfTG5xdwLyzHp2WNOMT4dkJ9G7ltOYCpPZ7rVjc1NWFKlwuBf0WzKpytt99zFwsnXSIJSOUrFiyZEuLedlq36pV0NmhOhYDUxIqw615zmesXR6xLAWrSjAffr7mzExzF6xYPG0mmzmr4qxIdipKKsxmUxSaJTmslXFjQ1qbgLczjmlMa9adXOLv36yXvJz7UrKKBCNZ4wd8+KKUs09Mzei1nTeUJoLnrUv5nxdFXLzJqETOGleUdUeOpliUQCWCNDaJ2Ve9QPL1N8BNV0T81zMTkoZGSTPPuTwk+NerpJ2uujrGjeZjVcUwAMiYQwR84Ic+9x4UBFXN28/TXLrBfc7jwHTE7oMhtz8Sc+f+Mp5vRDMnflGCDYOSK86LuWCjbxdId5iizp/8Zol7Gx7/97URYwN27b2uxql6S79jmFUlmNagYp1Dssx3Hvb5jXUR6wfTeaav1ogo8bavaH5yuNwSiw1u/YqxQp/7vchOHsvs766YMN/x9LRmbFgCJeqEXQ5s9pZ+C2Z5zqpPVN0MA6qsCTx2nZHYCpt+ywJZ6gxSJmHjutIcseBclnapmG5A0WJr+ZrvCFhbLdtK404sq5fVIxjtgYxNygPGNZkOuMAmmrefqpkyUuIVm5J5a84paVapHxsWrST0JqYJZSpmSjv9w1k35vzWamL1nJnAxg9WHEHFnp7bOghCM3V31DSnTOvJBLiulNnW9QEQzlN3xX6nwLzf7Nld4LdWEasohukWU3wZAv7xDs2TT5l28knDLXFs35yyZa2wFiUfQuh3DHP8CqYZuJog2cQpna4naZVcXWHJ2AvRb8Hk47HpB8IuRGGDZINLrTTuykyp9ZrVFgqOZ8HgZdIms7FOZupL06p0xjDHL8exYAqOhb7FMAWrk8LCFHRFIZiCrigEU9AVhWAKuqIQTEFXFIIp6IpCMAVdUQimoCsKwRR0RSGYgq4oBFPQFYVgCrqiEExBVxSCKeiKQjAFXVEIpqArCsEUdEUhmIKuKART0BWFYAq6ohBMQVcUginoikIwBV1RCKagK/4/RBWKj+C3fh8AAAAASUVORK5CYII=';
 
  await query(`
    INSERT INTO users (id, usr_profile_image, usr_name, usr_social_name, usr_use_social_name, usr_role, usr_email, usr_cpf, usr_password, usr_status, usr_secretaria, usr_lotacao, usr_matricula, usr_phone, usr_phone2, usr_cargo, usr_is_system_admin, usr_gender, usr_birth_date, usr_components, usr_disciplines, usr_carga_horaria, usr_turno_trabalho, usr_additional_info, usr_has_custom_schedule, usr_custom_schedule_details)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
    ON CONFLICT (id) DO UPDATE SET
      usr_cpf = EXCLUDED.usr_cpf,
      usr_password = EXCLUDED.usr_password,
      usr_status = EXCLUDED.usr_status,
      usr_is_system_admin = EXCLUDED.usr_is_system_admin,
      usr_phone = EXCLUDED.usr_phone
  `, [adminId, adminProfilePhoto, 'Administrador', '', false, 'Administrador do Sistema', adminEmail, adminCpf, adminPassword, 'Ativo', '', '', '999999', adminPhone, '', 'Super Usuário', true, '', new Date().toISOString(), [], [], [], [], '', false, []]);
  
  
  console.log('Seed: Administrator user synchronized');

  await seedSeverityAndOccurrences();
  await seedOptions();

  // Seed students from user request if table is empty
  const studentCheck = await query("SELECT id FROM sge_extracted_data LIMIT 1");
  if (studentCheck.rows.length === 0) {
    const studentsToSeed = [
      "ALUNO TESTE DO SISTEMA"
    ];
    // Seeding logic was removed by user
    console.log('Seed: Students synchronized');
  }

  console.log('Database initialized');
}

async function seedSeverityAndOccurrences() {
  const check = await query("SELECT id FROM severity_categories LIMIT 1");
  if (check.rows.length > 0) return;

  console.log('Seeding severity categories and occurrence types...');

  const categories = [
    { level: 'Baixa Gravidade', description: 'Itens de Baixa Gravidade' },
    { level: 'Média Gravidade', description: 'Itens de Média Gravidade' },
    { level: 'Alta Gravidade', description: 'Itens de Alta Gravidade' },
    { level: 'Gravíssima', description: 'Itens de Gravidade Gravíssima' }
  ];

  const types: Record<string, string[]> = {
    'Baixa Gravidade': [
      'Apresentar de forma recorrente esquecimento do material escolar.',
      'Falta de material escolar (livros didáticos) durante as atividades.',
      'Dormir durante a aula.',
      'Uso inadequado do uniforme escolar.'
    ],
    'Média Gravidade': [
      'Atrasos recorrentes à escola.',
      'Saída da sala de aula sem autorização.',
      'Conversas excessivas/paralelas ou interrupções constantes.'
    ],
    'Alta Gravidade': [
      'Desrespeito a colegas ou funcionários.',
      'Uso de palavrões ou gestos obscenos.',
      'Danos ao patrimônio escolar.'
    ],
    'Crítica': [
      'Agressão física.',
      'Porte de objetos perigosos.',
      'Uso de substâncias ilícitas.'
    ]
  };

  for (const cat of categories) {
    const res = await query(
      "INSERT INTO severity_categories (level, description_level) VALUES ($1, $2) RETURNING id",
      [cat.level, cat.description]
    );
    const catId = res.rows[0].id;

    for (const typeDesc of types[cat.level] || []) {
      await query(
        "INSERT INTO occurrence_types (category_id, occurrence_description) VALUES ($1, $2)",
        [catId, typeDesc]
      );
    }
  }
  console.log('Seed: Severity categories and occurrence types synchronized');
}

async function seedOptions() {
  console.log('Synchronizing system options...');

  const curricularComponents = ["Linguagens", "Matemática", "Ciências da Natureza", "Ciências Humanas", "Ensino Religioso"];
  const subjects = ["Língua Portuguesa", "Arte", "Educação Física", "Língua Inglesa", "Matemática", "Ciências", "História", "Geografia", "Ensino Religioso"];
  const workSchedules = ["50 H", "100 H", "150 H", "200 H"];
  const workShifts = ["Integral", "Manhã", "Tarde", "Noite"];
  const kinship = ["Pai", "Mãe", "Avô","Avó", "Tio", "Tia", "Irmão", "Irmã", "Primo(a)", "Tutor Legal", "Outro"];
  const genders = ["Agênero", "Assexual", "Bigênero", "Bissexual", "Travesti", "Cisgênero", "Demigênero (Demiboy/Demigirl)", "Gênero-fluido", "Heterossexual", "Homossexual", "Intersexo", "Não-binário", "Neutrois", "Pansexual", "Poligênero", "Queer (Genderqueer)"];
  const positions = [
    { name: "Agente Escolar", abbrev: "Ag. Esc." },
    { name: "Analista de Educação Básica", abbrev: "Anal. Ed. Básica" },
    { name: "Coordenador(a) Pedagógico", abbrev: "Coord. Ped." },
    { name: "Diretor(a)", abbrev: "Dir." },
    { name: "Professor(a)", abbrev: "Prof." },
    { name: "Professora", abbrev: "Prof.ª" },
    { name: "Secretário(a) Escolar", abbrev: "Sec. Esc." },
    { name: "Vice-diretor(a)", abbrev: "Vice-dir." },
    { name: "Vigilante", abbrev: "Vig." },
    { name: "Aluno", abbrev: "Aln." }
  ];
  const organizationalChart = [
    { name: "Secretaria de Comunicação" },
    { name: "Secretaria de Cultura e Turismo" },
    { name: "Secretaria de Educação" },
    { name: "Secretaria de Saúde" },
    { name: "Secretaria de Infraestrutura, Mobilidade e Controle Urbano" },
    { name: "Secretaria de Desenvolvimento Econômico" },
    { name: "Secretaria de Gestão, Orçamento e Finanças" },
    { name: "Secretaria Especial de Integração de Políticas Sociais (SEPS)" }
  ];
  const localUnits = [
    "Adauto Ferreira Lima", "Adélia Santos de Sousa", "Antônio Albuquerque Sousa Filho", 
    "Antônio Gondim de Lima", "Aprender Pensando", "Benedito Gomes da Silva", 
    "Braz Ribeiro da Silva", "Carlos Drummond de Andrade", 
    "Centro de Educação Infantil – CEI – Maria de Jesus de Sousa Macambira, Professora", 
    "Centro de Educação Infantil – CEI Elsa Maria Laureano Pereira", 
    "Centro de Educação Infantil – CEI Maria da Conceição Pessoa Coelho", 
    "Centro de Educação Infantil Coronel Humberto Bezerra", 
    "Centro de Línguas Estrangeiras e Libras de Maracanaú – CLM", 
    "Centro Municipal de Educação Profissional Eneida Soares Pessoa", 
    "César Cals Neto", "Comissário Francisco Barbosa", 
    "Construindo o Saber Maria Isis Menezes Andrade", "Cora Coralina", 
    "Coronel Adauto Bezerra", "Creche Mirian Porto Mota", 
    "Creche Nossa Senhora de Fátima", "Creche Osmira Eduardo de Castro", 
    "Deputado José Martins Rodrigues", "Deputado Ulisses Guimarães", 
    "Dom Hélder Pessoa Câmara", "Edson Queiroz", "Elian de Aguiar Mendes", 
    "Elias Silva Oliveira", "Escola Cívico-Militar Dr. José de Borba Vasconcelos", 
    "Escola Cívico-Militar Governador César Cals de Oliveira Filho", 
    "Escola Cívico-Militar José de Borba Vasconcelos", "Escola Cívico-Militar José Maria Barros Pinho", "Escola Cívico-Militar José Mário Barbosa", 
    "Escola Cívico-Militar Manoel Róseo Landim", "Escola Cívico-Militar Maria Pereira da Silva", 
    "Escola Cívico-Militar Presidente Tancredo Neves", "Escola Cívico-Militar Rachel de Queiroz", 
    "Escola Cívico-Militar Raimundo Nogueira da Costa", "Escola Cívico-Militar Rodolfo Teófilo", 
    "Escola Cívico-Militar Valdênia Acelino da Silva", 
    "Escola Indígena de Educação Básica do Povo Pitaguari", 
    "Estudante Ana Beatriz Macedo Tavares Marques", "Evandro Ayres de Moura", 
    "Francisco Antônio Fontenele", "Francisco Taboza Filho", "Genciano Guerreiro de Brito", 
    "Governador Mário Covas", "Herbert José de Souza – Betinho", "Integrando o Saber", 
    "Irmã Dulce", "João Magalhães de Oliveira", "Joaquim Aguiar", "José Assis de Oliveira", 
    "José Belisário de Sousa", "José Dantas Sobrinho", "José Nogueira Mota", 
    "Luís Carlos Prestes", "Luiz Gonzaga dos Santos", "Madre Teresa de Calcutá", 
    "Maestro Eleazar de Carvalho", "Manoel Moreira Lima", 
    "Manoel Rodrigues Pinheiro de Melo", "Maria Marques do Nascimento", 
    "Napoleão Bonaparte Viana", "Narciso Pessoa de Araújo", "Norberto Alves Batalha", 
    "Prefeito Almir Freitas Dutra", "Professor Francisco Araújo do Nascimento", 
    "Professor Francisco Oscar Rodrigues", "Professor Paulo Freire", 
    "Professora Cezarina de Oliveira Gomes", "Professora Francisca Florência da Silva", 
    "Professora Maria de Lourdes da Silva", "Professora Maria do Socorro Viana Freitas", 
    "Professora Maria Gláucia Menezes Teixeira Albuquerque", 
    "Professora Maria José Holanda do Vale", "Professora Maria José Isidoro", 
    "Professora Norma Célia Pinheiro Crispim", "Rui Barbosa", "Santa Edwirges", 
    "Senador Carlos Jereissati", "Sinfrônio Peixoto de Moraes", "Vinícius de Morais"
  ];

  const severityCategories = [
    { level: "Baixa", description: "Fatos que atrapalham o ritmo individual do aluno ou pequenos desvios de conduta." },
    { level: "Média", description: "Ações que prejudicam o andamento da aula, o coletivo ou demonstram indisciplina moderada." },
    { level: "Alta", description: "Atitudes que rompem o respeito hierárquico, ameaçam a segurança física/emocional ou violam direitos de imagem e privacidade." },
    { level: "Crítica", description: "Violações graves do regimento que exigem intervenção imediata." }
  ];

  const pedagogicalOccurrences = [
    { level: "Baixa", items: [
      "Apresentar de forma recorrente esquecimento do material escolar.",
      "Falta de material escolar (livros didáticos) durante as atividades.",
      "Falta de zelo com o material escolar (livros, cadernos, etc).",
      "Dormir durante a aula.",
      "Se debruçar ou baixar a cabeça para ignorar a explicação do professor.",
      "Uso inadequado do uniforme escolar.",
      "Modificar o uniforme escolar com pinturas, riscos ou recortes inapropriados.",
      "Utilização de pinturas corporais com material inapropriados (Liquido corretivo, esmalte ou outros produtos toxicos.",
      "Violação do código escolar de vestimenta.",
      "Uso de má fé ao solicitar ida ao banheiro.",
      "Contribuir para desperdício de água.",
      "Uso inadequado de recursos e materiais coletivos."
    ]},
    { level: "Média", items: [
      "Apresentar-se com fardamento sujo, desalinhado ou rasgado",
      "Atrasos recorrentes à escola.",
      "Utilização de calçados diferentes do previsto pelo regimento escolar.",
      "Faltas injustificadas e não comunicadas.",
      "Circular pelos corredores em horário de aula sem permissão.",
      "Saída da sala de aula sem autorização.",
      "Conversas excessivas/paralelas ou interrupções constantes.",
      "Não realizar atividades em sala ou não apresentar o \"dever de casa\".",
      "Recusar-se a participar de atividades (individuais ou em grupo).",
      "Conduta educacional inadequada (pés nas cadeiras).",
      "Uso indevido de eletrônicos (celular, smartwatch, etc) ou jogos durante a aula.",
      "Não observar a higine corporal no ambiente escolar.",
      "Desperdiçar merenda escolar ou incentivar o desperdício.",
      "Importunar o colega com toques (empurrões, puxões de cabelo, pisões).",
      "Impor ao colega ou a qualquer membro da unidade escolar pseudônimos depreciativos ou não.",
      "Incitar práticas desordeiras.",
      "Prevaricar (faltar ao cumprimento do dever por interesse ou má-fé)."
    ]},
    { level: "Alta", items: [
      "Agressão verbal, ameaça ou intimidação.",
      "Intimidação através de gestos ou palavras (coação).",
      "Agir de forma grosseira ou usar argumentações pejorativas/depreciativas contra membros da escola.",
      "Desrespeito à autoridade com respostas ofensivas (professores, coordenação, etc).",
      "Desrespeito ou falta de educação (verbal ou gestual) em geral.",
      "Interpelar de forma truculenta membros da comunidade escolar.",
      "Usar palavras de baixo calão (vocabulário vulgar/obsceno).",
      "Uso de termos ofensivos ou linguagem imprópria recorrente.",
      "Filmar ou fotografar membros da escola sem autorização.",
      "Evadir-se (fugir) da escola antes do horário sem autorização.",
      "Importunar colegas usando qualquer tipo de artefato perigoso."
    ]}
  ];

  const disciplinaryOccurrences = [
    { level: "Crítica", items: [
      "Porte de armas ou objetos perigosos.",
      "Uso ou comercialização de substâncias ilícitas.",
      "Agressão física contra membros da comunidade escolar.",
      "Vandalismo grave contra o patrimonio.",
      "Furto ou roubo no ambiente escolar.",
      "Assédio ou importunação sexual.",
      "Bullying ou humilhação sistemática",
      "Atos de discriminação (racismo, homofobia, sexismo, etc.)",
      "Vandalismo/Depredação, danos a móveis, equipamentos ou pichação de paredes.",
      "Agressividade física/verbal ou ameaça."
    ]}
  ];

  for (const item of curricularComponents) {
    const check = await query("SELECT id FROM curricular_component WHERE cur_component = $1", [item]);
    if (check.rows.length === 0) await query("INSERT INTO curricular_component (cur_component) VALUES ($1)", [item]);
  }
  for (const item of subjects) {
    const check = await query("SELECT id FROM subjects WHERE sbj_subjects = $1", [item]);
    if (check.rows.length === 0) await query("INSERT INTO subjects (sbj_subjects) VALUES ($1)", [item]);
  }
  for (const item of workSchedules) {
    const check = await query("SELECT id FROM work_schedules WHERE wrk_schedules = $1", [item]);
    if (check.rows.length === 0) await query("INSERT INTO work_schedules (wrk_schedules) VALUES ($1)", [item]);
  }
  for (const item of workShifts) {
    const check = await query("SELECT id FROM work_shift WHERE wrk_shift = $1", [item]);
    if (check.rows.length === 0) await query("INSERT INTO work_shift (wrk_shift) VALUES ($1)", [item]);
  }
  for (const item of kinship) {
    const check = await query("SELECT id FROM kinship WHERE kns_kinship = $1", [item]);
    if (check.rows.length === 0) await query("INSERT INTO kinship (kns_kinship) VALUES ($1)", [item]);
  }
  for (const item of genders) {
    const check = await query("SELECT id FROM gender_types WHERE gen_type = $1", [item]);
    if (check.rows.length === 0) await query("INSERT INTO gender_types (gen_type) VALUES ($1)", [item]);
  }
  for (const item of positions) {
    const check = await query("SELECT id FROM positions WHERE pos_type = $1", [item.name]);
    if (check.rows.length === 0) await query("INSERT INTO positions (pos_type, pos_abbreviation) VALUES ($1, $2)", [item.name, item.abbrev]);
  }
  // Seed Organizational Chart and get IDs
  const orgChartMap: Record<string, string> = {};
  for (const item of organizationalChart) {
    const check = await query("SELECT id FROM organizational_chart WHERE org_name = $1", [item.name]);
    if (check.rows.length === 0) {
      const res = await query("INSERT INTO organizational_chart (org_name) VALUES ($1) RETURNING id", [item.name]);
      orgChartMap[item.name] = res.rows[0].id;
    } else {
      orgChartMap[item.name] = check.rows[0].id;
    }
  }

  const eduOrgId = orgChartMap["Secretaria de Educação"];
  const healthOrgId = orgChartMap["Secretaria de Saúde"];

  for (const item of localUnits) {
    const check = await query("SELECT id FROM local_unit WHERE loc_name = $1", [item]);
    if (check.rows.length === 0) {
      await query("INSERT INTO local_unit (loc_name, loc_organization_chart_id) VALUES ($1, $2)", [item, eduOrgId]);
    } else if (eduOrgId) {
      await query("UPDATE local_unit SET loc_organization_chart_id = $1 WHERE id = $2 AND loc_organization_chart_id IS NULL", [eduOrgId, check.rows[0].id]);
    }
  }

  const healthUnits = [
    "Centro de Controle de Zoonoses",
    "Centro de Especialidades Odontológicas - CEO Municipal",
    "Centro Integrado de Reabilitação de Maracanaú – Cirm",
    "Centros de Atenção Psicossocial – Caps",
    "UPA 24h de Maracanaú",
    "Farmácia Pólo"
  ];

  for (const item of healthUnits) {
    const check = await query("SELECT id FROM local_unit WHERE loc_name = $1", [item]);
    if (check.rows.length === 0) {
      await query("INSERT INTO local_unit (loc_name, loc_organization_chart_id) VALUES ($1, $2)", [item, healthOrgId]);
    } else if (healthOrgId) {
      await query("UPDATE local_unit SET loc_organization_chart_id = $1 WHERE id = $2 AND loc_organization_chart_id IS NULL", [healthOrgId, check.rows[0].id]);
    }
  }

  // Seed Severity Categories and Occurrence Types
  const severityMap: Record<string, string> = {};
  for (const cat of severityCategories) {
    const check = await query("SELECT id FROM severity_categories WHERE level = $1", [cat.level]);
    if (check.rows.length === 0) {
      const res = await query("INSERT INTO severity_categories (level, description_level) VALUES ($1, $2) RETURNING id", [cat.level, cat.description]);
      severityMap[cat.level] = res.rows[0].id;
    } else {
      severityMap[cat.level] = check.rows[0].id;
    }
  }

  for (const group of pedagogicalOccurrences) {
    const categoryId = severityMap[group.level];
    for (const item of group.items) {
      const check = await query("SELECT id FROM occurrence_types WHERE category_id = $1 AND occurrence_description = $2", [categoryId, item]);
      if (check.rows.length === 0) {
        await query("INSERT INTO occurrence_types (category_id, occurrence_description) VALUES ($1, $2)", [categoryId, item]);
      }
    }
  }

  for (const group of disciplinaryOccurrences) {
    const categoryId = severityMap[group.level];
    for (const item of group.items) {
      const check = await query("SELECT id FROM occurrence_types WHERE category_id = $1 AND occurrence_description = $2", [categoryId, item]);
      if (check.rows.length === 0) {
        await query("INSERT INTO occurrence_types (category_id, occurrence_description) VALUES ($1, $2)", [categoryId, item]);
      }
    }
  }

  // Ensure existing local units are linked to Secretaria de Educação if not already
  const eduOrgRes = await query("SELECT id FROM organizational_chart WHERE org_name = 'Secretaria de Educação'");
  if (eduOrgRes.rows.length > 0) {
    const eduOrgId = eduOrgRes.rows[0].id;
    await query("UPDATE local_unit SET loc_organization_chart_id = $1 WHERE loc_organization_chart_id IS NULL", [eduOrgId]);
  }

  console.log('Seed: System options synchronized');
}
