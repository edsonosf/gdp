
import express from "express";
import { createServer as createViteServer } from "vite";
import { initDb, query } from "./db.js";
import dotenv from "dotenv";

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
  
  // DB Health Check
  app.get("/api/db-test", async (req, res) => {
    try {
      const result = await query("SELECT NOW() as now");
      res.json({ status: "ok", time: result.rows[0].now });
    } catch (err) {
      res.status(500).json({ status: "error", message: (err as Error).message });
    }
  });

  // Users
  app.get("/api/users", async (req, res) => {
    try {
      const result = await query("SELECT * FROM users ORDER BY created_at DESC");
      res.json(result.rows.map(u => ({
        ...u,
        socialName: u.social_name,
        profileImage: u.profile_image,
        isSystemAdmin: u.is_system_admin,
        birthDate: u.birth_date,
        phone2: u.phone2,
        cargo: u.cargo,
        components: u.components,
        disciplines: u.disciplines,
        cargaHoraria: u.carga_horaria,
        turnoTrabalho: u.turno_trabalho,
        additionalInfo: u.additional_info,
        hasCustomSchedule: u.has_custom_schedule,
        customScheduleDetails: u.custom_schedule_details
      })));
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/users", async (req, res) => {
    const u = req.body;
    try {
      await query(
        "INSERT INTO users (id, name, social_name, role, email, cpf, password, status, secretaria, lotacao, matricula, phone, phone2, cargo, profile_image, is_system_admin, gender, birth_date, components, disciplines, carga_horaria, turno_trabalho, additional_info, has_custom_schedule, custom_schedule_details) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)",
        [u.id, u.name, u.socialName, u.role, u.email, u.cpf, u.password, u.status || 'Inativo', u.secretaria, u.lotacao, u.matricula, u.phone, u.phone2, u.cargo, u.profileImage, u.isSystemAdmin || false, u.gender, u.birthDate, u.components, u.disciplines, u.cargaHoraria, u.turnoTrabalho, u.additionalInfo, u.hasCustomSchedule, u.customScheduleDetails]
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
        "UPDATE users SET name=$1, social_name=$2, role=$3, email=$4, cpf=$5, password=$6, status=$7, secretaria=$8, lotacao=$9, matricula=$10, phone=$11, phone2=$12, cargo=$13, profile_image=$14, is_system_admin=$15, gender=$16, birth_date=$17, components=$18, disciplines=$19, carga_horaria=$20, turno_trabalho=$21, additional_info=$22, has_custom_schedule=$23, custom_schedule_details=$24 WHERE id=$25",
        [u.name, u.socialName, u.role, u.email, u.cpf, u.password, u.status, u.secretaria, u.lotacao, u.matricula, u.phone, u.phone2, u.cargo, u.profileImage, u.isSystemAdmin, u.gender, u.birthDate, u.components, u.disciplines, u.cargaHoraria, u.turnoTrabalho, u.additionalInfo, u.hasCustomSchedule, u.customScheduleDetails, id]
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
  app.get("/api/students", async (req, res) => {
    try {
      const result = await query("SELECT * FROM students ORDER BY name ASC");
      res.json(result.rows.map(s => ({
        ...s,
        socialName: s.social_name,
        responsibleName: s.responsible_name,
        otherRelationship: s.other_relationship,
        contactPhone: s.contact_phone,
        backupPhone: s.backup_phone,
        workPhone: s.work_phone,
        profileImage: s.profile_image,
        birthDate: s.birth_date,
        isAEE: s.is_aee,
        pcdStatus: s.pcd_status,
        investigationDescription: s.investigation_description,
        schoolNeed: s.school_need,
        pedagogicalEvaluationType: s.pedagogical_evaluation_type
      })));
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/students", async (req, res) => {
    const s = req.body;
    try {
      await query(
        "INSERT INTO students (id, name, social_name, grade, classroom, room, turn, birth_date, responsible_name, relationship, other_relationship, contact_phone, backup_phone, landline, work_phone, email, profile_image, observations, is_aee, pcd_status, cid, investigation_description, school_need, pedagogical_evaluation_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)",
        [s.id, s.name, s.socialName, s.grade, s.classroom, s.room, s.turn, s.birthDate, s.responsibleName, s.relationship, s.otherRelationship, s.contactPhone, s.backupPhone, s.landline, s.workPhone, s.email, s.profileImage, s.observations, s.isAEE || false, s.pcdStatus, s.cid, s.investigationDescription, s.schoolNeed, s.pedagogicalEvaluationType]
      );
      res.status(201).json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.delete("/api/students/:id", async (req, res) => {
    const { id } = req.params;
    try {
      // First delete occurrences associated with the student
      await query("DELETE FROM occurrences WHERE student_id = $1", [id]);
      await query("DELETE FROM students WHERE id = $1", [id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.put("/api/students/:id", async (req, res) => {
    const { id } = req.params;
    const s = req.body;
    try {
      await query(
        "UPDATE students SET name = $1, social_name = $2, grade = $3, classroom = $4, room = $5, turn = $6, birth_date = $7, responsible_name = $8, relationship = $9, other_relationship = $10, contact_phone = $11, backup_phone = $12, landline = $13, work_phone = $14, email = $15, profile_image = $16, observations = $17, is_aee = $18, pcd_status = $19, cid = $20, investigation_description = $21, school_need = $22, pedagogical_evaluation_type = $23 WHERE id = $24",
        [s.name, s.socialName, s.grade, s.classroom, s.room, s.turn, s.birthDate, s.responsibleName, s.relationship, s.otherRelationship, s.contactPhone, s.backupPhone, s.landline, s.workPhone, s.email, s.profileImage, s.observations, s.isAEE || false, s.pcdStatus, s.cid, s.investigationDescription, s.schoolNeed, s.pedagogicalEvaluationType, id]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Occurrences
  app.get("/api/occurrences", async (req, res) => {
    try {
      const result = await query("SELECT * FROM occurrences ORDER BY date DESC");
      res.json(result.rows.map(o => ({
        ...o,
        studentId: o.student_id,
        reporterName: o.reporter_name,
        reporterId: o.reporter_id
      })));
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/occurrences", async (req, res) => {
    const o = req.body;
    try {
      await query(
        "INSERT INTO occurrences (id, student_id, date, type, severity, titles, description, reporter_name, reporter_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
        [o.id, o.studentId, o.date, o.type, o.severity, o.titles, o.description, o.reporterName, o.reporterId, o.status || 'Pendente']
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
      await query("UPDATE occurrences SET status = $1 WHERE id = $2", [status, id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Logs
  app.get("/api/logs", async (req, res) => {
    try {
      const result = await query("SELECT * FROM access_logs ORDER BY timestamp DESC LIMIT 100");
      res.json(result.rows.map(l => ({
        ...l,
        userId: l.user_id,
        ipAddress: l.ip_address,
        userAgent: l.user_agent,
        deviceInfo: l.device_info
      })));
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/logs", async (req, res) => {
    const l = req.body;
    try {
      await query(
        "INSERT INTO access_logs (timestamp, user_id, event, status, description, ip_address, user_agent, device_info) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [l.timestamp, l.user_id, l.event, l.status, l.description, l.ip_address, l.user_agent, JSON.stringify(l.device_info)]
      );
      res.status(201).json({ success: true });
    } catch (err) {
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
      const result = await query("SELECT id, name, password FROM users WHERE is_system_admin = TRUE AND status = 'Ativo'");
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/reset-db", async (req, res) => {
    const { adminId, password } = req.body;
    try {
      // Verify admin password
      const adminCheck = await query("SELECT password FROM users WHERE id = $1 AND is_system_admin = TRUE", [adminId]);
      if (adminCheck.rows.length === 0 || adminCheck.rows[0].password !== password) {
        return res.status(401).json({ error: "Senha incorreta ou usuário sem privilégios." });
      }

      // Drop all tables to simulate "DROP DATABASE" behavior
      await query("DROP TABLE IF EXISTS occurrences CASCADE");
      await query("DROP TABLE IF EXISTS students CASCADE");
      await query("DROP TABLE IF EXISTS access_logs CASCADE");
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
      await query("TRUNCATE occurrences, students, access_logs RESTART IDENTITY CASCADE");
      await query("DELETE FROM users WHERE id != 'admin_seed'");

      if (students && Array.isArray(students)) {
        for (const s of students) {
          await query(
            "INSERT INTO students (id, name, social_name, grade, classroom, room, turn, birth_date, responsible_name, relationship, other_relationship, contact_phone, backup_phone, landline, work_phone, email, profile_image, observations, is_aee, pcd_status, cid, investigation_description, school_need, pedagogical_evaluation_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)",
            [s.id, s.name, s.socialName, s.grade, s.classroom, s.room, s.turn, s.birthDate, s.responsibleName, s.relationship, s.otherRelationship, s.contactPhone, s.backupPhone, s.landline, s.workPhone, s.email, s.profileImage, s.observations, s.isAEE || false, s.pcdStatus, s.cid, s.investigationDescription, s.schoolNeed, s.pedagogicalEvaluationType]
          );
        }
      }

      if (occurrences && Array.isArray(occurrences)) {
        for (const o of occurrences) {
          await query(
            "INSERT INTO occurrences (id, student_id, date, type, severity, titles, description, reporter_name, reporter_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
            [o.id, o.studentId, o.date, o.type, o.severity, o.titles, o.description, o.reporterName, o.reporterId, o.status]
          );
        }
      }

      if (users && Array.isArray(users)) {
        for (const u of users) {
          if (u.id === 'admin_seed') continue;
          await query(
            "INSERT INTO users (id, name, social_name, role, email, cpf, status, secretaria, lotacao, matricula, phone, phone2, cargo, profile_image, is_system_admin, gender, birth_date, components, disciplines, carga_horaria, turno_trabalho, additional_info, has_custom_schedule, custom_schedule_details) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)",
            [u.id, u.name, u.socialName, u.role, u.email, u.cpf, u.status, u.secretaria, u.lotacao, u.matricula, u.phone, u.phone2, u.cargo, u.profileImage, u.isSystemAdmin, u.gender, u.birthDate, u.components, u.disciplines, u.cargaHoraria, u.turnoTrabalho, u.additionalInfo, u.hasCustomSchedule, u.customScheduleDetails]
          );
        }
      }

      if (logs && Array.isArray(logs)) {
        for (const l of logs) {
          await query(
            "INSERT INTO access_logs (timestamp, user_id, event, status, description, ip_address, user_agent, device_info) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
            [l.timestamp, l.userId || l.user_id, l.event, l.status, l.description, l.ipAddress || l.ip_address, l.userAgent || l.user_agent, typeof l.deviceInfo === 'string' ? l.deviceInfo : JSON.stringify(l.deviceInfo || l.device_info)]
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
