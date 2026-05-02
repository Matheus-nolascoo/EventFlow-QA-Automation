// config.js
module.exports = {
  // Dados fixos que podem mudar entre um teste e outro
  ID_EVENTO: "1814",
  NOME_CONTATO_WHATSAPP: "Code My Party",
  CAMINHO_FOTO_TESTE: "./Foto_de_Teste.jpeg",

  // Configurações de tempo (timeouts)
  TIMEOUT_PADRAO: 30000,
  TIMEOUT_WHATSAPP: 90000,

  // Seletores que se repetem ou são globais
  PASTA_EVIDENCIAS: (id) => `Evidencias/prints/${id}`,
};