class AdminPage {
  constructor(page) {
    this.page = page;
    // Aqui guardamos os "endereços" dos botões e campos
    this.inputUsuario = "#username";
    this.inputSenha = "#password";
    this.botaoSubmit = 'button[type="submit"]';
    this.inputNomeConvidado = "#id_nome";
  }

  // ---------------------------------------------------------
  // AÇÃO 1: FAZER LOGIN (Com Inteligência de Memória)
  // ---------------------------------------------------------
  async fazerLogin(usuario, senha) {
    console.log("🕵️‍♂️ Verificando se precisamos fazer login...");
    
    // Verifica se o campo de usuário está na tela (espera rapidinha de 3 segundos)
    const precisaLogar = await this.page.locator(this.inputUsuario).isVisible({ timeout: 3000 }).catch(() => false);

    if (precisaLogar) {
      console.log("📝 Inserindo credenciais...");
      await this.page.fill(this.inputUsuario, usuario);
      await this.page.fill(this.inputSenha, senha);
      await this.page.click(this.botaoSubmit);
      
      // Espera a Home carregar para confirmar que o login deu certo
      await this.page.waitForLoadState("networkidle");
    } else {
      console.log("🔓 O sistema já estava logado! Pulando a etapa de credenciais.");
    }
  }

  // ---------------------------------------------------------
  // AÇÃO 2: CRIAR CONVIDADO (Via Modal na Home com XPath)
  // ---------------------------------------------------------
  async criarConvidadoTeste(idEvento, nome, email, telefone) {
    console.log(`👤 A preparar para criar convidado no evento ${idEvento}...`);

    // 1. Abre o Dropdown de Eventos
    const seletorDropdown = 'button[data-id="select_evento_painel"]';
    await this.page.locator(seletorDropdown).first().waitFor({ state: "visible", timeout: 15000 });
    await this.page.locator(seletorDropdown).first().click();

    // 2. Seleciona o Evento específico
    await this.page.getByText(idEvento.toString()).filter({ visible: true }).first().click();

    // 3. Clica no botão "+Convidado" (Usando o GPS Absoluto - XPath)
    console.log("🪟 Abrindo o modal de criação...");
    const botaoNovoConvidado = this.page.locator('//*[@id="tabela"]/div/div[2]/div/div/div[1]/div[1]/button[4]'); 
    
    await botaoNovoConvidado.waitFor({ state: "visible", timeout: 10000 });
    await botaoNovoConvidado.click({ force: true });

    // 4. Preenche os dados no modal
    console.log("🪟 A preencher o formulário no modal...");
    await this.page.locator("#id_nome").waitFor({ state: "visible", timeout: 15000 });
    await this.page.locator("#id_nome").fill(nome);
    await this.page.locator('input[name="email"]').fill(email);
    await this.page.locator('input[name="telefone"]').fill(telefone);
    
    // Desmarca aprovação
    const checkboxAprovar = this.page.locator("#id_aprovar");
    if (await checkboxAprovar.isVisible()) {
        await checkboxAprovar.setChecked(false);
    }

    // 5. Salva o convidado
    await this.page.getByRole("button", { name: "Salvar" }).first().click();
    await this.page.locator("#id_nome").waitFor({ state: "hidden", timeout: 10000 });
    console.log("✅ Convidado criado com sucesso via Modal!");
  }

  // ---------------------------------------------------------
  // AÇÃO 3: APROVAR CONVIDADO
  // ---------------------------------------------------------
  async aprovarConvidado(idEvento, nomeConvidado) {
    // 1. BUSCA SEGURA: Define o seletor do dropdown e espera ele aparecer
    const seletorDropdown = 'button[data-id="select_evento_painel"]';
    await this.page.locator(seletorDropdown).first().waitFor({ state: "visible", timeout: 15000 });
    await this.page.locator(seletorDropdown).first().click();

    // 2. Clica no Evento Dinâmico
    await this.page.getByText(idEvento.toString()).filter({ visible: true }).first().click();

    // 3. Aguarda a ampulheta aparecer antes de clicar
    const filtroPendentes = this.page.locator('[data-original-title="Esperando Aprovação"]').first();
    await filtroPendentes.waitFor({ state: "visible" });
    await filtroPendentes.click();

    // 4. Intercepta o pop-up
    this.page.once("dialog", async (dialog) => {
      await dialog.accept();
    });

    // 5. Espera o botão específico do convidado estar visível
    const botaoAprovar = this.page.locator(`button[ic-confirm*="${nomeConvidado}"]`).first();
    await botaoAprovar.waitFor({ state: "visible", timeout: 15000 }); 
    await botaoAprovar.click();
    
    console.log(`✅ Convidado ${nomeConvidado} aprovado com sucesso via Dashboard!`);
  }
}

module.exports = { AdminPage };