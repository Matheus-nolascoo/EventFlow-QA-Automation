const { ENV } = require ('../config');
const logger = require('../utils/logger');

// Importamos a função que você acabou de exportar do Script Mestre
const { rodarAutomacaoE2E } = require("../utils/master-script");

// 1. O PACOTE DE DADOS (Simulando o envio do Frontend)
const dadosSimulados = {
  // ATENÇÃO: Troque este ID por um evento real que você queira testar
  idEvento: ENV.EVENT_ID,
  nomeConvidado: "Matheus Teste Dinâmico 15",
  emailConvidado: ENV.GUEST_EMAIL,
  telefoneConvidado: ENV.GUEST_PHONE,
  camposExtras: [
    // Coloque aqui as perguntas exatas que existem no formulário deste evento específico. O robô vai ler e preencher dinamicamente!
    // Se não houver perguntas extras no evento, deixe o array vazio: []
    { pergunta: "CRMV", resposta: "123456" },
  ],
  nomeEvento: "Evento de Teste Dinâmico",
  dataEvento: "25/05/2026",
  localEvento: "Centro de Convenções",
  enderecoEvento: "Av. Principal, 1000 - Centro",
};
// 2. A ORDEM DE EXECUÇÃO
logger.info("Iniciando a automação E2E...");

rodarAutomacaoE2E(dadosSimulados)
  .then(() => {
    logger.info(
      "Automação E2E concluída com sucesso! Todos os passos foram executados sem erros.",
    );
  })
  .catch((erro) => {
    logger.error("Ops, o robô tropeçou durante a execução:", erro);
  });
