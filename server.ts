
import express from "express";
import { createServer as createViteServer } from "vite";
import { initDb, query } from "./db.js";
import dotenv from "dotenv";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize DB
  try {
    await initDb();
  } catch (err) {
    console.error("Failed to initialize DB:", err);
  }

  // API Routes
  
  // Sync Endpoint
  app.post("/api/sync", async (req, res) => {
    const { url, user, password, userId } = req.body;

    if (!url || !user || !password) {
      return res.status(400).json({ error: "Credenciais incompletas." });
    }

    // Log start of sync
    await query(
      "INSERT INTO access_logs (acc_timestamp, acc_user_id, acc_event, acc_status, acc_description) VALUES ($1, $2, $3, $4, $5)",
      [new Date().toISOString(), userId || null, 'Sincronização SGE', 'Iniciado', `Iniciando sincronização para URL: ${url}`]
    );

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      
      // Increase default timeouts for slow connections
      page.setDefaultNavigationTimeout(60000);
      page.setDefaultTimeout(60000);

      // 1. Login
      console.log(`Iniciando navegação para: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle2' });
      
      // Wait for username field
      const userSelector = 'input[name="username"], input[id="username"], input[name="cpf"], input[type="text"]';
      await page.waitForSelector(userSelector, { timeout: 20000 });
      
      console.log("Preenchendo credenciais...");
      
      // Limpa e preenche o usuário (CPF)
      await page.click(userSelector, { clickCount: 3 });
      await page.keyboard.press('Backspace');
      await page.type(userSelector, user, { delay: 50 });
      
      // Limpa e preenche a senha
      const passSelector = 'input[type="password"]';
      await page.click(passSelector, { clickCount: 3 });
      await page.keyboard.press('Backspace');
      await page.type(passSelector, password, { delay: 50 });

      // Pequena pausa para scripts de validação do site
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log("Enviando formulário...");
      // Tenta clicar no botão ou pressionar Enter
      const submitSelector = 'button[type="submit"], input[type="submit"], .btn-primary, #btn-login, button.btn-success, .btn-login';
      const submitButton = await page.$(submitSelector);
      
      if (submitButton) {
        await Promise.all([
          page.click(submitSelector),
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {})
        ]);
      } else {
        await Promise.all([
          page.keyboard.press('Enter'),
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {})
        ]);
      }

      // Verificação de sucesso
      const currentUrl = page.url();
      const pageContent = await page.content();
      
      console.log(`URL após tentativa: ${currentUrl}`);
      
      // Lista de termos que indicam falha no portal SGE
      const failureTerms = [
        'Usuário ou senha inválidos', 
        'CPF ou senha inválidos', 
        'não encontrado', 
        'Acesso negado',
        'Credenciais inválidas'
      ];
      
      const hasFailureMessage = failureTerms.some(term => pageContent.includes(term));
      
      if (currentUrl.includes('login') || hasFailureMessage) {
         console.log("Falha de login detectada no conteúdo ou URL");
         throw new Error("Falha ao Tentar Realizar Sincronização (Login incorreto - Verifique CPF e Senha no portal SGE)");
      }
      
      console.log("Login realizado com sucesso!");

      // 2. Access Turmas
      const turmasUrl = "https://sge.maracanau.ce.gov.br/academico/professor/turmas";
      await page.goto(turmasUrl, { waitUntil: 'load' });
      
      if (page.url() !== turmasUrl && !page.url().includes('turmas')) {
        throw new Error("Falha ao Tentar Navegar na Página de Turmas");
      }

      // 3. Extract Turmas Data
      const turmasData = await page.evaluate(() => {
        const button = document.querySelector('button#abrirModalTurmas, button[onclick*="abrirModalTurmas"]');
        if (!button) return [];
        
        const onclick = button.getAttribute('onclick') || '';
        // Extract the first argument which is the array of turmas
        // Pattern: abrirModalTurmas([{...}], [], [])
        const match = onclick.match(/abrirModalTurmas\((.*)\)/);
        if (!match) return [];
        
        try {
          const argsStr = match[1];
          // Find the end of the first array [ ... ]
          let bracketCount = 0;
          let firstArgEnd = -1;
          for (let i = 0; i < argsStr.length; i++) {
            if (argsStr[i] === '[') bracketCount++;
            if (argsStr[i] === ']') {
              bracketCount--;
              if (bracketCount === 0) {
                firstArgEnd = i + 1;
                break;
              }
            }
          }
          
          if (firstArgEnd === -1) return [];
          
          const firstArg = argsStr.substring(0, firstArgEnd);
          const data = JSON.parse(firstArg);
          return data.map((item: any) => ({
            id: item.turma.toString(),
            name: item.nome_turma
          }));
        } catch (e) {
          return [];
        }
      });

      console.log("Turmas found:", turmasData);

      if (turmasData.length === 0) {
        const content = await page.content();
        console.log("Page content snippet:", content.substring(0, 1000));
        console.log("Nenhuma turma encontrada. Verifique se o seletor 'button#abrirModalTurmas' ainda é válido.");
      }

      const allStudentsData: any[] = [];

      // 4. Extract Carômetro and Frequency for each Turma
      for (const turma of turmasData) {
        const carometroUrl = `https://sge.maracanau.ce.gov.br/academico/turmas/carometro/${turma.id}`;
        await page.goto(carometroUrl, { waitUntil: 'domcontentloaded' });

        const studentsInTurma = await page.evaluate((tId, tName) => {
          const cards = Array.from(document.querySelectorAll('.card'));
          
          return cards.map(card => {
            // New structure selectors
            const container = card.querySelector('.container.p-1');
            const nameElement = container ? container.querySelector('div:first-child') : card.querySelector('.text-center b, .text-center strong, h5');
            const birthdayElement = card.querySelector('.span-border i.fa-calendar-days')?.parentElement || card.querySelector('.span-border:not(.span-id)');
            const registrationElement = card.querySelector('.span-id') || card.querySelector('.span-border.span-id');
            const imgElement = card.querySelector('img.card-img') || card.querySelector('img');
            
            let studentName = nameElement ? nameElement.textContent?.trim() : "";
            let registration = registrationElement ? registrationElement.textContent?.trim() : "";
            let birthday = birthdayElement ? birthdayElement.textContent?.trim() : "";
            
            // Fallback for old structure if new selectors failed
            if (!registration || !birthday) {
              const infoElements = Array.from(card.querySelectorAll('.text-center p, .text-center div'));
              infoElements.forEach(el => {
                const text = el.textContent || "";
                if (text.includes("Matrícula:")) registration = text.replace("Matrícula:", "").trim();
                if (text.includes("Nascimento:")) birthday = text.replace("Nascimento:", "").trim();
              });
            }

            return {
              class_number: tId,
              class_name: tName,
              student_name: studentName,
              student_registration: registration,
              birthday: birthday,
              photo_url: imgElement ? imgElement.getAttribute('src') : ""
            };
          }).filter(s => s.student_name);
        }, turma.id, turma.name);

        // Fetch Base64 for each student photo
        console.log(`Convertendo fotos para Base64 para ${studentsInTurma.length} alunos da turma ${turma.name}...`);
        const photosBase64 = await page.evaluate(async (students) => {
          const results = [];
          for (const s of students) {
            if (s.photo_url && s.photo_url.startsWith('http')) {
              try {
                const response = await fetch(s.photo_url);
                const blob = await response.blob();
                const base64 = await new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result);
                  reader.onerror = reject;
                  reader.readAsDataURL(blob);
                });
                results.push(base64);
              } catch (e) { 
                results.push(""); 
              }
            } else { 
              results.push(""); 
            }
          }
          return results;
        }, studentsInTurma);

        // Assign Base64 photos back to student objects
        studentsInTurma.forEach((s, i) => {
          s.photo = photosBase64[i] || "";
        });

        // 4.1. Access Frequency Page for extra info (Social Name, PCD)
        const frequencyUrl = `https://sge.maracanau.ce.gov.br/academico/frequencia/form-fundamental/${turma.id}`;
        await page.goto(frequencyUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});
        
        const frequencyData = await page.evaluate(() => {
          const rows = Array.from(document.querySelectorAll('tr'));
          return rows.map(row => {
            const td = row.querySelector('td.text-uppercase');
            if (!td) return null;
            
            // Get text content excluding child elements
            const displayedName = Array.from(td.childNodes)
              .filter(node => node.nodeType === Node.TEXT_NODE)
              .map(node => node.textContent?.trim())
              .join(" ")
              .trim();
            
            // Check for civil name in tooltip
            const transImg = td.querySelector('img[src*="simbol-trans.png"]');
            let civilName = "";
            if (transImg) {
              const title = transImg.getAttribute('title') || "";
              const match = title.match(/Registrado\(a\) civilmente como (.*)/);
              civilName = match ? match[1].trim() : "";
            }
            
            // Check for PCD in tooltip
            const pcdSpan = td.querySelector('span[data-toggle="tooltip"][title]');
            let pcdInfo = pcdSpan ? pcdSpan.getAttribute('title') || "" : "";
            
            return {
              displayedName,
              civilName,
              pcdInfo
            };
          }).filter(item => item !== null);
        });

        // Merge info
        const mergedStudents = studentsInTurma.map(student => {
          const extraInfo = frequencyData.find(f => 
            (f && f.displayedName.toUpperCase() === student.student_name.toUpperCase()) || 
            (f && f.civilName && f.civilName.toUpperCase() === student.student_name.toUpperCase())
          );
          
          if (extraInfo) {
            return {
              ...student,
              social_name: extraInfo.civilName ? extraInfo.displayedName : "",
              civil_name: extraInfo.civilName || extraInfo.displayedName,
              pcd_info: extraInfo.pcdInfo
            };
          }
          return {
            ...student,
            social_name: "",
            civil_name: student.student_name,
            pcd_info: ""
          };
        });

        allStudentsData.push(...mergedStudents);
      }

      // 6. Insert into PostgreSQL
      await query("BEGIN");
      try {
        // Clear previous sync data to avoid duplicates
        await query("DELETE FROM sge_extracted_data");
        
        for (const record of allStudentsData) {
          await query(
            "INSERT INTO sge_extracted_data (sge_class_number, sge_class_name, sge_civil_name, sge_student_registration, sge_birthday, sge_photo, sge_social_name, sge_pcd_info, sge_transgender) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
            [record.class_number, record.class_name, record.civil_name, record.student_registration, record.birthday, record.photo, record.social_name, record.pcd_info, !!record.social_name]
          );
        }
        await query("COMMIT");
      } catch (dbErr) {
        await query("ROLLBACK");
        throw dbErr;
      }

      // Log success
      await query(
        "INSERT INTO access_logs (acc_timestamp, acc_user_id, acc_event, acc_status, acc_description) VALUES ($1, $2, $3, $4, $5)",
        [new Date().toISOString(), userId || null, 'Sincronização SGE', 'Sucesso', `Sincronização concluída com sucesso. ${allStudentsData.length} registros processados.`]
      );

      res.json({ success: true, count: allStudentsData.length });

    } catch (err) {
      console.error("Sync error:", err);
      // Log error
      await query(
        "INSERT INTO access_logs (acc_timestamp, acc_user_id, acc_event, acc_status, acc_description) VALUES ($1, $2, $3, $4, $5)",
        [new Date().toISOString(), userId || null, 'Sincronização SGE', 'Erro', `Falha na sincronização: ${(err as Error).message}`]
      ).catch(e => console.error("Failed to log sync error:", e));

      res.status(500).json({ error: (err as Error).message });
    } finally {
      if (browser) await browser.close();
    }
  });

  // DB Health Check
  app.get("/api/db-test", async (req, res) => {
    try {
      const result = await query("SELECT NOW() as now");
      res.json({ status: "ok", time: result.rows[0].now });
    } catch (err) {
      res.status(500).json({ status: "error", message: (err as Error).message });
    }
  });

  // Convert existing photos to Base64
  app.post("/api/convert-existing-photos", async (req, res) => {
    try {
      const result = await query("SELECT id, sge_photo FROM sge_extracted_data WHERE sge_photo LIKE 'http%'");
      const records = result.rows;
      let successCount = 0;
      let failCount = 0;

      console.log(`Iniciando conversão de ${records.length} fotos para Base64...`);

      for (const record of records) {
        try {
          const response = await fetch(record.sge_photo);
          if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
          
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const mimeType = response.headers.get('content-type') || 'image/png';
          const base64 = `data:${mimeType};base64,${buffer.toString('base64')}`;

          await query("UPDATE sge_extracted_data SET sge_photo = $1 WHERE id = $2", [base64, record.id]);
          
          // Também atualiza a tabela students se o ID existir lá
          await query("UPDATE students SET std_profile_image = $1 WHERE id = $2", [base64, record.id]);
          
          successCount++;
        } catch (err) {
          console.error(`Erro ao converter foto para ID ${record.id}:`, err);
          failCount++;
        }
      }

      res.json({ success: true, successCount, failCount });
    } catch (err) {
      console.error("Error in /api/convert-existing-photos:", err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Users
  app.get("/api/users", async (req, res) => {
    try {
      const result = await query("SELECT * FROM users ORDER BY created_at DESC");
      res.json(result.rows.map(u => ({
        id: u.id,
        name: u.usr_name,
        socialName: u.usr_social_name,
        role: u.usr_role,
        email: u.usr_email,
        cpf: u.usr_cpf,
        password: u.usr_password,
        status: u.usr_status,
        secretaria: u.usr_secretaria,
        lotacao: u.usr_lotacao,
        matricula: u.usr_matricula,
        phone: u.usr_phone,
        phone2: u.usr_phone2,
        cargo: u.usr_cargo,
        profileImage: u.usr_profile_image,
        isSystemAdmin: u.usr_is_system_admin,
        gender: u.usr_gender,
        birthDate: u.usr_birth_date,
        components: u.usr_components,
        disciplines: u.usr_disciplines,
        cargaHoraria: u.usr_carga_horaria,
        turnoTrabalho: u.usr_turno_trabalho,
        additionalInfo: u.usr_additional_info,
        hasCustomSchedule: u.usr_has_custom_schedule,
        customScheduleDetails: u.usr_custom_schedule_details,
        useSocialName: u.usr_use_social_name,
        createdAt: u.created_at
      })));
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/users", async (req, res) => {
    const u = req.body;
    try {
      await query(
        "INSERT INTO users (id, usr_name, usr_social_name, usr_role, usr_email, usr_cpf, usr_password, usr_status, usr_secretaria, usr_lotacao, usr_matricula, usr_phone, usr_phone2, usr_cargo, usr_profile_image, usr_is_system_admin, usr_gender, usr_birth_date, usr_components, usr_disciplines, usr_carga_horaria, usr_turno_trabalho, usr_additional_info, usr_has_custom_schedule, usr_custom_schedule_details, usr_use_social_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)",
        [u.id, u.name, u.socialName, u.role, u.email, u.cpf, u.password, u.status || 'Inativo', u.secretaria, u.lotacao, u.matricula, u.phone, u.phone2, u.cargo, u.profileImage, u.isSystemAdmin || false, u.gender, u.birthDate, u.components, u.disciplines, u.cargaHoraria, u.turnoTrabalho, u.additionalInfo, u.hasCustomSchedule, u.customScheduleDetails, u.useSocialName || false]
      );
      res.status(201).json({ success: true });
    } catch (err) {
      console.error("User registration error:", err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    const u = req.body;
    try {
      await query(
        "UPDATE users SET usr_name=$1, usr_social_name=$2, usr_role=$3, usr_email=$4, usr_cpf=$5, usr_password=$6, usr_status=$7, usr_secretaria=$8, usr_lotacao=$9, usr_matricula=$10, usr_phone=$11, usr_phone2=$12, usr_cargo=$13, usr_profile_image=$14, usr_is_system_admin=$15, usr_gender=$16, usr_birth_date=$17, usr_components=$18, usr_disciplines=$19, usr_carga_horaria=$20, usr_turno_trabalho=$21, usr_additional_info=$22, usr_has_custom_schedule=$23, usr_custom_schedule_details=$24, usr_use_social_name=$25 WHERE id=$26",
        [u.name, u.socialName, u.role, u.email, u.cpf, u.password, u.status, u.secretaria, u.lotacao, u.matricula, u.phone, u.phone2, u.cargo, u.profileImage, u.isSystemAdmin, u.gender, u.birthDate, u.components, u.disciplines, u.cargaHoraria, u.turnoTrabalho, u.additionalInfo, u.hasCustomSchedule, u.customScheduleDetails, u.useSocialName, id]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await query("DELETE FROM users WHERE id = $1", [id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Students
  app.post("/api/responsibles", async (req, res) => {
    const r = req.body;
    try {
      await query("BEGIN");
      const respId = crypto.randomUUID();
      await query(
        "INSERT INTO legal_responsible (id, resp_name, resp_relationship, resp_other_relationship, resp_contact_phone, resp_backup_phone, resp_landline, resp_work_phone, resp_email, resp_observations, resp_profile_image, resp_legal_consent) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)",
        [respId, r.name, r.relationship, r.otherRelationship, r.contactPhone, r.backupPhone, r.landline, r.workPhone, r.email, r.observations, r.profileImage, r.legalConsent]
      );

      // Link students if provided
      if (r.linkedStudents && r.linkedStudents.length > 0) {
        for (const student of r.linkedStudents) {
          await query("UPDATE students SET std_responsible_id = $1 WHERE id = $2", [respId, student.id]);
        }
      }

      await query("COMMIT");
      res.status(201).json({ success: true, id: respId });
    } catch (err) {
      await query("ROLLBACK");
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get("/api/students/active-list", async (req, res) => {
    const { search } = req.query;
    try {
      const currentYear = new Date().getFullYear().toString();
      let queryStr = `
        WITH current_month_occurrences AS (
            SELECT 
                occ_student_id,
                MAX(CASE 
                    WHEN occ_severity = 'Alta' THEN 3 
                    WHEN occ_severity = 'Média' THEN 2 
                    WHEN occ_severity = 'Baixa' THEN 1 
                    ELSE 0 
                END) as max_severity
            FROM occurrences
            WHERE (CASE 
                WHEN occ_date ~ '^\d{4}-\d{2}-\d{2}' THEN CAST(occ_date AS TIMESTAMP)
                WHEN occ_date ~ '^\d{2}/\d{2}/\d{4}' THEN to_timestamp(occ_date, 'DD/MM/YYYY')
                ELSE NULL 
            END) >= date_trunc('month', current_date)
            GROUP BY occ_student_id
        )
        SELECT 
            e.*,
            COALESCE(cmo.max_severity, 0) as month_severity
        FROM sge_extracted_data e
        LEFT JOIN current_month_occurrences cmo ON e.id = cmo.occ_student_id
        WHERE e.sge_status = 'Ativo'
      `;
      
      const params: any[] = [];
      let paramIdx = 1;

      if (search) {
        queryStr += ` AND (e.sge_civil_name ILIKE $${paramIdx} OR e.sge_social_name ILIKE $${paramIdx} OR e.sge_class_name ILIKE $${paramIdx})`;
        params.push(`%${search}%`);
        paramIdx++;
      }

      queryStr += ` ORDER BY 
        CASE WHEN e.sge_class_name LIKE '%${currentYear}%' THEN 0 ELSE 1 END,
        month_severity DESC, 
        random() 
        LIMIT 40`;
      
      const result = await query(queryStr, params);
      console.log(`Active list query returned ${result.rows.length} rows for search: "${search || ''}"`);
      res.json(result.rows);
    } catch (err) {
      console.error("Error in /api/students/active-list:", err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get("/api/stats/active-students", async (req, res) => {
    try {
      const result = await query(`
        SELECT COUNT(*) AS total_number_students
        FROM sge_extracted_data
        WHERE RIGHT(sge_class_name, 4) = EXTRACT(YEAR FROM CURRENT_DATE)::text
          AND sge_status = 'Ativo'
      `);
      res.json({ total: parseInt(result.rows[0].total_number_students) || 0 });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get("/api/students", async (req, res) => {
    const { search, mode } = req.query;
    try {
      const currentYear = new Date().getFullYear().toString();
      
      let queryStr = `
        WITH current_month_occurrences AS (
            SELECT 
                occ_student_id,
                MAX(CASE 
                    WHEN occ_severity = 'Alta' THEN 3 
                    WHEN occ_severity = 'Média' THEN 2 
                    WHEN occ_severity = 'Baixa' THEN 1 
                    ELSE 0 
                END) as max_severity
            FROM occurrences
            WHERE (CASE 
                WHEN occ_date ~ '^\d{4}-\d{2}-\d{2}' THEN CAST(occ_date AS TIMESTAMP)
                WHEN occ_date ~ '^\d{2}/\d{2}/\d{4}' THEN to_timestamp(occ_date, 'DD/MM/YYYY')
                ELSE NULL 
            END) >= date_trunc('month', current_date)
            GROUP BY occ_student_id
        )
        SELECT 
          e.id,
          e.sge_civil_name as name,
          e.sge_social_name as social_name,
          e.sge_class_name as classroom,
          e.sge_photo as profile_image,
          e.sge_birthday as birth_date,
          e.sge_status as status,
          e.sge_pcd_info as pcd_info,
          e.sge_transgender as transgender,
          COALESCE(cmo.max_severity, 0) as month_severity,
          r.resp_name, r.resp_relationship, r.resp_other_relationship, 
          r.resp_contact_phone, r.resp_backup_phone, r.resp_landline, 
          r.resp_work_phone, r.resp_email
        FROM sge_extracted_data e
        LEFT JOIN students s ON e.id = s.id
        LEFT JOIN legal_responsible r ON s.std_responsible_id = r.id 
        LEFT JOIN current_month_occurrences cmo ON e.id = cmo.occ_student_id
        WHERE e.sge_status = 'Ativo'
      `;
      
      const params: any[] = [];
      let paramIdx = 1;

      if (search) {
        queryStr += ` AND (e.sge_civil_name ILIKE $${paramIdx} OR e.sge_social_name ILIKE $${paramIdx} OR e.sge_class_name ILIKE $${paramIdx})`;
        params.push(`%${search}%`);
        paramIdx++;
      }

      if (mode === 'list') {
        queryStr += ` ORDER BY 
          CASE WHEN e.sge_class_name LIKE '%${currentYear}%' THEN 0 ELSE 1 END,
          month_severity DESC, 
          random() 
          LIMIT 40`;
      } else {
        queryStr += ` ORDER BY e.sge_civil_name ASC`;
      }

      const result = await query(queryStr, params);
      res.json(result.rows.map(s => ({
        id: s.id,
        name: s.name,
        social_name: s.social_name,
        grade: s.classroom ? s.classroom.split(' - ')[0] : '',
        classroom: s.classroom,
        profile_image: s.profile_image,
        birth_date: s.birth_date,
        status: s.status,
        month_severity: s.month_severity,
        responsible_name: s.resp_name,
        relationship: s.resp_relationship,
        other_relationship: s.resp_other_relationship,
        contact_phone: s.resp_contact_phone,
        backup_phone: s.resp_backup_phone,
        landline: s.resp_landline,
        work_phone: s.resp_work_phone,
        email: s.resp_email,
        pcd_status: s.pcd_info ? 'com_laudo' : '',
        pcd_info: s.pcd_info,
        transgender: s.transgender
      })));
    } catch (err) {
      console.error("Error in /api/students:", err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/students", async (req, res) => {
    const s = req.body;
    try {
      await query("BEGIN");
      
      // 1. Insert Responsible
      const respId = crypto.randomUUID();
      await query(
        "INSERT INTO legal_responsible (id, resp_name, resp_relationship, resp_other_relationship, resp_contact_phone, resp_backup_phone, resp_landline, resp_work_phone, resp_email) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        [respId, s.responsibleName, s.relationship, s.otherRelationship, s.contactPhone, s.backupPhone, s.landline, s.workPhone, s.email]
      );

      // 2. Insert Student
      await query(
        "INSERT INTO students (id, std_name, std_social_name, std_grade, std_classroom, std_room, std_turn, std_birth_date, std_responsible_id, std_profile_image, std_observations, std_is_aee, std_pcd_status, std_cid, std_investigation_description, std_school_need, std_pedagogical_evaluation_type, std_status, std_school_academic_year, std_manual_insert, std_gender, std_cpf, std_matricula, std_signed_form, std_legal_consent) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)",
        [s.id, s.name, s.socialName, s.grade, s.classroom, s.room, s.turn, s.birthDate, respId, s.profileImage, s.observations, s.isAEE || false, s.pcdStatus, s.cid, s.investigationDescription, s.schoolNeed, s.pedagogicalEvaluationType, s.status || 'Ativo', s.schoolAcademicYear, s.manualInsert || false, s.gender, s.cpf, s.matricula, s.signedForm || false, s.legalConsent || false]
      );

      // 3. Insert into sge_extracted_data to ensure student appears in lists
      await query(
        "INSERT INTO sge_extracted_data (id, sge_photo, sge_civil_name, sge_social_name, sge_transgender, sge_cpf, sge_class_name, sge_student_registration, sge_birthday, sge_pcd_info, sge_school_academic_year, sge_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)",
        [s.id, s.profileImage, s.name, s.socialName, s.useSocialName || false, s.cpf, s.classroom, s.matricula, s.birthDate, s.cid, s.schoolAcademicYear, s.status || 'Ativo']
      );
      
      await query("COMMIT");
      res.status(201).json({ success: true });
    } catch (err) {
      await query("ROLLBACK");
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.delete("/api/students/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await query("BEGIN");
      
      // Get responsible ID before deleting student
      const student = await query("SELECT std_responsible_id FROM students WHERE id = $1", [id]);
      const respId = student.rows[0]?.std_responsible_id;

      // Delete occurrences
      await query("DELETE FROM occurrences WHERE occ_student_id = $1", [id]);
      
      // Delete student
      await query("DELETE FROM students WHERE id = $1", [id]);
      
      // Delete responsible
      if (respId) {
        await query("DELETE FROM legal_responsible WHERE id = $1", [respId]);
      }
      
      await query("COMMIT");
      res.json({ success: true });
    } catch (err) {
      await query("ROLLBACK");
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.put("/api/students/:id", async (req, res) => {
    const { id } = req.params;
    const s = req.body;
    try {
      await query("BEGIN");
      
      // Get responsible ID
      const student = await query("SELECT std_responsible_id FROM students WHERE id = $1", [id]);
      const respId = student.rows[0]?.std_responsible_id;

      if (respId) {
        // Update Responsible
        await query(
          "UPDATE legal_responsible SET resp_name=$1, resp_relationship=$2, resp_other_relationship=$3, resp_contact_phone=$4, resp_backup_phone=$5, resp_landline=$6, resp_work_phone=$7, resp_email=$8 WHERE id=$9",
          [s.responsibleName, s.relationship, s.otherRelationship, s.contactPhone, s.backupPhone, s.landline, s.workPhone, s.email, respId]
        );
      }

      // Update Student
      await query(
        "UPDATE students SET std_name=$1, std_social_name=$2, std_grade=$3, std_classroom=$4, std_room=$5, std_turn=$6, std_birth_date=$7, std_profile_image=$8, std_observations=$9, std_is_aee=$10, std_pcd_status=$11, std_cid=$12, std_investigation_description=$13, std_school_need=$14, std_pedagogical_evaluation_type=$15, std_status=$16, std_school_academic_year=$17, std_manual_insert=$18, std_gender=$19, std_cpf=$20, std_matricula=$21, std_signed_form=$22, std_legal_consent=$23 WHERE id=$24",
        [s.name, s.socialName, s.grade, s.classroom, s.room, s.turn, s.birthDate, s.profileImage, s.observations, s.isAEE || false, s.pcdStatus, s.cid, s.investigationDescription, s.schoolNeed, s.pedagogicalEvaluationType, s.status, s.schoolAcademicYear, s.manualInsert, s.gender, s.cpf, s.matricula, s.signedForm || false, s.legalConsent || false, id]
      );

      // Update sge_extracted_data to ensure student list is consistent
      await query(
        "INSERT INTO sge_extracted_data (id, sge_photo, sge_civil_name, sge_social_name, sge_transgender, sge_cpf, sge_class_name, sge_student_registration, sge_birthday, sge_pcd_info, sge_school_academic_year, sge_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) ON CONFLICT (id) DO UPDATE SET sge_photo=EXCLUDED.sge_photo, sge_civil_name=EXCLUDED.sge_civil_name, sge_social_name=EXCLUDED.sge_social_name, sge_transgender=EXCLUDED.sge_transgender, sge_cpf=EXCLUDED.sge_cpf, sge_class_name=EXCLUDED.sge_class_name, sge_student_registration=EXCLUDED.sge_student_registration, sge_birthday=EXCLUDED.sge_birthday, sge_pcd_info=EXCLUDED.sge_pcd_info, sge_school_academic_year=EXCLUDED.sge_school_academic_year, sge_status=EXCLUDED.sge_status",
        [id, s.profileImage, s.name, s.socialName, s.useSocialName || false, s.cpf, s.classroom, s.matricula, s.birthDate, s.cid, s.schoolAcademicYear, s.status]
      );
      
      await query("COMMIT");
      res.json({ success: true });
    } catch (err) {
      await query("ROLLBACK");
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Occurrences
  app.get("/api/occurrences", async (req, res) => {
    try {
      const result = await query("SELECT * FROM occurrences ORDER BY occ_date DESC");
      res.json(result.rows.map(o => ({
        id: o.id,
        studentId: o.occ_student_id,
        date: o.occ_date,
        type: o.occ_type,
        severity: o.occ_severity,
        titles: o.occ_titles,
        description: o.occ_description,
        reporterName: o.occ_reporter_name,
        reporterId: o.occ_reporter_id,
        status: o.occ_status,
        userId: o.occ_user_id
      })));
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/occurrences", async (req, res) => {
    const o = req.body;
    try {
      await query(
        "INSERT INTO occurrences (id, occ_student_id, occ_date, occ_type, occ_severity, occ_titles, occ_description, occ_reporter_name, occ_reporter_id, occ_status, occ_user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
        [o.id, o.studentId, o.date, o.type, o.severity, o.titles, o.description, o.reporterName, o.reporterId, o.status || 'Pendente', o.userId]
      );
      res.status(201).json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.delete("/api/occurrences/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await query("DELETE FROM occurrences WHERE id = $1", [id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Visual Identity
  app.get("/api/visual-identity", async (req, res) => {
    try {
      const result = await query("SELECT * FROM visual_identity ORDER BY vis_created_at DESC LIMIT 1");
      if (result.rows.length > 0) {
        const v = result.rows[0];
        res.json({
          id: v.id,
          useVisualIdentity: v.vis_usevisual_identity,
          unitId: v.vis_name_id,
          leftLogo: v.vis_docheaderlft_image,
          headerText: v.vis_docheadercnt,
          rightLogo: v.vis_docheaderrgh_image,
          useFooter: v.vis_footer,
          showHeaderText: v.vis_show_header_text,
          showFooterText: v.vis_show_footer_text,
          showFooterDivider: v.vis_show_footer_divider
        });
      } else {
        res.json(null);
      }
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/visual-identity", async (req, res) => {
    const v = req.body;
    try {
      await query(
        "INSERT INTO visual_identity (vis_usevisual_identity, vis_name_id, vis_docheaderlft_image, vis_docheadercnt, vis_docheaderrgh_image, vis_footer, vis_show_header_text, vis_show_footer_text, vis_show_footer_divider) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        [v.useVisualIdentity, v.unitId, v.leftLogo, v.headerText, v.rightLogo, v.useFooter, v.showHeaderText, v.showFooterText, v.showFooterDivider]
      );
      res.status(201).json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.put("/api/occurrences/:id", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
      await query("UPDATE occurrences SET occ_status = $1 WHERE id = $2", [status, id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Logs
  app.get("/api/logs", async (req, res) => {
    try {
      const result = await query("SELECT * FROM access_logs ORDER BY acc_timestamp DESC LIMIT 200");
      res.json(result.rows.map(l => ({
        timestamp: l.acc_timestamp,
        user_id: l.acc_user_id,
        event: l.acc_event,
        status: l.acc_status,
        description: l.acc_description,
        ip_address: l.acc_ip_address,
        user_agent: l.acc_user_agent,
        device_info: l.acc_device_info
      })));
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/logs", async (req, res) => {
    const l = req.body;
    try {
      await query(
        "INSERT INTO access_logs (acc_timestamp, acc_user_id, acc_event, acc_status, acc_description, acc_ip_address, acc_user_agent, acc_device_info) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [
          l.timestamp || new Date().toISOString(), 
          l.userId || l.user_id || 'anonymous', 
          l.event, 
          l.status, 
          l.description, 
          l.ipAddress || l.ip_address, 
          l.userAgent || l.user_agent, 
          JSON.stringify(l.deviceInfo || l.device_info || {})
        ]
      );
      res.status(201).json({ success: true });
    } catch (err) {
      console.error("Log insertion error:", err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.delete("/api/logs", async (req, res) => {
    try {
      await query("DELETE FROM access_logs");
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get("/api/admins", async (req, res) => {
    try {
      const result = await query("SELECT id, usr_name as name, usr_password as password FROM users WHERE usr_is_system_admin = TRUE AND usr_status = 'Ativo'");
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // System Options Routes
  app.get("/api/options/curricular-components", async (req, res) => {
    try {
      const result = await query("SELECT id, cur_component as value FROM curricular_component ORDER BY cur_component");
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get("/api/options/subjects", async (req, res) => {
    try {
      const result = await query("SELECT id, sbj_subjects as value FROM subjects ORDER BY sbj_subjects");
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get("/api/options/work-schedules", async (req, res) => {
    try {
      const result = await query("SELECT id, wrk_schedules as value FROM work_schedules ORDER BY wrk_schedules");
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get("/api/options/work-shifts", async (req, res) => {
    try {
      const result = await query("SELECT id, wrk_shift as value FROM work_shift ORDER BY wrk_shift");
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get("/api/options/kinship", async (req, res) => {
    try {
      const result = await query("SELECT id, kns_kinship as value FROM kinship ORDER BY kns_kinship");
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get("/api/options/genders", async (req, res) => {
    try {
      const result = await query("SELECT id, gen_type as value FROM gender_types ORDER BY gen_type");
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get("/api/options/positions", async (req, res) => {
    try {
      const result = await query("SELECT id, pos_type as value, pos_abbreviation as abbreviation FROM positions ORDER BY pos_type");
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get("/api/options/organizational-chart", async (req, res) => {
    try {
      const result = await query("SELECT id, org_name as value FROM organizational_chart ORDER BY org_name");
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get("/api/options/local-units", async (req, res) => {
    try {
      const result = await query("SELECT id, loc_name as value, loc_organization_chart_id as \"organizationChartId\" FROM local_unit ORDER BY loc_name");
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get("/api/options/occurrence-classifications", async (req, res) => {
    try {
      const severities = await query("SELECT id, level, description_level as description FROM severity_categories ORDER BY level");
      const types = await query("SELECT id, category_id, occurrence_description as description FROM occurrence_types");
      
      const classifications = severities.rows.map(severity => ({
        ...severity,
        items: types.rows
          .filter(t => t.category_id === severity.id)
          .map(t => t.description)
      }));
      
      res.json(classifications);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/reset-db", async (req, res) => {
    const { adminId, password } = req.body;
    try {
      // Verify admin password
      const adminCheck = await query("SELECT usr_password as password FROM users WHERE id = $1 AND usr_is_system_admin = TRUE", [adminId]);
      if (adminCheck.rows.length === 0 || adminCheck.rows[0].password !== password) {
        return res.status(401).json({ error: "Senha incorreta ou usuário sem privilégios." });
      }

      // Drop all tables to simulate "DROP DATABASE" behavior
      await query("DROP TABLE IF EXISTS occurrences CASCADE");
      await query("DROP TABLE IF EXISTS students CASCADE");
      await query("DROP TABLE IF EXISTS legal_responsible CASCADE");
      await query("DROP TABLE IF EXISTS access_logs CASCADE");
      await query("DROP TABLE IF EXISTS sge_extracted_data CASCADE");
      await query("DROP TABLE IF EXISTS users CASCADE");
      
      // Re-initialize database and seed initial admin
      await initDb();

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/restore-db", async (req, res) => {
    const { students, occurrences, users, logs } = req.body;
    try {
      await query("BEGIN");
      await query("TRUNCATE occurrences, students, legal_responsible, access_logs RESTART IDENTITY CASCADE");
      await query("DELETE FROM users WHERE id != 'admin_seed'");

      if (students && Array.isArray(students)) {
        for (const s of students) {
          const respId = crypto.randomUUID();
          await query(
            "INSERT INTO legal_responsible (id, resp_name, resp_relationship, resp_other_relationship, resp_contact_phone, resp_backup_phone, resp_landline, resp_work_phone, resp_email) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
            [respId, s.responsibleName || s.responsible_name, s.relationship, s.otherRelationship || s.other_relationship, s.contactPhone || s.contact_phone, s.backupPhone || s.backup_phone, s.landline, s.workPhone || s.work_phone, s.email]
          );

          await query(
            "INSERT INTO students (id, std_name, std_social_name, std_grade, std_classroom, std_room, std_turn, std_birth_date, std_responsible_id, std_profile_image, std_observations, std_is_aee, std_pcd_status, std_cid, std_investigation_description, std_school_need, std_pedagogical_evaluation_type, std_status, std_school_academic_year, std_manual_insert) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)",
            [s.id, s.name, s.socialName || s.social_name, s.grade, s.classroom, s.room, s.turn, s.birthDate || s.birth_date, respId, s.profileImage || s.profile_image, s.observations, s.isAEE || s.is_aee || false, s.pcdStatus || s.pcd_status, s.cid, s.investigationDescription || s.investigation_description, s.schoolNeed || s.school_need, s.pedagogicalEvaluationType || s.pedagogical_evaluation_type, s.status || 'Ativo', s.schoolAcademicYear, s.manualInsert || false]
          );
        }
      }

      if (occurrences && Array.isArray(occurrences)) {
        for (const o of occurrences) {
          await query(
            "INSERT INTO occurrences (id, occ_student_id, occ_date, occ_type, occ_severity, occ_titles, occ_description, occ_reporter_name, occ_reporter_id, occ_status, occ_user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
            [o.id, o.studentId || o.student_id, o.date, o.type, o.severity, o.titles, o.description, o.reporterName || o.reporter_name, o.reporterId || o.reporter_id, o.status, o.userId || o.user_id]
          );
        }
      }

      if (users && Array.isArray(users)) {
        for (const u of users) {
          if (u.id === 'admin_seed') continue;
          await query(
            "INSERT INTO users (id, usr_name, usr_social_name, usr_role, usr_email, usr_cpf, usr_status, usr_secretaria, usr_lotacao, usr_matricula, usr_phone, usr_phone2, usr_cargo, usr_profile_image, usr_is_system_admin, usr_gender, usr_birth_date, usr_components, usr_disciplines, usr_carga_horaria, usr_turno_trabalho, usr_additional_info, usr_has_custom_schedule, usr_custom_schedule_details) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)",
            [u.id, u.name || u.usr_name, u.socialName || u.usr_social_name || u.social_name, u.role || u.usr_role, u.email || u.usr_email, u.cpf || u.usr_cpf, u.status || u.usr_status, u.secretaria || u.usr_secretaria, u.lotacao || u.usr_lotacao, u.matricula || u.usr_matricula, u.phone || u.usr_phone, u.phone2 || u.usr_phone2 || u.phone2, u.cargo || u.usr_cargo || u.cargo, u.profileImage || u.usr_profile_image || u.profile_image, u.isSystemAdmin || u.usr_is_system_admin || u.is_system_admin, u.gender || u.usr_gender, u.birthDate || u.usr_birth_date || u.birth_date, u.components || u.usr_components || u.components, u.disciplines || u.usr_disciplines || u.disciplines, u.cargaHoraria || u.usr_carga_horaria || u.carga_horaria, u.turnoTrabalho || u.usr_turno_trabalho || u.turno_trabalho, u.additionalInfo || u.usr_additional_info || u.additional_info, u.hasCustomSchedule || u.usr_has_custom_schedule || u.has_custom_schedule, u.customScheduleDetails || u.usr_custom_schedule_details || u.custom_schedule_details]
          );
        }
      }

      if (logs && Array.isArray(logs)) {
        for (const l of logs) {
          await query(
            "INSERT INTO access_logs (acc_timestamp, acc_user_id, acc_event, acc_status, acc_description, acc_ip_address, acc_user_agent, acc_device_info) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
            [l.timestamp || l.acc_timestamp, l.userId || l.user_id || l.acc_user_id, l.event || l.acc_event, l.status || l.acc_status, l.description || l.acc_description, l.ipAddress || l.ip_address || l.acc_ip_address, l.userAgent || l.user_agent || l.acc_user_agent, typeof l.deviceInfo === 'string' ? l.deviceInfo : JSON.stringify(l.deviceInfo || l.device_info || l.acc_device_info)]
          );
        }
      }

      await query("COMMIT");
      res.json({ success: true });
    } catch (err) {
      await query("ROLLBACK");
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
