
import { Student, Occurrence, OccurrenceType, Severity } from './types';

export const GENDER_OPTIONS = [
  "Agênero", "Assexual", "Bigênero", "Bissexual", "Cisgênero", 
  "Demigênero (Demiboy/Demigirl)", "Gênero-fluido", "Heterossexual", 
  "Homossexual", "Intersexo", "Não-binário", "Neutrois", "Pansexual", 
  "Poligênero", "Queer (Genderqueer)"
];

export const SECRETARIA_OPTIONS = [
  "Secretaria de Comunicação", "Secretaria de Cultura e Turismo", 
  "Secretaria de Educação", "Secretaria de Saúde", 
  "Secretaria de Infraestrutura, Mobilidade e Controle Urbano", 
  "Secretaria de Desenvolvimento Econômico", 
  "Secretaria de Gestão, Orçamento e Finanças", 
  "Secretaria Especial de Integração de Políticas Sociais (SEPS)"
];

export const LOTACAO_EDUCACAO_OPTIONS = [
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

export const FUNCAO_OPTIONS = [
  "Agente Escolar", "Analista de Educação Básica", "Coordenador Pedagógico",
  "Diretor(a)", "Docente", "Secretário(a) Escolar", "Vice-diretor(a)", "Vigilante", "Outra Função"
];

export const GRADE_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
export const COMPONENTE_OPTIONS = ["Linguagens", "Matemática", "Ciências da Natureza", "Ciências Humanas", "Ensino Religioso"];
export const DISCIPLINA_OPTIONS = ["Língua Portuguesa", "Arte", "Educação Física", "Língua Inglesa", "Matemática", "Ciências", "História", "Geografia", "Ensino Religioso"];
export const CARGA_OPTIONS = ["50 H", "100 H", "150 H", "200 H"];
export const TURNO_OPTIONS = ["Integral", "Manhã", "Tarde", "Noite"];
export const RELATIONSHIP_OPTIONS = ["Pai", "Mãe", "Avô/Avó", "Tio/Tia", "Irmão/Irmã", "Tutor Legal", "Outro"];

export const DEFAULT_STUDENT_IMAGE = "data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='200' height='200' fill='%233B82F6'/%3E%3Cpath d='M100 100C116.569 100 130 86.5685 130 70C130 53.4315 116.569 40 100 40C83.4315 40 70 53.4315 70 70C70 86.5685 83.4315 100 100 100Z' fill='white'/%3E%3Cpath d='M100 115C72.3858 115 50 137.386 50 165V170H150V165C150 137.386 127.614 115 100 115Z' fill='white'/%3E%3C/svg%3E";
