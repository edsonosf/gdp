
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

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Helper to record logs
  const recordLog = async (userId: string | null, event: string, status: string, description: string, req?: express.Request) => {
    try {
      await query(
        "INSERT INTO access_logs (acc_timestamp, acc_user_id, acc_event, acc_status, acc_description, acc_ip_address, acc_user_agent, acc_device_info) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [
          new Date().toISOString(),
          userId || 'system',
          event,
          status,
          description,
          req?.ip || '',
          req?.headers['user-agent'] || '',
          JSON.stringify({})
        ]
      );
    } catch (err) {
      console.error("Failed to record log:", err);
    }
  };

  // Initialize DB
  try {
    await initDb();
    await recordLog(null, 'system.startup', 'success', 'Servidor iniciado e banco de dados conectado.');
  } catch (err) {
    console.error("Failed to initialize DB:", err);
  }

  // Login Endpoint
  app.post("/api/login", async (req, res) => {
    const { usuario, password, deviceInfo } = req.body;

    const recordLoginLog = async (status: string, userId: string | null, description: string) => {
      await query(
        "INSERT INTO access_logs (acc_timestamp, acc_user_id, acc_event, acc_status, acc_description, acc_ip_address, acc_user_agent, acc_device_info) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [
          new Date().toISOString(),
          userId || usuario || 'anonymous',
          'user.login',
          status,
          description,
          req.ip || '',
          req.headers['user-agent'] || '',
          JSON.stringify(deviceInfo || {})
        ]
      );
    };

    if (!usuario || !password) {
      await recordLoginLog('failure', null, 'Por favor, preencha os dados corretamente.');
      return res.status(400).json({ error: "Por favor, preencha os dados corretamente." });
    }

    try {
      // Busca o usuário por CPF ou Email
      const result = await query(
        `SELECT * FROM users WHERE 
         usr_cpf = $1 OR 
         usr_email = $1 OR 
         REPLACE(REPLACE(usr_cpf, '.', ''), '-', '') = $2`,
        [usuario, usuario.replace(/\D/g, '')]
      );

      if (result.rows.length === 0) {
        await recordLoginLog('failure', null, 'Tentativa com Usuário não cadastrado');
        return res.status(404).json({ error: "Tentativa com Usuário não cadastrado" });
      }

      const user = result.rows[0];
      const unmaskedPhone = user.usr_phone ? user.usr_phone.replace(/\D/g, '') : '';
      const isValidPassword = user.usr_password === password || unmaskedPhone === password;

      if (!isValidPassword) {
        await recordLoginLog('failure', user.id, 'Senha incorreta');
        return res.status(401).json({ error: "Senha incorreta" });
      }

      if (user.usr_status === 'Inativo') {
        await recordLoginLog('failure', user.id, 'Tentativa com conta inativa');
        return res.status(403).json({ error: "Tentativa com conta inativa" });
      }

      // Verifica se é o primeiro logon bem-sucedido
      const loginCountResult = await query(
        "SELECT COUNT(*) FROM access_logs WHERE acc_user_id = $1 AND acc_event = 'user.login' AND acc_status = 'success'",
        [user.id]
      );
      const isFirstLogin = parseInt(loginCountResult.rows[0].count) === 0;

      // Sucesso
      await recordLoginLog('success', user.id, 'Login realizado com sucesso');
      
      // Remove a senha do objeto de retorno e mapeia para nomes amigáveis no frontend
      const userResponse = {
        id: user.id,
        name: user.usr_name,
        socialName: user.usr_social_name,
        useSocialName: user.usr_use_social_name,
        role: user.usr_role,
        email: user.usr_email,
        cpf: user.usr_cpf,
        status: user.usr_status,
        isSystemAdmin: user.usr_is_system_admin,
        profileImage: user.usr_profile_image,
        requirePasswordChange: isFirstLogin
      };
      
      res.json(userResponse);

    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Update Password Endpoint
  app.put("/api/users/:id/password", async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "A nova senha deve ter pelo menos 6 caracteres." });
    }

    try {
      await query(
        "UPDATE users SET usr_password = $1 WHERE id = $2",
        [newPassword, id]
      );
      
      // Log the password change
      await query(
        "INSERT INTO access_logs (acc_timestamp, acc_user_id, acc_event, acc_status, acc_description) VALUES ($1, $2, $3, $4, $5)",
        [new Date().toISOString(), id, 'user.password_change', 'success', 'Senha alterada com sucesso no primeiro logon']
      );

      res.json({ success: true });
    } catch (err) {
      console.error("Password update error:", err);
      res.status(500).json({ error: "Erro ao atualizar a senha" });
    }
  });

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
          
          // Também atualiza a tabela sge_extracted_data se o ID existir lá
          await query("UPDATE sge_extracted_data SET sge_photo = $1 WHERE id = $2", [base64, record.id]);
          
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
      await recordLog(null, 'user.create', 'success', `Usuário ${u.name} criado com sucesso.`, req);
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
      await recordLog(null, 'user.update', 'success', `Usuário ${u.name} atualizado com sucesso.`, req);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await query("DELETE FROM users WHERE id = $1", [id]);
      await recordLog(null, 'user.delete', 'success', `Usuário com ID ${id} removido.`, req);
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
        "INSERT INTO legal_responsible (id, resp_name, resp_relationship, resp_other_relationship, resp_contact_phone, resp_backup_phone, resp_landline, resp_work_phone, resp_email, resp_observations, resp_profile_image, resp_legal_consent) VALUES ($1, UPPER($2), $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)",
        [respId, r.name, r.relationship, r.otherRelationship, r.contactPhone, r.backupPhone, r.landline, r.workPhone, r.email, r.observations, r.profileImage, r.legalConsent]
      );

      // Link students if provided
      if (r.linkedStudents && r.linkedStudents.length > 0) {
        for (const student of r.linkedStudents) {
          await query("UPDATE sge_extracted_data SET app_responsible_id = $1 WHERE id = $2", [respId, student.id]);
        }
      }

      await query("COMMIT");
      res.status(201).json({ success: true, id: respId });
    } catch (err) {
      await query("ROLLBACK");
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get("/api/responsibles", async (req, res) => {
    const { search } = req.query;
    try {
      let queryStr = "SELECT id, resp_name as name, resp_contact_phone as \"contactPhone\", resp_email as email FROM legal_responsible";
      const params: any[] = [];
      if (search) {
        queryStr += " WHERE resp_name ILIKE $1 OR resp_contact_phone ILIKE $1 OR resp_email ILIKE $1";
        params.push(`%${search}%`);
      }
      queryStr += " ORDER BY resp_name ASC LIMIT 20";
      const result = await query(queryStr, params);
      res.json(result.rows);
    } catch (err) {
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
        COALESCE(cmo.max_severity, 0) DESC, 
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
        WHERE sge_status = 'Ativo'
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
          e.sge_social_name as "socialName",
          e.sge_class_name as classroom,
          e.sge_photo as "profileImage",
          e.sge_birthday as "birthDate",
          e.sge_status as status,
          e.sge_pcd_info as "pcdInfo",
          e.sge_transgender as transgender,
          e.app_grade as grade,
          e.app_room as room,
          e.app_turn as turn,
          e.app_observations as observations,
          e.app_is_aee as "isAEE",
          e.app_pcd_status as "pcdStatus",
          e.app_cid as cid,
          e.app_investigation_description as "investigationDescription",
          e.app_school_need as "schoolNeed",
          e.app_pedagogical_evaluation_type as "pedagogicalEvaluationType",
          e.app_school_academic_year as "schoolAcademicYear",
          e.app_manual_insert as "manualInsert",
          e.app_gender as gender,
          e.sge_cpf as cpf,
          e.sge_student_registration as matricula,
          e.app_signed_form as "signedForm",
          e.app_legal_consent as "legalConsent",
          COALESCE(cmo.max_severity, 0) as month_severity,
          r.resp_name as "responsibleName", 
          r.resp_relationship as relationship, 
          r.resp_other_relationship as "otherRelationship", 
          r.resp_contact_phone as "contactPhone", 
          r.resp_backup_phone as "backupPhone", 
          r.resp_landline as landline, 
          r.resp_work_phone as "workPhone", 
          r.resp_email as email
        FROM sge_extracted_data e
        LEFT JOIN legal_responsible r ON e.app_responsible_id = r.id 
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
          COALESCE(cmo.max_severity, 0) DESC, 
          random() 
          LIMIT 40`;
      } else {
        queryStr += ` ORDER BY e.sge_civil_name ASC`;
      }

      const result = await query(queryStr, params);
      res.json(result.rows.map(s => ({
        id: s.id,
        name: s.name,
        socialName: s.socialName,
        grade: s.grade || (s.classroom ? s.classroom.split(' - ')[0] : ''),
        classroom: s.classroom,
        room: s.room,
        turn: s.turn,
        birthDate: s.birthDate,
        profileImage: s.profileImage,
        observations: s.observations,
        isAEE: s.isAEE,
        pcdStatus: s.pcdStatus,
        cid: s.cid,
        investigationDescription: s.investigationDescription,
        schoolNeed: s.schoolNeed,
        pedagogicalEvaluationType: s.pedagogicalEvaluationType,
        status: s.status,
        schoolAcademicYear: s.schoolAcademicYear,
        manualInsert: s.manualInsert,
        gender: s.gender,
        cpf: s.cpf,
        matricula: s.matricula,
        signedForm: s.signedForm,
        legalConsent: s.legalConsent,
        monthSeverity: s.month_severity,
        pcdInfo: s.pcdInfo,
        responsibleName: s.responsibleName,
        relationship: s.relationship,
        otherRelationship: s.otherRelationship,
        contactPhone: s.contactPhone,
        backupPhone: s.backupPhone,
        landline: s.landline,
        workPhone: s.workPhone,
        email: s.email,
        transgender: s.transgender
      })));
    } catch (err) {
      console.error("Error in /api/students:", err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/students", async (req, res) => {
    const s = req.body;
    console.log("Registering student:", s.name);
    try {
      await query("BEGIN");
      
      // 1. Handle Responsible
      let respId = s.responsibleId || null;
      if (!respId && s.responsibleName) {
        respId = crypto.randomUUID();
        await query(
          "INSERT INTO legal_responsible (id, resp_name, resp_relationship, resp_other_relationship, resp_contact_phone, resp_backup_phone, resp_landline, resp_work_phone, resp_email) VALUES ($1, UPPER($2), $3, $4, $5, $6, $7, $8, $9)",
          [respId, s.responsibleName, s.relationship, s.otherRelationship, s.contactPhone, s.backupPhone, s.landline, s.workPhone, s.email]
        );
      }

      // 2. Insert into sge_extracted_data
      await query(
        "INSERT INTO sge_extracted_data (id, sge_photo, sge_civil_name, sge_social_name, sge_transgender, sge_cpf, sge_class_name, sge_student_registration, sge_birthday, sge_pcd_info, sge_school_academic_year, sge_status, app_responsible_id, app_observations, app_is_aee, app_pcd_status, app_cid, app_investigation_description, app_school_need, app_pedagogical_evaluation_type, app_grade, app_classroom, app_room, app_turn, app_manual_insert, app_signed_form, app_legal_consent, app_gender) VALUES ($1, $2, UPPER($3), UPPER($4), $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)",
        [s.id, s.profileImage, s.name, s.socialName, s.useSocialName || false, s.cpf, s.classroom, s.matricula, s.birthDate, s.cid, s.schoolAcademicYear, s.status || 'Ativo', respId, s.observations, s.isAEE || false, s.pcdStatus, s.cid, s.investigationDescription, s.schoolNeed, s.pedagogicalEvaluationType, s.grade, s.app_classroom || s.classroom, s.room, s.turn, s.manualInsert || false, s.signedForm || false, s.legalConsent || false, s.gender]
      );
      
      await query("COMMIT");
      await recordLog(null, 'student.create', 'success', `Aluno ${s.name} cadastrado com sucesso.`, req);
      console.log("Student registered successfully:", s.name);
      res.status(201).json({ success: true });
    } catch (err) {
      await query("ROLLBACK");
      console.error("Error registering student:", err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.delete("/api/students/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await query("BEGIN");
      
      // Get responsible ID before deleting student
      const student = await query("SELECT app_responsible_id FROM sge_extracted_data WHERE id = $1", [id]);
      const respId = student.rows[0]?.app_responsible_id;

      // Delete occurrences
      await query("DELETE FROM occurrences WHERE occ_student_id = $1", [id]);
      
      // Delete student from sge_extracted_data
      await query("DELETE FROM sge_extracted_data WHERE id = $1", [id]);
      
      // Delete responsible
      if (respId) {
        await query("DELETE FROM legal_responsible WHERE id = $1", [respId]);
      }
      
      await query("COMMIT");
      await recordLog(null, 'student.delete', 'success', `Aluno com ID ${id} removido.`, req);
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
      
      // Handle Responsible update/link
      let finalRespId = s.responsibleId;
      
      if (!finalRespId && s.responsibleName) {
        // Create new responsible if name provided but no ID
        finalRespId = crypto.randomUUID();
        await query(
          "INSERT INTO legal_responsible (id, resp_name, resp_relationship, resp_other_relationship, resp_contact_phone, resp_backup_phone, resp_landline, resp_work_phone, resp_email) VALUES ($1, UPPER($2), $3, $4, $5, $6, $7, $8, $9)",
          [finalRespId, s.responsibleName, s.relationship, s.otherRelationship, s.contactPhone, s.backupPhone, s.landline, s.workPhone, s.email]
        );
      } else if (finalRespId) {
        // Update existing responsible if needed
        await query(
          "UPDATE legal_responsible SET resp_name=UPPER($1), resp_relationship=$2, resp_other_relationship=$3, resp_contact_phone=$4, resp_backup_phone=$5, resp_landline=$6, resp_work_phone=$7, resp_email=$8 WHERE id=$9",
          [s.responsibleName, s.relationship, s.otherRelationship, s.contactPhone, s.backupPhone, s.landline, s.workPhone, s.email, finalRespId]
        );
      }

      // Update sge_extracted_data
      await query(
        "UPDATE sge_extracted_data SET sge_photo=$1, sge_civil_name=UPPER($2), sge_social_name=UPPER($3), sge_transgender=$4, sge_cpf=$5, sge_class_name=$6, sge_student_registration=$7, sge_birthday=$8, sge_pcd_info=$9, sge_school_academic_year=$10, sge_status=$11, app_observations=$12, app_is_aee=$13, app_pcd_status=$14, app_cid=$15, app_investigation_description=$16, app_school_need=$17, app_pedagogical_evaluation_type=$18, app_grade=$19, app_classroom=$20, app_room=$21, app_turn=$22, app_manual_insert=$23, app_signed_form=$24, app_legal_consent=$25, app_gender=$26, app_responsible_id=$27 WHERE id=$28",
        [s.profileImage, s.name, s.socialName, s.useSocialName || false, s.cpf, s.classroom, s.matricula, s.birthDate, s.cid, s.schoolAcademicYear, s.status, s.observations, s.isAEE || false, s.pcdStatus, s.cid, s.investigationDescription, s.schoolNeed, s.pedagogicalEvaluationType, s.grade, s.classroom, s.room, s.turn, s.manualInsert, s.signedForm || false, s.legalConsent || false, s.gender, finalRespId, id]
      );
      
      await query("COMMIT");
      await recordLog(null, 'student.update', 'success', `Aluno ${s.name} atualizado com sucesso.`, req);
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
      await recordLog(o.userId, 'occurrence.create', 'success', `Ocorrência registrada para o aluno ID ${o.studentId}.`, req);
      res.status(201).json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.delete("/api/occurrences/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await query("DELETE FROM occurrences WHERE id = $1", [id]);
      await recordLog(null, 'occurrence.delete', 'success', `Ocorrência com ID ${id} removida.`, req);
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
      await recordLog(null, 'occurrence.update_status', 'success', `Status da ocorrência ${id} alterado para ${status}.`, req);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Logs
  app.get("/api/logs", async (req, res) => {
    try {
      const result = await query(`
        SELECT l.*, u.usr_name as user_name 
        FROM access_logs l 
        LEFT JOIN users u ON l.acc_user_id = u.id::TEXT 
        ORDER BY l.acc_timestamp DESC 
        LIMIT 200
      `);
      console.log(`Fetched ${result.rows.length} logs`);
      res.json(result.rows.map(l => ({
        timestamp: l.acc_timestamp,
        user_id: l.acc_user_id,
        user_name: l.user_name || l.acc_user_id,
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
      await query("TRUNCATE occurrences, sge_extracted_data, legal_responsible, access_logs RESTART IDENTITY CASCADE");
      await query("DELETE FROM users WHERE id != 'admin_seed'");

      if (students && Array.isArray(students)) {
        for (const s of students) {
          const respId = crypto.randomUUID();
          await query(
            "INSERT INTO legal_responsible (id, resp_name, resp_relationship, resp_other_relationship, resp_contact_phone, resp_backup_phone, resp_landline, resp_work_phone, resp_email) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
            [respId, s.responsibleName || s.responsible_name, s.relationship, s.otherRelationship || s.other_relationship, s.contactPhone || s.contact_phone, s.backupPhone || s.backup_phone, s.landline, s.workPhone || s.work_phone, s.email]
          );

          await query(
            "INSERT INTO sge_extracted_data (id, sge_photo, sge_civil_name, sge_social_name, sge_transgender, sge_cpf, sge_class_name, sge_student_registration, sge_birthday, sge_pcd_info, sge_school_academic_year, sge_status, app_responsible_id, app_observations, app_is_aee, app_pcd_status, app_cid, app_investigation_description, app_school_need, app_pedagogical_evaluation_type, app_grade, app_classroom, app_room, app_turn, app_manual_insert) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)",
            [s.id, s.profileImage || s.profile_image, s.name, s.socialName || s.social_name, s.useSocialName || false, s.cpf, s.classroom, s.matricula, s.birthDate || s.birth_date, s.cid, s.schoolAcademicYear, s.status || 'Ativo', respId, s.observations, s.isAEE || s.is_aee || false, s.pcdStatus || s.pcd_status, s.cid, s.investigationDescription || s.investigation_description, s.schoolNeed || s.school_need, s.pedagogicalEvaluationType || s.pedagogical_evaluation_type, s.grade, s.classroom, s.room, s.turn, s.manualInsert || false]
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
