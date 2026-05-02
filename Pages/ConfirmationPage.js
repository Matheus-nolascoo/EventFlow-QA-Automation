class ConfirmationPage {
    constructor(page) {
        this.page = page;
        this.inputFoto = 'input[type="file"]';
        this.checkAceite = '#id_aceite';
        this.botaoEnviar = '#enviar_form_btn';
    }

    async preencherConfirmacao(link, caminhoFoto, pastaEvidencias) {
        await this.page.goto(link);
        await this.page.screenshot({ path: `${pastaEvidencias}/02_pagina_de_confirmacao.png`, fullPage: true });
        
        await this.page.locator(this.inputFoto).setInputFiles(caminhoFoto);
        await this.page.locator(this.checkAceite).setChecked(true);
        await this.page.locator(this.botaoEnviar).click();
        
        await this.page.getByText('Dados enviados com sucesso').waitFor();
        await this.page.screenshot({ path: `${pastaEvidencias}/03_dados_enviados.png`, fullPage: true });
    }
}

module.exports = { ConfirmationPage };