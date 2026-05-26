const logger = require("../utils/logger"); // AJUSTE: 'utils' em minúsculo

class WhatsAppPage {
  constructor(page) {
    this.page = page;
    this.seletorPesquisa =
      'input[aria-label="Pesquisar ou começar uma nova conversa"]';
  }

  // ---------------------------------------------------------
  // AÇÃO 1: BUSCAR CONTATO
  // ---------------------------------------------------------
  async buscarContato(nomeContato) {
    logger.info(`Buscando o contato exato: ${nomeContato}...`);
    await this.page.getByPlaceholder("Pesquisar").fill(nomeContato);
    await this.page.waitForTimeout(2000);
    await this.page.locator(`span[title="${nomeContato}"]`).first().click();
  }

  // ---------------------------------------------------------
  // AÇÃO 2: CAPTURAR LINK DO CONVITE
  // ---------------------------------------------------------
  async capturarLinkConvite(nomeConvidado, pastaEvidencias) {
    logger.info("Aguardando a chegada da mensagem no WhatsApp...");

    // 🛡️ INTELIGÊNCIA ANTI-SPAM DA META
    const botaoContinuar = this.page
      .locator("button")
      .filter({ hasText: "OK" })
      .first();
    const bloqueioMeta = await botaoContinuar
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (bloqueioMeta) {
      logger.info(
        "Bloqueio da Meta detectado! Clicando em 'Continuar' para liberar o bot...",
      );
      await botaoContinuar.click();
      logger.info("Comando enviado! Aguardando o bot responder...");
    }

    // ⏳ ESPERA DA MENSAGEM
    logger.info("Procurando a mensagem de convite...");
    const mensagemConvite = this.page.locator(`text=${nomeConvidado}`).last();

    try {
      await mensagemConvite.waitFor({ state: "visible", timeout: 45000 });

      // Bate o print assim que a mensagem aparece e o ecrã rola.
      await mensagemConvite.scrollIntoViewIfNeeded();
      await this.page.screenshot({
        path: `${pastaEvidencias}/01_convite_whatsapp.png`,
      });
      logger.info("Print do convite capturado com sucesso!");
    } catch (error) {
      throw new Error(`O convite demorou mais de 45 segundos para chegar.`);
    }

    logger.info("Extraindo o link do convite...");
    const botaoConvite = this.page
      .locator('button[data-testid="cta-url-button"]')
      .filter({ hasText: "Confirmar Presença" })
      .last();

    await botaoConvite.click();

    await this.page
      .getByText("Deseja abrir o link?")
      .waitFor({ state: "visible" });
    const linkExtraido = await this.page
      .getByTestId("popup-url-text")
      .innerText();

    await this.page.getByRole("button", { name: "Não", exact: true }).click();
    logger.info(`Link capturado com sucesso do botão: ${linkExtraido}`);
    return linkExtraido;
  }

  // ---------------------------------------------------------
  // AÇÃO 3: AGUARDAR E CAPTURAR O QR CODE
  // ---------------------------------------------------------
  async aguardarEReceberQRCode(nomeDinamico, pastaEvidencias) {
    const bolhaQrCode = this.page
      .locator('#main div[role="row"]')
      .filter({ hasText: "Segue o seu QR Code" })
      .last();

    await bolhaQrCode.waitFor({ state: "visible", timeout: 120000 });

    await bolhaQrCode
      .locator("img")
      .first()
      .waitFor({ state: "visible", timeout: 30000 });
    await bolhaQrCode.scrollIntoViewIfNeeded();
    await this.page.screenshot({
      path: `${pastaEvidencias}/04_qrcode_whatsapp.png`,
    });
  }

  async clicarNoBotaoDoQrCode() {
    const bolhaQrCode = this.page
      .locator("button[data-testid='launch']")
      .filter({ hasText: "QR Code" })
      .last();

    await bolhaQrCode.waitFor({ state: "visible" });
    await bolhaQrCode.click();
  }
}

module.exports = { WhatsAppPage };
