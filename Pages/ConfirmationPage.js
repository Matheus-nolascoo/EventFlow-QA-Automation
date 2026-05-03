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

    // 🧠 1. CAMPOS EXTRAS DINÂMICOS
    if (camposExtras && camposExtras.length > 0) {
      console.log("🕵️‍♂️ A preencher campos extras dinâmicos...");

      for (const campo of camposExtras) {
        try {
          const campoLabel = this.page.getByLabel(campo.pergunta);

          if (
            await campoLabel.isVisible({ timeout: 2000 }).catch(() => false)
          ) {
            await campoLabel.fill(campo.resposta);
          } else {
            const inputLocator = this.page.locator(
              `//label[contains(text(), '${campo.pergunta}')]/following-sibling::input | //div[contains(text(), '${campo.pergunta}')]/following-sibling::input`,
            );
            await inputLocator.fill(campo.resposta);
          }
          console.log(
            `✔️ Preencheu o campo '${campo.pergunta}' com '${campo.resposta}'`,
          );
        } catch (error) {
          console.log(
            `⚠️ Aviso: Não foi possível preencher o campo extra: ${campo.pergunta}`,
          );
        }
      }
    }

    // 📸 2. UPLOAD DE FOTO (Agora exigindo que seja VISÍVEL)
    console.log("🔍 A verificar se o evento exige fotografia...");
    try {
      const campoFoto = this.page.locator(this.inputFoto).first();
      // O segredo está aqui: state "visible". Se estiver escondido no HTML, ele ignora.
      await campoFoto.waitFor({ state: "visible", timeout: 3000 });
      console.log("📸 Campo de foto visível! A enviar o ficheiro...");
      await campoFoto.setInputFiles(caminhoFoto);
    } catch (e) {
      console.log(
        "⏩ Nenhuma fotografia visível/exigida neste evento. A avançar...",
      );
    }

    // ✅ 3. CHECKBOX DOS TERMOS DE PRIVACIDADE
    console.log("✅ A marcar a checkbox de privacidade...");
    try {
      const checkboxAceite = this.page.locator(this.checkAceite).first();
      await checkboxAceite.waitFor({ state: "attached", timeout: 3000 });
      await checkboxAceite.setChecked(true, { force: true });
    } catch (e) {
      console.log(
        "⚠️ Checkbox invisível pelo ID padrão. A forçar o clique alternativo...",
      );
      await this.page
        .locator("label")
        .filter({ hasText: /aceit/i })
        .first()
        .click({ force: true });
    }

    // 🚀 4. ENVIAR FORMULÁRIO
    console.log("🚀 A submeter o formulário de confirmação...");
    await this.page.locator(this.botaoEnviar).click();

    // Aguarda a mensagem de sucesso e tira a fotografia final
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
