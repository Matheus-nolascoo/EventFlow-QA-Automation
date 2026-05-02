class WhatsAppPage {
    constructor(page) {
        this.page = page;
        this.seletorPesquisa = 'input[aria-label="Pesquisar ou começar uma nova conversa"]';
    }

    async buscarContato(nomeContato) {
        await this.page.goto('https://web.whatsapp.com');
        await this.page.locator(this.seletorPesquisa).waitFor({ timeout: 60000 }); 
        await this.page.locator(this.seletorPesquisa).fill(nomeContato);
        await this.page.getByTitle(nomeContato).first().click();
        await this.page.locator('#main').waitFor({ state: 'visible' });
    }

    async capturarLinkConvite(nomeDinamico, pastaEvidencias) {
        const painelChat = this.page.locator('#main');
        const bolhaMensagem = painelChat.locator('div[role="row"]', { hasText: nomeDinamico }).last();
        
        // Espera a mensagem chegar
        await bolhaMensagem.waitFor({ state: 'visible', timeout: 90000 });
        await this.page.screenshot({ path: `${pastaEvidencias}/01_convite_whatsapp.png` });

        // Clica no botão e extrai o link
        const botaoConvite = painelChat.locator('button[data-testid="cta-url-button"]', { hasText: 'Confirmar Presença' }).last();
        await botaoConvite.click();
        
        await this.page.getByText('Deseja abrir o link?').waitFor({ state: 'visible' });
        const linkExtraido = await this.page.getByTestId('popup-url-text').innerText();
        
        // Fecha o pop-up
        await this.page.getByRole('button', { name: 'Não', exact: true }).click();
        
        return linkExtraido; // Retorna o link para o script mestre usar
    }

    async aguardarEReceberQRCode(nomeDinamico, pastaEvidencias) {
        const bolhaQrCode = this.page.locator('#main div[role="row"]')
            .filter({ hasText: nomeDinamico })
            .filter({ hasText: 'Segue o seu QR Code' })
            .last();

        await bolhaQrCode.waitFor({ state: 'visible', timeout: 120000 });
        await bolhaQrCode.locator('img').first().waitFor({ state: 'visible', timeout: 30000 });
        await this.page.waitForTimeout(1000);
        await bolhaQrCode.scrollIntoViewIfNeeded();
        await this.page.screenshot({ path: `${pastaEvidencias}/04_qrcode_whatsapp.png` });
        const botaoQrCode = bolhaQrCode.locator('[role="button"], button, a').filter({ hasText: 'QR Code' }).first();
        await botaoQrCode.click();
    }
}

module.exports = { WhatsAppPage };