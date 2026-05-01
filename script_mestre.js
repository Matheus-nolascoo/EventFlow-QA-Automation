const { chromium } = require('playwright');
require('dotenv').config();

(async () => {
    console.log('🚀 INICIANDO A AUTOMAÇÃO END-TO-END...');
    const idEvento = '1814';
    
    // Variável única para salvar todas as evidências no mesmo lugar
    const pastaEvidencias = `Evidencias/prints/${idEvento}`;

    // ---------------------------------------------------------
    // 1. PREPARANDO OS NAVEGADORES (CONTEXTOS)
    // ---------------------------------------------------------
    // Navegador do Painel Admin (Sessão Limpa)
    const adminBrowser = await chromium.launch({ headless: false });
    const adminContext = await adminBrowser.newContext();
    const adminPage = await adminContext.newPage();

    // Navegador do WhatsApp (Sessão Persistente)
    const userDataDir = './sessao_whatsapp'; 
    const waContext = await chromium.launchPersistentContext(userDataDir, { headless: false });
    const waPage = await waContext.newPage();

    // ---------------------------------------------------------
    // 2. FASE 1: CRIAR CONVIDADO (No adminPage)
    // ---------------------------------------------------------
    console.log('📝 FASE 1: Logando no Dashboard...');
    
    // ATENÇÃO: Tudo aqui usa adminPage agora!
    await adminPage.goto('https://app.codemyparty.com.br/home/'); 
    await adminPage.fill('#username', process.env.ADM_USER);
    await adminPage.fill('#password', process.env.ADM_PASS);
    await adminPage.click('button[type="submit"]'); 

    console.log('🔓 Login efetuado com sucesso!');

    console.log(`📝 Entrando no evento ${idEvento}...`);
    await adminPage.goto(`https://app.codemyparty.com.br/evento/evento/${idEvento}`);

    console.log('📝 Criando convidado teste...');
    
    // GERA UM NÚMERO ÚNICO PARA O TESTE ATUAL
    const idTeste = Math.floor(Math.random() * 10000);
    const nomeDinamico = `Matheus Teste ${idTeste}`;

    await adminPage.locator('a[ic-include*="novo_convidado"]').filter({ hasText: 'Convidado', visible: true }).click();   
    
    // INJETA O NOME DINÂMICO NO FORMULÁRIO
    await adminPage.locator('#id_nome').fill(nomeDinamico); 
    await adminPage.locator('input[name="email"]').filter({ visible: true }).fill('atendimento2@codemyparty.com.br');
    await adminPage.locator('input[name="telefone"]').filter({ visible: true }).fill('35988819515');
    await adminPage.locator('#id_aprovar').setChecked(false);
    await adminPage.getByRole('button', { name: 'Salvar' }).first().click();
    
    console.log(`✅ Convidado "${nomeDinamico}" criado com sucesso!`);
    
    // Espera 10 segundos para dar tempo do WhatsApp processar a mensagem
    // await adminPage.waitForTimeout(10000);

    // ---------------------------------------------------------
    // 3. FASE 3: CAPTURAR LINK (No waPage)
    // ---------------------------------------------------------
    console.log('📱 FASE 3: Hackeando o WhatsApp Web...');
    
    // ATENÇÃO: Tudo aqui usa waPage agora!
    await waPage.goto('https://web.whatsapp.com');

    console.log('⏳ Aguardando a barra de pesquisa carregar...');
    const seletorPesquisa = 'input[aria-label="Pesquisar ou começar uma nova conversa"]';
    await waPage.locator(seletorPesquisa).waitFor({ timeout: 60000 }); 
    
    console.log('🔍 Buscando o contato do bot...');
    const nomeContato = 'Code My Party'; 
    await waPage.locator(seletorPesquisa).fill(nomeContato);
    await waPage.getByTitle(nomeContato).first().click();

    console.log('⏳ Aguardando o chat carregar no painel direito...');
    const painelChat = waPage.locator('#main');
    await painelChat.waitFor({ state: 'visible' });

    console.log(`⏳ Aguardando o convite de "${nomeDinamico}" chegar no WhatsApp...`);
    
    // A MÁGICA: O robô só vai aceitar a mensagem se ela contiver o nome exato do teste que acabamos de criar!
    // Ele vai esperar pacientemente (até 90 segundos) por essa mensagem específica.
    const bolhaMensagem = painelChat.locator('div[role="row"]', { hasText: nomeDinamico }).last();
    await bolhaMensagem.waitFor({ state: 'visible', timeout: 90000 });

    console.log('📸 Mensagem nova detectada! Tirando o print...');
    await bolhaMensagem.screenshot({ path: `${pastaEvidencias}/01_convite_whatsapp.png` });

    console.log('🎯 Localizando o botão de Confirmar Presença...');
    const botaoConvite = painelChat.locator('button[data-testid="cta-url-button"]', { hasText: 'Confirmar Presença' }).last();
    await botaoConvite.waitFor({ state: 'visible' });

    console.log('🔗 Clicando para invocar o pop-up de segurança...');
    await botaoConvite.click();

    console.log('🔍 Lendo o pop-up e capturando o link...');
    await waPage.getByText('Deseja abrir o link?').waitFor({ state: 'visible' });

    const elementoLink = waPage.getByTestId('popup-url-text');
    const linkExtraido = await elementoLink.innerText();

    console.log(`✅ Hack do Pop-up finalizado! A URL capturada foi:\n${linkExtraido}`);

    console.log('🧹 Fechando pop-up...');
    await waPage.getByRole('button', { name: 'Não', exact: true }).click();

    // ---------------------------------------------------------
    // 4. FASE 2: ENVIAR SELFIE (Na confirmacaoPage)
    // ---------------------------------------------------------
    console.log('📸 FASE 2: Preenchendo a confirmação...');
    
    // ATENÇÃO: Tudo aqui usa confirmacaoPage e pastaEvidencias agora!
    const confirmacaoPage = await adminContext.newPage(); 
    await confirmacaoPage.goto(linkExtraido); 
    
    console.log('📸 Tirando o print da página de confirmação...');
    await confirmacaoPage.screenshot({ path: `${pastaEvidencias}/02_pagina_de_confirmacao.png`, fullPage: true });

    console.log('📸 Injetando a selfie no formulário...');
    await confirmacaoPage.locator('input[type="file"]').setInputFiles('./Foto_de_Teste.jpeg');

    console.log('✅ Aceitando os termos...');
    await confirmacaoPage.locator('#id_aceite').setChecked(true);

    console.log('🚀 Enviando confirmação...');
    await confirmacaoPage.locator('#enviar_form_btn').click();

    console.log('⏳ Aguardando a página de sucesso carregar...');
    await confirmacaoPage.getByText('Dados enviados com sucesso').waitFor();

    console.log('📸 Tirando o print dos dados enviados...');
    await confirmacaoPage.screenshot({ path: `${pastaEvidencias}/03_dados_enviados.png`, fullPage: true });

    // ---------------------------------------------------------
    // 5. FASE FINAL: APROVAR E RECEBER QR CODE
    // ---------------------------------------------------------
    console.log('✅ Retornando ao painel Admin (/home) para aprovar o convidado...');
    await adminPage.goto('https://app.codemyparty.com.br/home/');

    console.log(`🔍 Selecionando o evento ${idEvento} no menu de Eventos...`);
    
    // 1. Clica no botão customizado do dropdown
    await adminPage.locator('button[data-id="select_evento_painel"]').first().click(); 

    // 2. Dá um respiro para a animação do menu deslizante abrir (isso evita que o robô seja rápido demais)
    await adminPage.waitForTimeout(1000); 

    // 3. O TIRO DE SNIPER: Procura o texto do evento, mas EXIGE que ele esteja visível na tela!
    await adminPage.getByText(idEvento).filter({ visible: true }).first().click(); 

    console.log('⏳ Aguardando a lista de convidados pendentes carregar...');
    await adminPage.waitForTimeout(3000); 

    // --- A CORREÇÃO: O clique na ampulheta volta para revelar os botões verdes! ---
    console.log('⏳ Filtrando pelos convidados "Aguardando Aprovação"...');
    // Mirando diretamente no atributo oculto que a biblioteca gerou
    await adminPage.locator('[data-original-title="Esperando Aprovação"]').first().click();

    // Dá um tempinho rápido para o sistema trocar os cards da engrenagem pelos cards com botão verde
    await adminPage.waitForTimeout(2000);

    console.log(`🎯 Procurando o botão de aprovar exclusivo do "${nomeDinamico}"...`);
    const botaoAprovar = adminPage.locator(`button[ic-confirm*="${nomeDinamico}"]`).first();
    // A MÁGICA: Esperar que o botão esteja não só visível, mas "ancorado" ao sistema
    await adminPage.waitForTimeout(3000);
    console.log('✅ Preparando o robô para aceitar o pop-up nativo...');
        // A MÁGICA: O robô fica de prontidão. Quando o dialog aparecer, ele lê a mensagem e clica em "OK" (accept)
    adminPage.once('dialog', async dialog => {
        console.log(`🔔 Pop-up interceptado com a mensagem: "${dialog.message()}"`);
        await dialog.accept();
    });
    console.log('✅ Clicando no botão verde de Aprovar...');
    await botaoAprovar.click();
    
    console.log(`✅ Convidado "${nomeDinamico}" aprovado no sistema!`);

    // --- AGUARDANDO O QR CODE NO WHATSAPP ---
    console.log('⏳ Voltando ao WhatsApp e aguardando a mensagem do QR Code chegar (Isso pode demorar um pouco)...');
    
    console.log('🎯 Localizando a mensagem exata do QR Code...');
    
    // A MÁGICA 1: Trocamos o texto para algo que SÓ existe na mensagem final!
    const bolhaQrCode = waPage.locator('#main div[role="row"]')
        .filter({ hasText: nomeDinamico })
        .filter({ hasText: 'Segue o seu QR Code' }) // Âncora blindada contra a mensagem antiga
        .last();

    // Espera a mensagem chegar pacientemente (até 2 minutos)
    await bolhaQrCode.waitFor({ state: 'visible', timeout: 120000 });

    console.log('⬇️ Rolando a tela para garantir que o QR Code gigante apareça inteiro...');
    // A MÁGICA 2: Força o WhatsApp a rolar a barra até o final para a mensagem não sair cortada
    await bolhaQrCode.scrollIntoViewIfNeeded();

    console.log('📸 QR Code detectado! Tirando a evidência do WhatsApp...');
    
    // A MÁGICA 3: Tiramos print da aba do WhatsApp (waPage) em vez de só do balão.
    // Assim, o cabeçalho com o nome "Code My Party" e a bolha gigante saem perfeitos na foto!
    await waPage.screenshot({ path: `${pastaEvidencias}/04_qrcode_whatsapp.png` });

    console.log('🎯 Localizando o botão interativo do QR Code...');
    // Continua a busca pelo botão normalmente...
    const botaoQrCode = bolhaQrCode.locator('[role="button"], button, a').filter({ hasText: 'QR Code' }).first();

    console.log('🌐 Clicando no botão para abrir a aba final...');
    await botaoQrCode.click();

    console.log('⏳ Aguardando o navegador estabilizar a nova aba...');
    // Ignora redirecionamentos fantasmas
    await waPage.waitForTimeout(5000);

    // Captura a última aba que abriu na barra do navegador
    const todasAbas = waContext.pages();
    const qrCodePage = todasAbas[todasAbas.length - 1];

    // Traz a aba para frente
    await qrCodePage.bringToFront();

    console.log('📸 Tirando o print da página do QR Code...');
    await qrCodePage.screenshot({ path: `${pastaEvidencias}/05_pagina_gestao_qrcode.png`, fullPage: true });

    console.log('🏆 CICLO 100% FECHADO COM SUCESSO! O PAI TÁ ON!');
    
    // Fecha os navegadores no final de tudo
    await adminBrowser.close();
    await waContext.close();
})();