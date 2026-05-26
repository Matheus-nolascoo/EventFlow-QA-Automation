const logger = require("../utils/logger");

class AdminPage {
  constructor(page) {
    this.page = page;
    this.inputUsuario = "#username";
    this.inputSenha = "#password";
    this.botaoSubmit = 'button[type="submit"]';
    this.inputNomeConvidado = "#id_nome";
  }

  async fazerLogin(usuario, senha) {
    logger.info("Verificando se precisamos fazer login...");

    const precisaLogar = await this.page
      .locator(this.inputUsuario)
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (precisaLogar) {
      logger.info("Inserindo credenciais...");
      await this.page.fill(this.inputUsuario, usuario);
      await this.page.fill(this.inputSenha, senha);
      await this.page.click(this.botaoSubmit);

      await this.page.waitForLoadState("networkidle");
    } else {
      logger.info(
        "O sistema já estava logado! Pulando a etapa de credenciais.",
      );
    }
  }

  async criarConvidadoTeste(idEvento, nome, email, telefone) {
    logger.info(`Criando convidado para o evento ${idEvento}...`);

    await this.selecionarEvento(idEvento);
    logger.info("Abrindo o modal de criação...");
    const botaoNovoConvidado = this.page
      .locator("button[ic-include*='modal_novo_convidado']")
      .filter({ hasText: " Convidado " })
      .first();

    await botaoNovoConvidado.waitFor({ state: "visible", timeout: 10000 });
    await botaoNovoConvidado.click({ force: true });

    logger.info("Preenchendo os dados do convidado no modal...");
    await this.page
      .locator("#id_nome")
      .waitFor({ state: "visible", timeout: 15000 });
    await this.page.locator("#id_nome").fill(nome);
    await this.page.locator('input[name="email"]').fill(email);
    await this.page.locator('input[name="telefone"]').fill(telefone);

    const checkboxAprovar = this.page.locator("#id_aprovar");
    if (await checkboxAprovar.isVisible()) {
      await checkboxAprovar.setChecked(false);
    }

    await this.page.getByRole("button", { name: "Salvar" }).first().click();
    await this.page
      .locator("#id_nome")
      .waitFor({ state: "hidden", timeout: 10000 });
    logger.info("Convidado criado com sucesso via Modal!");
  }

  async selecionarEvento(idEvento) {
    const seletorDropdown = 'button[data-id="select_evento_painel"]';
    await this.page
      .locator(seletorDropdown)
      .first()
      .waitFor({ state: "visible", timeout: 15000 });
    await this.page.locator(seletorDropdown).first().click();

    await this.page
      .getByText(idEvento.toString())
      .filter({ visible: true })
      .first()
      .click();
  }

  async aprovarConvidado(idEvento, nomeConvidado) {
    await this.selecionarEvento(idEvento);

    const filtroPendentes = this.page
      .locator('[data-original-title="Esperando Aprovação"]')
      .first();
    await filtroPendentes.waitFor({ state: "visible" });
    await filtroPendentes.click();

    this.page.once("dialog", async (dialog) => {
      await dialog.accept();
    });

    const botaoAprovar = this.page
      .locator(`button[ic-confirm*="${nomeConvidado}"]`)
      .first();
    await botaoAprovar.waitFor({ state: "visible", timeout: 15000 });
    await botaoAprovar.click();

    logger.info(
      `Convidado ${nomeConvidado} aprovado com sucesso via Dashboard!`,
    );
  }
}

module.exports = { AdminPage };