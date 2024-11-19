const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
const fs = require("fs");

// Configuração da API Gemini
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI('AIzaSyCjsBc1-XeJdfwfC5l_V7GJP1BTPi5dFfA');

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

// Caminho para o arquivo onde o histórico será armazenado
const HISTORY_FILE = "historico.json";

function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const data = fs.readFileSync(HISTORY_FILE, "utf-8");
      return JSON.parse(data); // Tenta interpretar o conteúdo como JSON
    }
  } catch (err) {
    console.error("Erro ao carregar histórico. Reinicializando arquivo:", err);
  }
  return []; // Retorna um array vazio em caso de erro
}

// Função para salvar o histórico no arquivo
function saveHistory(history) {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  } catch (err) {
    console.error("Erro ao salvar histórico:", err);
  }
}

// Função principal
async function run() {
  console.log("Bem-vindo ao Chatbot!");
  console.log("Digite suas mensagens. Digite 'sair' para encerrar ou 'nova' para iniciar uma nova conversa.");

  // Carrega o histórico existente
  let history = loadHistory();
  console.log("Histórico carregado:", history);  // Adiciona um log para mostrar o histórico carregado

  // Exibe o histórico carregado
  if (history.length > 0) {
    console.log("Histórico carregado:");
    history.forEach((entry) => {
      console.log(`${entry.role}: ${entry.parts[0].text}`);
    });
  } else {
    console.log("Iniciando uma nova conversa.");
  }

  // Inicia a sessão de chat
  const chatSession = model.startChat({
    generationConfig,
    history,
  });

  const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  readline.setPrompt("Você: ");
  readline.prompt();

  readline.on("line", async (input) => {
    if (input.toLowerCase() === "sair") {
      console.log("Saindo...");
      saveHistory(history); // Salva o histórico antes de sair
      readline.close();
      return;
    }

    if (input.toLowerCase() === "nova") {
      history = []; // Reseta o histórico
      console.log("Nova conversa iniciada.");
      readline.prompt();
      return;
    }

    try {
      // Envia a mensagem do usuário e recebe a resposta do chatbot
      const result = await chatSession.sendMessage(input);
      const botResponse = result.response.text();

      // Atualiza o histórico
      history.push({ role: "user", parts: [{ text: input }] });
      history.push({ role: "model", parts: [{ text: botResponse }] });

      // Salva o histórico após a atualização
      saveHistory(history);  
      console.log("Histórico salvo:", history);  // Adiciona um log para verificar o histórico que está sendo salvo

      // Exibe a resposta do chatbot
      console.log(`Chatbot: ${botResponse}`);
    } catch (err) {
      console.error("Erro ao interagir com o chatbot:", err);
    }

    readline.prompt();
  });
}

run();

/*
Este código é um chatbot simples que usa a API Google Gemini para gerar respostas 
baseadas nas mensagens anteriores do usuário. O histórico da conversa é salvo em um arquivo JSON para 
permitir que a conversa continue quando o programa for reaberto.

Decisões de Design e Implementação:
1. API Gemini: A API Gemini foi escolhida por ser eficiente e gerar respostas de 
   boa qualidade para o chatbot. Além de ser a IA que mais trabalhamos durante a matéria de Serviços em Nuvem.

2. Armazenamento do Histórico: O histórico é armazenado em um arquivo JSON (historico.json) 
   para ser carregado e salvo durante a interação, facilitando o acesso a conversa.

3. Estrutura do Histórico: O histórico é armazenado como um array de objetos, cada um com 
   o role (usuário e modelo) e a mensagem.

4. Interação no Terminal: O usuário interage com o chatbot por meio do terminal, 
   onde pode digitar mensagens e usar os comandos "sair" e "nova" para controlar a conversa.

5. Logs dos Erros: O código garante que erros sejam capturados e logados.
*/
