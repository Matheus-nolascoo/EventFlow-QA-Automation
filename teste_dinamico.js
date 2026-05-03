// Importamos a função que você acabou de exportar do Script Mestre
const { rodarAutomacaoE2E } = require("./script_mestre");

// 1. O PACOTE DE DADOS (Simulando o envio do Frontend)
const dadosSimulados = {
  // ATENÇÃO: Troque este ID por um evento real que você queira testar
  idEvento: 2271,
  nomeConvidado: "Matheus Teste Dinâmico 15125",
  emailConvidado: "atendimento2@codemyparty.com.br",
  telefoneConvidado: "35988819515",
  camposExtras: [
    // Coloque aqui as perguntas exatas que existem no formulário deste evento específico. O robô vai ler e preencher dinamicamente!
    // Se não houver perguntas extras no evento, deixe o array vazio: []
    { pergunta: "CRMV", resposta: "123456" },
  ],
  nomeEvento: "Evento de Teste Dinâmico",
  dataEvento: "2023-12-25",
  localEvento: "Centro de Convenções",
  enderecoEvento: "Av. Principal, 1000 - Centro",
};
// 2. A ORDEM DE EXECUÇÃO
console.log("🔌 A ligar o robô com dados simulados da web...");

rodarAutomacaoE2E(dadosSimulados)
  .then(() => {
    console.log(
      "🎉 SUCESSO ABSOLUTO! O robô leu os dados e completou a missão.",
    );
  })
  .catch((erro) => {
    console.error("❌ Ops, o robô tropeçou durante a execução:", erro);
  });
