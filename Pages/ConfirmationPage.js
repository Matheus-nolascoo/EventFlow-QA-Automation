const logger = require("../utils/logger");

class ConfirmationPage {
  constructor(page) {
    this.page = page;
    this.inputFoto = 'input[type="file"]';
    this.checkAceite = "#id_aceite";
    this.botaoEnviar = "#enviar_form_btn";
  }

  async preencherConfirmacaoDinamicamente(
    camposExtras,
    pastaEvidencias,
    caminhoFoto,
  ) {
    await this.page.screenshot({
      path: `${pastaEvidencias}/02_pagina_de_confirmacao.png`,
      fullPage: true,
    });

    // 1. CAMPOS EXTRAS DINÂMICOS
    if (camposExtras && camposExtras.length > 0) {
      logger.info("Preenchendo campos extras dinâmicos...");

      for (const campo of camposExtras) {
        try {
          const campoLabel = this.page.getByLabel(campo.pergunta);

          if (
            await campoLabel.isVisible({ timeout: 2000 }).catch(() => false)
          ) {
            await campoLabel.fill(campo.resposta);
          } else {
            const inputLocator = this.page
              .locator("div")
              .filter({ hasText: campo.pergunta })
              .locator("input, textarea");
            await inputLocator.fill(campo.resposta);
          }
          logger.info(
            `Campo preenchido '${campo.pergunta}' com '${campo.resposta}'`,
          );
        } catch (error) {
          logger.warn(
            `Aviso: Não foi possível preencher o campo extra: ${campo.pergunta}`,
          );
        }
      }
    }

    // 2. UPLOAD DE FOTO
    logger.info("Verificando se o evento exige fotografia...");
    try {
      const campoFoto = this.page.locator(this.inputFoto).first();
      await campoFoto.waitFor({ state: "visible", timeout: 3000 });
      logger.info("Campo de foto visível! Enviando ficheiro...");
      await campoFoto.setInputFiles(caminhoFoto);
    } catch (e) {
      logger.info(
        "Nenhuma fotografia visível/exigida neste evento. Avançando...",
      );
    }

    // 3. CHECKBOX DOS TERMOS DE PRIVACIDADE
    logger.info("Marcando a checkbox de privacidade...");
    try {
      const checkboxAceite = this.page.locator(this.checkAceite).first();
      await checkboxAceite.waitFor({ state: "attached", timeout: 3000 });
      await checkboxAceite.setChecked(true, { force: true });
    } catch (e) {
      logger.info(
        "Checkbox invisível pelo ID padrão. Forçando o clique alternativo...",
      );
      await this.page
        .locator("label")
        .filter({ hasText: /aceit/i })
        .first()
        .click({ force: true });
    }

    // 4. ENVIAR FORMULÁRIO
    logger.info("Enviando o formulário de confirmação...");
    await this.page.locator(this.botaoEnviar).click();

    await this.page
      .getByText(/Dados enviados com sucesso|confirmada/i)
      .waitFor({ timeout: 15000 });
    await this.page.screenshot({
      path: `${pastaEvidencias}/03_dados_enviados.png`,
      fullPage: true,
    });
  }
}

module.exports = { ConfirmationPage };
