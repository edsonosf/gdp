
import fs from 'fs';
import { pipeline } from 'stream/promises';

// Função para baixar imagem de URL temporária usando fetch (nativo no Node 18+)
async function baixarImagemAssinada(url: string, caminhoSalvar: string) {
    try {
        console.log(`Iniciando download de: ${url.substring(0, 50)}...`);
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Erro ao baixar. Status: ${response.status}. O link pode ter expirado.`);
        }

        if (!response.body) {
            throw new Error("Corpo da resposta vazio.");
        }

        const writer = fs.createWriteStream(caminhoSalvar);
        // @ts-ignore
        await pipeline(response.body, writer);

        console.log(`Download concluído! Arquivo salvo em: ${caminhoSalvar}`);
    } catch (error) {
        console.error('Erro durante o download:', error);
    }
}

// Link fornecido anteriormente (pode estar expirado)
const link = "https://cloudseduc.maracanau.ce.gov.br/prod-sge/alunos/municipais/38744/fotos/foto_carteira.png?response-content-disposition=inline&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=CPyGuyP6oXVNP4HrYpoq%2F20260301%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260301T201238Z&X-Amz-SignedHeaders=host&X-Amz-Expires=600&X-Amz-Signature=a952ae1b5730bb2d0096af1bcb082a4ddee1f74bdabfc33ba885ff7a471511e5";

baixarImagemAssinada(link, './aluno_47443.png');
