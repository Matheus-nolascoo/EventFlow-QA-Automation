class ConfirmationPage {
  constructor(page) {
    this.page = page;
    this.inputFoto = 'input[type="file"]';
    this.checkAceite = "#id_aceite";
    this.botaoEnviar = "#enviar_form_btn";
  }

  async preencherConfirmacaoDinamicamente(
    link,
    caminhoFoto,
    pastaEvidencias,
    camposExtras = [],
  ) {
    await this.page.goto(link);
    await this.page.screenshot({
      path: `${pastaEvidencias}/02_pagina_de_confirmacao.png`,
      fullPage: true,
    });
    // 🧠 A Inteligência Artificial (Varredura de Campos Extras)
    // Se o utilizador enviou campos adicionais pela Interface Web, o robô vai procurá-los!
    if (camposExtras.length > 0) {
      console.log("🕵️‍♂️ A preencher campos extras dinâmicos...");

      for (const campo of camposExtras) {
        try {
          await this.page.getByLabel(campo.pergunta).fill(campo.resposta);

          const inputLocator = this.page.locator(
            `//label[contains(text(), '${campo.pergunta}')]/following-sibling::input | //div[contains(text(), '${campo.pergunta}')]/following-sibling::input`,
          );

          await inputLocator.fill(campo.resposta);
          console.log(
            `✔️ Preencheu o campo '${campo.pergunta}' com '${campo.resposta}'`,
          );
        } catch (error) {
          console.log(
            `⚠️ Aviso: Não foi possível encontrar o campo extra: ${campo.pergunta}`,
          );
        }
      }
    }

    await this.page.locator(this.inputFoto).setInputFiles(caminhoFoto);
    await this.page.locator(this.checkAceite).setChecked(true);
    await this.page.locator(this.botaoEnviar).click();

    await this.page.getByText("Dados enviados com sucesso").waitFor();
    await this.page.screenshot({
      path: `${pastaEvidencias}/03_dados_enviados.png`,
      fullPage: true,
    });
  }
}

module.exports = { ConfirmationPage };
