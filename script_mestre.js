const { AdminPage } = require("./pages/AdminPage");
const { ConfirmationPage } = require("./pages/ConfirmationPage");
const { WhatsAppPage } = require("./pages/WhatsAppPage");
const { gerarPrintAppleWallet } = require("./utils/walletHelper");
const CONFIG = require("./config");
const { chromium } = require("playwright");
require("dotenv").config();

// 1. O SCRIPT AGORA É UMA FUNÇÃO QUE RECEBE ORDENS!
async function rodarAutomacaoE2E(dadosDoTeste) {
  // Desempacotamos os dados dinâmicos que vieram da interface web
  const { 
    idEvento, 
    nomeConvidado, 
    emailConvidado, 
    telefoneConvidado, 
    camposExtras // Isto será um Array dinâmico (ex: Restrição Alimentar, etc)
  } = dadosDoTeste;

  console.log(`🚀 INICIANDO A AUTOMAÇÃO PARA O EVENTO ${idEvento}...`);
  console.log(`👤 Convidado: ${nomeConvidado} | 📱 Contato: ${telefoneConvidado}`);

  // A pasta de evidências agora usa o ID dinâmico
  const pastaEvidencias = CONFIG.PASTA_EVIDENCIAS(idEvento);

  const adminBrowser = await chromium.launch({ headless: false });
  const adminContext = await adminBrowser.newContext();
  const adminPage = await adminContext.newPage();

  const userDataDir = "./sessao_whatsapp";
  const waContext = await chromium.launchPersistentContext(userDataDir, { headless: false });
  const waPage = await waContext.newPage();

  // --- FASE 1: DASHBOARD ---
  console.log("📝 A iniciar sessão no Dashboard...");
  const admin = new AdminPage(adminPage);
  await admin.fazerLogin(process.env.ADM_USER, process.env.ADM_PASS);
  
  // Usamos a variável dinâmica 'idEvento' em vez do CONFIG fixo
  await adminPage.goto(`https://app.codemyparty.com.br/evento/evento/${idEvento}`);

  console.log("📝 A criar convidado teste...");
  // Usamos as variáveis dinâmicas em vez de gerar o nome aqui
  await admin.criarConvidadoTeste(nomeConvidado, emailConvidado, telefoneConvidado);
  console.log(`✅ Convidado "${nomeConvidado}" criado com sucesso!`);

  // --- FASE 2: WHATSAPP ---
  const whatsapp = new WhatsAppPage(waPage);
  await whatsapp.buscarContato(CONFIG.NOME_CONTATO_WHATSAPP); 
  const linkCapturado = await whatsapp.capturarLinkConvite(nomeConvidado, pastaEvidencias);

  // --- FASE 3: FORMULÁRIO DE CONFIRMAÇÃO (A Mágica Dinâmica) ---
  const confirmacaoPage = await adminContext.newPage();
  const confirmation = new ConfirmationPage(confirmacaoPage);
  
  // Aqui passamos os "camposExtras" para a página de confirmação lidar com eles
  await confirmation.preencherConfirmacaoDinamicamente(
    linkCapturado,
    CONFIG.CAMINHO_FOTO_TESTE,
    pastaEvidencias,
    camposExtras 
  );

  // --- FASE 4: APROVAÇÃO ---
  await admin.aprovarConvidado(idEvento, nomeConvidado);

  // --- FASE 5: AGUARDAR QR CODE ---
  await whatsapp.aguardarEReceberQRCode(nomeConvidado, pastaEvidencias);
  await waPage.waitForTimeout(3000);

  const todasAbas = waContext.pages();
  const qrCodePage = todasAbas[todasAbas.length - 1];
  await qrCodePage.bringToFront();
  await qrCodePage.waitForLoadState("networkidle");
  await qrCodePage.screenshot({ path: `${pastaEvidencias}/05_pagina_gestao_qrcode.png`, fullPage: true });

  // --- FASE 6: APPLE WALLET ---
  const [downloadWallet] = await Promise.all([
    qrCodePage.waitForEvent("download"),
    qrCodePage.getByRole("link", { name: "baixar o seu passe digital" }).click(),
  ]);

  const caminhoCofre = `./ingresso_temp_${Date.now()}.zip`;
  await downloadWallet.saveAs(caminhoCofre);

  await gerarPrintAppleWallet(caminhoCofre, pastaEvidencias, nomeConvidado);

  console.log("✅ PACOTE DE EVIDÊNCIAS 100% CONCLUÍDO!");

  await adminBrowser.close();
  await waContext.close();
}

// 2. EXPORTAMOS A FUNÇÃO PARA O SERVIDOR WEB USAR
module.exports = { rodarAutomacaoE2E };