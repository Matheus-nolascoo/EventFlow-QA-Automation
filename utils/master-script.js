const { AdminPage } = require("../pages/AdminPage");
const { ConfirmationPage } = require("../pages/ConfirmationPage");
const { WhatsAppPage } = require("../pages/WhatsAppPage");
const { gerarPrintAppleWallet } = require("./wallet-helper");
const logger = require("./logger"); // AJUSTE: O logger agora está na mesma pasta!
const CONFIG = require("../config");
const { chromium } = require("playwright");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

async function setupBrowsers() {
  logger.info("Iniciando os navegadores e preparando o ambiente...");

  // AJUSTE: Usando o novo nome padronizado da pasta da sessão do WhatsApp
  const userDataDir = "./whatsapp-session";

  // 1. Liga o motor principal
  const waContext = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
  });

  // 2. Pega a primeira aba (Admin) e cria a segunda (WhatsApp)
  const adminPage = waContext.pages()[0];
  const waPage = await waContext.newPage();
  await waPage.goto("https://web.whatsapp.com");
  await adminPage.bringToFront();

  // 3. A ENTREGA! Ele empacota as três coisas importantes e devolve pro gerente:
  return {
    waContext,
    adminPage,
    waPage,
  };
}

async function runE2EFlow(dadosDoTeste) {
  const {
    idEvento,
    nomeConvidado,
    emailConvidado,
    telefoneConvidado,
    camposExtras,
    nomeEvento,
    dataEvento,
    localEvento,
    enderecoEvento,
  } = dadosDoTeste;

  logger.info(`INICIANDO A AUTOMAÇÃO PARA O EVENTO ${idEvento}...`);
  logger.info(`Convidado: ${nomeConvidado} | Contato: ${telefoneConvidado}`);

  const evidencePath = CONFIG.PASTA_EVIDENCIAS(idEvento);
  const { waContext, adminPage, waPage } = await setupBrowsers();
  let guestBrowser = null;

  try {
    // --- FASE 1: DASHBOARD ---
    logger.info("Efetuando login no painel administrativo...");
    const admin = new AdminPage(adminPage);

    await adminPage.goto("https://app.codemyparty.com.br/home/");

    // Pegamos direto das variáveis seguras configuradas anteriormente
    await admin.fazerLogin(
      CONFIG.ENV?.ADMIN_USER || process.env.ADMIN_USER,
      CONFIG.ENV?.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD,
    );

    logger.info("Criando convidado teste no modal...");
    await admin.criarConvidadoTeste(
      idEvento,
      nomeConvidado,
      emailConvidado,
      telefoneConvidado,
    );
    logger.info(`Convidado "${nomeConvidado}" criado com sucesso!`);

    // --- FASE 2: WHATSAPP ---
    logger.info("Trocando para a aba do WhatsApp...");
    await waPage.bringToFront();

    const whatsapp = new WhatsAppPage(waPage);
    // Utilizamos a variável segura do arquivo config
    const whatsappContact =
      CONFIG.ENV?.WHATSAPP_CONTACT || process.env.WHATSAPP_CONTACT;
    await whatsapp.buscarContato(whatsappContact);

    const linkCapturado = await whatsapp.capturarLinkConvite(
      nomeConvidado,
      evidencePath,
    );

    // ====================================================================
    // FASE 3: FORMULÁRIO DE CONFIRMAÇÃO (O Convidado Real)
    // ====================================================================
    logger.info(
      "Abrindo nova janela limpa para simular o celular do convidado...",
    );

    guestBrowser = await chromium.launch({ headless: false });
    const guestContext = await guestBrowser.newContext();
    const confirmacaoPage = await guestContext.newPage();

    logger.info(`Navegando para o convite: ${linkCapturado}`);
    await confirmacaoPage.goto(linkCapturado);
    await confirmacaoPage.waitForSelector('button[type="submit"]', {
      state: "visible",
      timeout: 15000,
    });

    const confirmation = new ConfirmationPage(confirmacaoPage);

    await confirmation.preencherConfirmacaoDinamicamente(
      camposExtras,
      evidencePath,
      CONFIG.CAMINHO_FOTO_TESTE,
    );

    await guestBrowser.close();
    logger.info("Janela do convidado encerrada.");

    // --- FASE 4: APROVAÇÃO ---
    await adminPage.goto("https://app.codemyparty.com.br/home/");
    await admin.aprovarConvidado(idEvento, nomeConvidado);

    // --- FASE 5: AGUARDAR QR CODE ---
    await whatsapp.aguardarEReceberQRCode(nomeConvidado, evidencePath);
    await whatsapp.clicarNoBotaoDoQrCode();

    const todasAbas = waContext.pages();
    const qrCodePage = todasAbas[todasAbas.length - 1];
    await qrCodePage.bringToFront();
    await qrCodePage.waitForSelector('img[alt="QR Code"]', {
      state: "visible",
      timeout: 15000,
    });
    await qrCodePage.screenshot({
      path: `${evidencePath}/05_pagina_gestao_qrcode.png`,
      fullPage: true,
    });
    logger.info("QR Code recebido e evidências capturadas!");

    // --- FASE 6: APPLE WALLET ---
    const [downloadWallet] = await Promise.all([
      qrCodePage.waitForEvent("download"),
      qrCodePage
        .getByRole("link", { name: "baixar o seu passe digital" })
        .click(),
    ]);

    const caminhoCofre = path.join(
      __dirname,
      "..",
      "temp",
      `ingresso_temp_${Date.now()}.zip`,
    );
    await downloadWallet.saveAs(caminhoCofre);

    await gerarPrintAppleWallet(
      caminhoCofre,
      evidencePath,
      nomeConvidado,
      nomeEvento,
      dataEvento,
      localEvento,
      enderecoEvento,
    );

    logger.info("PACOTE DE EVIDÊNCIAS 100% CONCLUÍDO!");
  } catch (erro) {
    logger.error("Ops! O robô bateu o carro ou não encontrou um elemento.");
    logger.error("Detalhes técnicos do erro: " + erro.message);
  } finally {
    logger.info("Desligando os navegadores e liberando o terminal...");

    if (guestBrowser) {
      await guestBrowser
        .close()
        .catch((e) => logger.warn(`Erro ao fechar guestBrowser: ${e.message}`));
    }
    if (waContext) {
      await waContext
        .close()
        .catch((e) => logger.warn(`Erro ao fechar waContext: ${e.message}`));
    }
    limparArquivosTemporarios();

    // ====================================================================
    // Limpa arquivos desnecessários da raiz
    // ====================================================================
    function limparArquivosTemporarios() {
      logger.info("Varrendo arquivos temporários...");
      try {
        const pastaTemp = path.join(__dirname, "..", "temp");
        if (fs.existsSync(pastaTemp)) {
          const arquivos = fs.readdirSync(pastaTemp);
          for (const arquivo of arquivos) {
            fs.unlinkSync(path.join(pastaTemp, arquivo));
          }
        }
        logger.info("Limpeza da pasta temp concluída!");
      } catch (erroLimpeza) {
        logger.error("Falha ao limpar pasta temp: ", erroLimpeza);
      }
    }

    logger.info("Robô finalizado com segurança.");
  }
}

module.exports = { runE2EFlow };
