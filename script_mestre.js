const { AdminPage } = require("./pages/AdminPage");
const { ConfirmationPage } = require("./pages/ConfirmationPage");
const { WhatsAppPage } = require("./pages/WhatsAppPage");
const { gerarPrintAppleWallet } = require("./utils/walletHelper");
const CONFIG = require("./config");
const { chromium } = require("playwright");
require("dotenv").config();
const fs = require('fs');
const path = require('path');

// 1. O SCRIPT AGORA É UMA FUNÇÃO QUE RECEBE ORDENS!
async function rodarAutomacaoE2E(dadosDoTeste) {
  const { 
    idEvento, 
    nomeConvidado, 
    emailConvidado, 
    telefoneConvidado, 
    camposExtras,
    nomeEvento,     // NOVO
    dataEvento,     // NOVO
    localEvento,    // NOVO
    enderecoEvento  // NOVO
  } = dadosDoTeste;

  console.log(`🚀 INICIANDO A AUTOMAÇÃO PARA O EVENTO ${idEvento}...`);
  console.log(
    `👤 Convidado: ${nomeConvidado} | 📱 Contato: ${telefoneConvidado}`,
  );
  const pastaEvidencias = CONFIG.PASTA_EVIDENCIAS(idEvento);
  let waContext;
  let guestBrowser;
  try {
    console.log("⚙️ Ligando o motor ÚNICO do Playwright...");
    // 2. INICIAMOS O NAVEGADOR PERSISTENTE (O único que vai abrir)
    const userDataDir = "./sessao_whatsapp";
    waContext = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
    });

    const adminPage = waContext.pages()[0];
    const waPage = await waContext.newPage();
    await waPage.goto("https://web.whatsapp.com");
    await adminPage.bringToFront();

    // --- FASE 1: DASHBOARD ---
    console.log("📝 A iniciar sessão no Dashboard...");
    const admin = new AdminPage(adminPage);

    await adminPage.goto("https://app.codemyparty.com.br/home/");
    await admin.fazerLogin(process.env.ADM_USER, process.env.ADM_PASS);

    console.log("📝 Criando convidado teste no modal...");
    // Passamos o idEvento como o primeiro argumento agora!
    await admin.criarConvidadoTeste(
      idEvento,
      nomeConvidado,
      emailConvidado,
      telefoneConvidado,
    );
    console.log(`✅ Convidado "${nomeConvidado}" criado com sucesso!`);

    // --- FASE 2: WHATSAPP ---
    console.log("📱 Trocando para a aba do WhatsApp...");
    await waPage.bringToFront(); // O robô muda de aba visualmente

    const whatsapp = new WhatsAppPage(waPage);
    await whatsapp.buscarContato(CONFIG.NOME_CONTATO_WHATSAPP);
    const linkCapturado = await whatsapp.capturarLinkConvite(
      nomeConvidado,
      pastaEvidencias,
    );

    // ====================================================================
    // FASE 3: FORMULÁRIO DE CONFIRMAÇÃO (O Convidado Real)
    // ====================================================================
    console.log(
      "📝 Abrindo nova janela limpa para simular o celular do convidado...",
    );

    guestBrowser = await chromium.launch({ headless: false });
    const guestContext = await guestBrowser.newContext();
    const confirmacaoPage = await guestContext.newPage();

    console.log(`Navegando para o convite: ${linkCapturado}`);
    await confirmacaoPage.goto(linkCapturado);

    // 🛡️ TRAVA DE SEGURANÇA: Garante que a página carregou completamente
    // antes de começarmos a procurar os campos na tela
    await confirmacaoPage.waitForLoadState("networkidle");

    const confirmation = new ConfirmationPage(confirmacaoPage);

    // 👇 Chamando na ordem exata do novo contrato:
    await confirmation.preencherConfirmacaoDinamicamente(
      camposExtras, // 1º As perguntas
      pastaEvidencias, // 2º A pasta para salvar o print
      CONFIG.CAMINHO_FOTO_TESTE, // 3º A foto do upload
    );

    // Fecha o navegador do convidado
    await guestBrowser.close();
    console.log("✅ Janela do convidado encerrada.");
    // Como o convidado já terminou, fechamos o navegador dele para poupar RAM
    await guestBrowser.close();
    console.log("✅ Janela do convidado encerrada.");

    // --- FASE 4: APROVAÇÃO ---
    await adminPage.goto("https://app.codemyparty.com.br/home/");
    await admin.aprovarConvidado(idEvento, nomeConvidado);

    // --- FASE 5: AGUARDAR QR CODE ---
    await whatsapp.aguardarEReceberQRCode(nomeConvidado, pastaEvidencias);
    await waPage.waitForTimeout(3000);

    const todasAbas = waContext.pages();
    const qrCodePage = todasAbas[todasAbas.length - 1];
    await qrCodePage.bringToFront();
    await qrCodePage.waitForLoadState("networkidle");
    await qrCodePage.screenshot({
      path: `${pastaEvidencias}/05_pagina_gestao_qrcode.png`,
      fullPage: true,
    });

    // --- FASE 6: APPLE WALLET ---
    const [downloadWallet] = await Promise.all([
      qrCodePage.waitForEvent("download"),
      qrCodePage
        .getByRole("link", { name: "baixar o seu passe digital" })
        .click(),
    ]);

    const caminhoCofre = `./ingresso_temp_${Date.now()}.zip`;
    await downloadWallet.saveAs(caminhoCofre);

    await gerarPrintAppleWallet(
      caminhoDoArquivoBaixado,
      pastaEvidencias,
      nomeConvidado,
      nomeEvento, // Passando a variável dinâmica
      dataEvento, // Passando a variável dinâmica
      localEvento, // Passando a variável dinâmica
      enderecoEvento, // Passando a variável dinâmica
    );

    console.log("✅ PACOTE DE EVIDÊNCIAS 100% CONCLUÍDO!");
  } catch (erro) {
    console.error("❌ Ops! O robô bateu o carro ou não encontrou um elemento.");
    console.error("🔍 Detalhes técnicos do erro:", erro.message);
  } finally {
    console.log("🧹 Desligando os navegadores e liberando o terminal...");
    
    if (guestBrowser) {
        await guestBrowser.close().catch(() => {});
    }
    if (waContext) {
        await waContext.close().catch(() => {});
    }

    // ====================================================================
    // 🗑️ CAMINHÃO DE LIXO: Limpa arquivos zumbis da raiz
    // ====================================================================
    try {
      console.log("🗑️ Varrendo arquivos temporários do Apple Wallet...");
      // Lê todos os arquivos da pasta atual onde o script está rodando
      const arquivosNaRaiz = fs.readdirSync(__dirname); 
      
      for (const arquivo of arquivosNaRaiz) {
        if (arquivo.endsWith('.zip') || arquivo.endsWith('.pkpass')) {
          fs.unlinkSync(path.join(__dirname, arquivo)); // Apaga o arquivo
        }
      }
      console.log("✨ Limpeza concluída!");
    } catch (erroLimpeza) {
      console.log("⚠️ Erro menor ao tentar limpar os zips (Pode ignorar):", erroLimpeza.message);
    }
    
    console.log("🛑 Robô finalizado com segurança.");
  }
}
module.exports = { rodarAutomacaoE2E };
