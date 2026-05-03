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
    console.log(`🔍 Buscando o contato exato: ${nomeContato}...`);
    await this.page.getByPlaceholder("Pesquisar").fill(nomeContato);
    await this.page.waitForTimeout(2000);
    await this.page.locator(`span[title="${nomeContato}"]`).first().click();
  }

  // ---------------------------------------------------------
  // AÇÃO 2: CAPTURAR LINK DO CONVITE
  // ---------------------------------------------------------
  async capturarLinkConvite(nomeConvidado, pastaEvidencias) {
    console.log("⏳ Aguardando a chegada da mensagem no WhatsApp...");

    // 🛡️ INTELIGÊNCIA ANTI-SPAM DA META
    const botaoContinuar = this.page
      .locator("button")
      .filter({ hasText: "OK" })
      .first();
    const bloqueioMeta = await botaoContinuar
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (bloqueioMeta) {
      console.log(
        "🛡️ Bloqueio da Meta detectado! Clicando em 'Continuar' para liberar o bot...",
      );
      await botaoContinuar.click();
      console.log("✅ Comando enviado! Aguardando o bot responder...");
    }

    // ⏳ ESPERA DA MENSAGEM
    console.log("⏳ Procurando a mensagem de convite...");
    const mensagemConvite = this.page.locator(`text=${nomeConvidado}`).last();
    
    try {
        await mensagemConvite.waitFor({ state: 'visible', timeout: 45000 });
        
        // 👇 A FOTO VOLTOU AQUI! Bate o print assim que a mensagem aparece e a tela rola.
        await mensagemConvite.scrollIntoViewIfNeeded(); // Garante que a mensagem tá no meio da tela
        await this.page.screenshot({
            path: `${pastaEvidencias}/01_convite_whatsapp.png` // Ajuste o nome do arquivo se precisar
        });
        console.log("📸 Print do convite capturado com sucesso!");

    } catch (error) {
        throw new Error(`⏰ O convite demorou mais de 45 segundos para chegar.`);
    }

    console.log("🔍 Extraindo o link do convite...");

    // Procura o botão de confirmar presença na tela
    const botaoConvite = this.page
      .locator('button[data-testid="cta-url-button"]', {
        hasText: "Confirmar Presença",
      })
      .last();

    await botaoConvite.click();

    // Aguarda o pop-up de segurança do WhatsApp e extrai o texto do link
    await this.page
      .getByText("Deseja abrir o link?")
      .waitFor({ state: "visible" });
    const linkExtraido = await this.page
      .getByTestId("popup-url-text")
      .innerText();

    // Clica em "Não" para fechar o pop-up sem abrir nova aba (pois o robô vai abrir o link sozinho depois)
    await this.page.getByRole("button", { name: "Não", exact: true }).click();

    console.log(`🔗 Link capturado com sucesso do botão: ${linkExtraido}`);
    return linkExtraido;
  }

  // ---------------------------------------------------------
  // AÇÃO 3: AGUARDAR E CAPTURAR O QR CODE
  // ---------------------------------------------------------
  async aguardarEReceberQRCode(nomeDinamico, pastaEvidencias) {
    const bolhaQrCode = this.page
      .locator('#main div[role="row"]')
      .filter({ hasText: nomeDinamico })
      .filter({ hasText: "Segue o seu QR Code" })
      .last();

    await bolhaQrCode.waitFor({ state: "visible", timeout: 120000 });

    await bolhaQrCode
      .locator("img")
      .first()
      .waitFor({ state: "visible", timeout: 30000 });
    await this.page.waitForTimeout(1000);

    await bolhaQrCode.scrollIntoViewIfNeeded();

    await this.page.screenshot({
      path: `${pastaEvidencias}/04_qrcode_whatsapp.png`,
    });

    const botaoQrCode = bolhaQrCode
      .locator('[role="button"], button, a')
      .filter({ hasText: "QR Code" })
      .first();

    await botaoQrCode.click();
  }
}

module.exports = { WhatsAppPage };
