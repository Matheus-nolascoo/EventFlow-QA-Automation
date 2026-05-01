const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    const idEvento = '1814';
    // Crie UMA única variável de caminho para usar no script inteiro
    const pastaPrintsTestes = `Prints Testes/${idEvento}`;

    console.log('🚀 Iniciando a Meta 2: A Jornada do Convidado...');

    // TAREFA 1: Cole aqui o link real que chegou no seu WhatsApp
    const linkDoConvite = 'https://app.codemyparty.com.br/c/4377403e-fc45-4ef5-8f75-7f66f3daf568?fbclid=IwAR5QOXjM6qOxeWmrHmikklusefvUf12U-RjjIOrMpZoaTiUxwSprdSL3rb3jCg_wapm_ODVkYzBmMTAtMDc2Yi00NWQyLWE0OWUtNTBmMmU2NzU5NDQ1_waaem_4gNHC1Z0xfpU8HGNosc2HA';
    await page.goto(linkDoConvite);
    
    console.log('📸 Tirando o print da página de confirmação...');
    // Tira o print e salva com o nome correto do fluxo
    // A opção fullPage: true garante que o print pegue a tela toda e fique bonito para o cliente
    await page.screenshot({ path: `${pastaEvidencias}/pagina_de_confirmacao.png`, fullPage: true });

    console.log('📸 Injetando a selfie no formulário...');
    
    // TAREFA 2: Use o Inspecionar Elemento para achar o seletor do campo de arquivo
    // Geralmente é um input[type="file"]
    await page.locator('input[type="file"]').setInputFiles('./Foto_de_Teste.jpeg');

    console.log('✅ Aceitando os termos...');
    // TAREFA 3: Ache o ID ou Name do checkbox de "Aceito os termos"
    await page.locator('#id_aceite').setChecked(true);

    console.log('🚀 Enviando confirmação...');
    // TAREFA 4: Ajuste o nome do botão final
    await page.locator('#enviar_form_btn').click();

    console.log('⏳ Aguardando a página de sucesso carregar...');
    // Espera a página processar e carregar a mensagem de sucesso
    // (Ajuste o texto abaixo para algo que realmente aparece na tela final)
    await page.getByText('Dados enviados com sucesso').waitFor();

    console.log('📸 Tirando o print dos dados enviados...');
    // Tira o print e salva com o nome correto do fluxo
    // A opção fullPage: true garante que o print pegue a tela toda e fique bonito para o cliente
    await page.screenshot({ path: `${pastaEvidencias}/dados_enviados.png`, fullPage: true });

    console.log('🎉 Meta 2 Concluída! Verifique a imagem na sua pasta.');

    await page.waitForTimeout(5000);
    await browser.close();
})();