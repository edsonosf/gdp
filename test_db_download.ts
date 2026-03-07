
import { query } from './db';
import fs from 'fs';
import { pipeline } from 'stream/promises';

async function test() {
  try {
    const res = await query("SELECT sge_photo FROM sge_extracted_data WHERE sge_photo LIKE 'http%' LIMIT 1");
    
    if (res.rows.length === 0) {
      console.log("Nenhum link de foto encontrado no banco de dados.");
      return;
    }
    
    const url = res.rows[0].sge_photo;
    console.log(`Link encontrado: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Erro ao baixar. O link pode ter expirado. Status: ${response.status}`);
      return;
    }
    
    if (!response.body) {
        console.error("Corpo da resposta vazio.");
        return;
    }

    const writer = fs.createWriteStream('./aluno_test.png');
    // @ts-ignore
    await pipeline(response.body, writer);
    
    console.log('Download concluído com sucesso para ./aluno_test.png!');
  } catch (err) {
    console.error("Erro durante o teste:", err);
  }
}

test();
