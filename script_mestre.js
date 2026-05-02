const { AdminPage } = require('./pages/AdminPage');
const { WhatsAppPage } = require('./pages/WhatsAppPage');
const { ConfirmationPage } = require('./pages/ConfirmationPage');
const CONFIG = require('./config');
const { chromium } = require('playwright');
require('dotenv').config();

    (async () => {
        console.log('🚀 INICIANDO A AUTOMAÇÃO END-TO-END...');
        const idEvento = CONFIG.ID_EVENTO;
        // Variável única para salvar todas as evidências no mesmo lugar
        const pastaEvidencias = CONFIG.PASTA_EVIDENCIAS(CONFIG.ID_EVENTO);
        // 1. PREPARANDO OS NAVEGADORES (CONTEXTOS)
        const adminBrowser = await chromium.launch({ headless: false });
        const adminContext = await adminBrowser.newContext();
        const adminPage = await adminContext.newPage();
        // Navegador do WhatsApp (Sessão Persistente)
        const userDataDir = './sessao_whatsapp'; 
        const waContext = await chromium.launchPersistentContext(userDataDir, { headless: false });
        const waPage = await waContext.newPage();
        // 2. FASE 1: CRIAR CONVIDADO (No adminPage)
        console.log('📝 FASE 1: Logando no Dashboard...');
        const admin = new AdminPage(adminPage);
        await admin.fazerLogin(process.env.ADM_USER, process.env.ADM_PASS);
        console.log('🔓 Login efetuado com sucesso!');
        console.log(`📝 Entrando no evento ${CONFIG.ID_EVENTO}...`);
        await adminPage.goto(`https://app.codemyparty.com.br/evento/evento/${CONFIG.ID_EVENTO}`);
        console.log('📝 Criando convidado teste...');
        // GERA UM NÚMERO ÚNICO PARA O TESTE ATUAL
        const idTeste = Math.floor(Math.random() * 10000);
        const nomeDinamico = `Matheus Teste ${idTeste}`;
        await admin.criarConvidadoTeste(nomeDinamico, 'atendimento2@codemyparty.com.br', '35988819515');
        console.log(`✅ Convidado "${nomeDinamico}" criado com sucesso!`);
        // ... FASE 2: Hackeando o WhatsApp Web ...
        const whatsapp = new WhatsAppPage(waPage); // Cria o especialista
        await whatsapp.buscarContato(CONFIG.NOME_CONTATO_WHATSAPP); // Ele busca o contato
        const linkCapturado = await whatsapp.capturarLinkConvite(nomeDinamico, CONFIG.PASTA_EVIDENCIAS(CONFIG.ID_EVENTO));
        console.log(`✅ Sucesso! O link capturado foi: ${linkCapturado}`);
        // ... FASE 3: Enviar Selfie ...
        const confirmacaoPage = await adminContext.newPage();
        const confirmation = new ConfirmationPage(confirmacaoPage);
        await confirmation.preencherConfirmacao(linkCapturado, CONFIG.CAMINHO_FOTO_TESTE, CONFIG.PASTA_EVIDENCIAS(CONFIG.ID_EVENTO));
        // ... FASE FINAL: APROVAR ...
        await admin.aprovarConvidado(CONFIG.ID_EVENTO, nomeDinamico);
        // ... WHATSAPP FINAL (QR CODE) ...
        console.log('⏳ Aguardando QR Code no WhatsApp...');
        await whatsapp.aguardarEReceberQRCode(nomeDinamico, CONFIG.PASTA_EVIDENCIAS(CONFIG.ID_EVENTO));
        await waPage.waitForTimeout(3000);
        // Captura a nova aba
        const todasAbas = waContext.pages();
        // Pega a última aba que foi aberta (o QR Code de gestão)
        const qrCodePage = todasAbas[todasAbas.length - 1]; 
        console.log('📸 Entrando na página de gestão do QR Code...');
        await qrCodePage.bringToFront();
        await qrCodePage.waitForLoadState('networkidle'); 
        await qrCodePage.screenshot({ path: `${CONFIG.PASTA_EVIDENCIAS(CONFIG.ID_EVENTO)}/05_pagina_gestao_qrcode.png`, fullPage: true });
        console.log('🏆 CICLO 100% FECHADO COM SUCESSO!');
        await adminBrowser.close();
        await waContext.close();
    }
    )();