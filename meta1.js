const { chromium } = require('playwright');
require('dotenv').config(); 

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🚀 Iniciando o robô da Code My Party...');

  // --- LOGIN NO DASHBOARD ---
  await page.goto('https://app.codemyparty.com.br/home/'); 
  await page.fill('#username', process.env.ADM_USER);
  await page.fill('#password', process.env.ADM_PASS);
  await page.click('button[type="submit"]'); 

  console.log('🔓 Login efetuado com sucesso!');

  // --- ENTRAR NO EVENTO ---
  const idEvento = '1814'; 
  await page.goto(`https://app.codemyparty.com.br/evento/evento/${idEvento}`);

  // --- CRIAR O CONVIDADO DE TESTE ---
  console.log('📝 Injetando convidado de teste...');
  
  // O '*=' significa "contém". 
  // O robô acha quem tem o atributo, mas DEPOIS filtra garantindo que o texto seja 'Convidado' e que esteja visível
  await page.locator('a[ic-include*="novo_convidado"]').filter({ hasText: 'Convidado', visible: true }).click();   
  await page.locator('#id_nome').fill('Matheus Teste'); 
  await page.locator('input[name="email"]').filter({ visible: true }).fill('atendimento2@codemyparty.com');
  await page.locator('input[name="telefone"]').filter({ visible: true }).fill('35988819515');
  await page.getByRole('button', { name: 'Salvar' }).first().click();

  console.log('🛑 PAUSANDO O TEMPO PARA O MATHEUS INVESTIGAR!');
  // O navegador vai congelar AQUI. Você poderá ver se o site deu erro de "campo obrigatório".
  await page.pause();
  
  console.log('✅ Convidado criado com sucesso! O Gupshup já deve estar mandando mensagem pro seu zap.');

  await page.waitForTimeout(5000);
  await browser.close();
})();