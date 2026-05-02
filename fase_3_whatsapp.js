const { chromium } = require("playwright");

(async () => {
  // 1. CONTEXTO PERSISTENTE: Salva o login para não pedir QR Code toda hora
  const userDataDir = "./sessao_whatsapp";
  const browserContext = await chromium.launchPersistentContext(userDataDir, {
    headless: false, // Tem que ser false na primeira vez para você conseguir escanear o código!
  });
  const page = await browserContext.newPage();
  const idEvento = "1814";
  // Crie UMA única variável de caminho para usar no script inteiro
  const pastaPrintsTestes = `Prints Testes/${idEvento}`;

  console.log("📱 Abrindo o WhatsApp Web...");
  await page.goto("https://web.whatsapp.com");

  console.log(
    "⏳ Aguardando a barra de pesquisa carregar (Escaneie o QR Code se for a 1ª vez!)...",
  );
  // Espera até a barra de pesquisa de conversas aparecer
  await page.waitForSelector(
    'input[aria-label="Pesquisar ou começar uma nova conversa"]',
    { timeout: 60000 },
  );

  console.log("🔍 Buscando o contato do bot da Code My Party...");
  // TAREFA 1: Substitua 'NOME_DO_CONTATO' pelo nome exato que o bot está salvo no seu celular
  const nomeContato = "Code My Party";
  const seletorPesquisa =
    'input[aria-label="Pesquisar ou começar uma nova conversa"]';
  await page.locator(seletorPesquisa).waitFor({ timeout: 60000 });
  await page.locator(seletorPesquisa).fill(nomeContato);
  await page.getByTitle(nomeContato).first().click();

  console.log("🎯 Procurando a última mensagem com o link do convite...");

  // --- INÍCIO DA CORREÇÃO ---
  console.log("⏳ Aguardando o chat carregar no painel direito...");
  // Restringe a visão do robô APENAS para a área de mensagens (lado direito)
  const painelChat = page.locator("#main");
  await painelChat.waitFor({ state: "visible" });

  console.log("📸 Localizando a bolha do convite...");
  // Procura a linha da mensagem que contém exatamente o texto do botão.
  // Isso garante que ele não tire print de mensagens de "Bom dia", apenas do convite real.
  const bolhaMensagem = painelChat
    .locator('div[role="row"]', { hasText: "Confirmar Presença" })
    .last();
  await bolhaMensagem.waitFor({ state: "visible" });

  console.log("📸 Tirando o print APENAS do balão da mensagem...");
  // Tira o print perfeitamente recortado
  await bolhaMensagem.screenshot({
    path: `${pastaPrintsTestes}/convite_whatsapp.png`,
  });
  // --- FIM DA CORREÇÃO ---

  console.log("🎯 Localizando o botão pelo testid...");
  const botaoConvite = painelChat
    .locator('button[data-testid="cta-url-button"]', {
      hasText: "Confirmar Presença",
    })
    .last();
  await botaoConvite.waitFor({ state: "visible" });

  console.log("🔗 Clicando para invocar o pop-up de segurança...");
  // Apenas clica, sem precisar interceptar abas!
  await botaoConvite.click();

  console.log("🔍 Lendo o pop-up e capturando o link...");
  // Espera a janela do modal carregar usando o título dela
  await page.getByText("Deseja abrir o link?").waitFor({ state: "visible" });

  // Como o link gigante está solto na tela, procuramos pelo elemento que contém a base da URL
  const elementoLink = page.getByText("https://app.codemyparty.com.br");

  // Extrai apenas o texto de dentro desse elemento
  const linkExtraido = await elementoLink.innerText();

  console.log(
    `✅ Hack do Pop-up finalizado! A URL capturada foi:\n${linkExtraido}`,
  );

  console.log(
    '🧹 Clicando em "Não" para fechar o pop-up e manter a casa limpa...',
  );
  await page.getByRole("button", { name: "Não", exact: true }).click();

  console.log("🛑 Tempo pausado para o Matheus conferir o terminal!");
  await page.pause();

  await browserContext.close();
})();