class AdminPage {
  constructor(page) {
    this.page = page;
    // Aqui guardamos os "endereços" dos botões e campos
    this.inputUsuario = "#username";
    this.inputSenha = "#password";
    this.botaoSubmit = 'button[type="submit"]';
    this.inputNomeConvidado = "#id_nome";
  }
  // Aqui criamos as "ações" que o robô sabe fazer
  async fazerLogin(usuario, senha) {
    await this.page.goto("https://app.codemyparty.com.br/home/");
    await this.page.fill(this.inputUsuario, usuario);
    await this.page.fill(this.inputSenha, senha);
    await this.page.click(this.botaoSubmit);
  }
  async criarConvidadoTeste(nome, email, telefone) {
    await this.page.goto(`https://app.codemyparty.com.br/evento/evento/1814`);
    await this.page
      .locator('a[ic-include*="novo_convidado"]')
      .filter({ hasText: "Convidado", visible: true })
      .click();
    // Preenche os dados
    await this.page.locator("#id_nome").fill(nome);
    await this.page.locator('input[name="email"]').fill(email);
    await this.page.locator('input[name="telefone"]').fill(telefone);
    await this.page.locator("#id_aprovar").setChecked(false);
    // Clica em salvar
    await this.page.getByRole("button", { name: "Salvar" }).first().click();
  }
  async aprovarConvidado(idEvento, nomeConvidado) {
    // 1. Vai para a home
    await this.page.goto("https://app.codemyparty.com.br/home/");
    // 2. Espera a página estar totalmente carregada
    await this.page.waitForLoadState("networkidle");
    // 3. BUSCA SEGURA: Define o seletor e espera ele aparecer de verdade
    const seletorDropdown = 'button[data-id="select_evento_painel"]';
    await this.page
      .locator(seletorDropdown)
      .first()
      .waitFor({ state: "visible", timeout: 15000 });
    await this.page.locator(seletorDropdown).first().click();
    // 4. Continua o resto do processo...
    await this.page
      .getByText(idEvento)
      .filter({ visible: true })
      .first()
      .click();
    // 5. ESPERA INTELIGENTE: Aguarda a ampulheta aparecer antes de clicar
    const filtroPendentes = this.page
      .locator('[data-original-title="Esperando Aprovação"]')
      .first();
    await filtroPendentes.waitFor({ state: "visible" });
    await filtroPendentes.click();
    // 6. Intercepta o pop-up
    this.page.once("dialog", async (dialog) => {
      await dialog.accept();
    });
    // 7. BUSCA SEGURA: Espera o botão específico do convidado estar visível
    const botaoAprovar = this.page
      .locator(`button[ic-confirm*="${nomeConvidado}"]`)
      .first();
    await botaoAprovar.waitFor({ state: "visible", timeout: 15000 }); // Espera até 15s
    await botaoAprovar.click();
  }
}
module.exports = { AdminPage };
