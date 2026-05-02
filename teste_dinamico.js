// Importamos a função que você acabou de exportar do Script Mestre
const { rodarAutomacaoE2E } = require('./script_mestre');

// 1. O PACOTE DE DADOS (Simulando o envio do Frontend)
const dadosSimulados = {
  // ATENÇÃO: Troque este ID por um evento real que você queira testar
  idEvento: 1234, 
  
  nomeConvidado: "Matheus Dinâmico",
  emailConvidado: "atendimento2@codemyparty.com.br",
  telefoneConvidado: "35988819515",
  
  // 🧠 O Teste de Fogo da Inteligência Artificial
  // Coloque aqui as perguntas exatas que existem no formulário deste evento específico.
  // Se não houver perguntas extras no evento, deixe o array vazio: []
  camposExtras: [
    { pergunta: "Restrição Alimentar", resposta: "Nenhuma, como de tudo!" },
    { pergunta: "Qual o tamanho da sua camisa?", resposta: "M" }
  ]
};

// 2. A ORDEM DE EXECUÇÃO
console.log("🔌 A ligar o robô com dados simulados da web...");

rodarAutomacaoE2E(dadosSimulados)
  .then(() => {
    console.log("🎉 SUCESSO ABSOLUTO! O robô leu os dados e completou a missão.");
  })
  .catch((erro) => {
    console.error("❌ Ops, o robô tropeçou durante a execução:", erro);
  });