const { chromium } = require("playwright");
const AdmZip = require("adm-zip");
const fs = require("fs"); // Biblioteca nativa do Node para salvar arquivos
const { createCanvas, loadImage } = require("canvas");
const QRCode = require("qrcode");
const logger = require("./logger");

(async () => {
  // Abrimos o navegador no modo visível para você acompanhar a mágica
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  logger.info("Abrindo a página do QR Code...");
  await page.goto(
    "https://app.codemyparty.com.br/evento/qr/9306db55-79b8-4cdf-967b-8dbcce8290ed/7841ad69-368d-4cf0-9d2f-e4ee523f7e25",
  );

  logger.info("Interceptando o clique e aguardando o download...");

  // A Mágica da Interceptação (A Arapuca)
  // O Promise.all faz o robô clicar no botão e, SIMULTANEAMENTE, agarrar o arquivo que tenta cair na máquina
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: "baixar o seu passe digital" }).click(),
  ]);

  // Salvar o arquivo disfarçado de .zip na nossa pasta
  const caminhoCofre = "./ingresso.zip";
  await download.saveAs(caminhoCofre);
  logger.info(`Arquivo sequestrado com sucesso e salvo em: ${caminhoCofre}`);

  // ---------------------------------------------------------
  // A Autópsia (Backend com adm-zip)
  // ---------------------------------------------------------
  logger.info("Iniciando a autópsia do pacote com adm-zip...");

  // O AdmZip abre o arquivo sem precisar extrair pastas físicas no seu Windows
  const zip = new AdmZip(caminhoCofre);

  // Lemos o "cérebro" do ingresso em formato de texto e transformamos em um Objeto JavaScript
  const conteudoPassJson = zip.readAsText("pass.json");
  const dadosWallet = JSON.parse(conteudoPassJson);

  logger.info("\nDADOS EXTRAÍDOS COM SUCESSO:");
  logger.info(
    `- Cor de Fundo (backgroundColor): ${dadosWallet.backgroundColor}`,
  );
  logger.info(
    `- Cor do Texto (foregroundColor): ${dadosWallet.foregroundColor}`,
  );
  logger.info(
    `- Nome da Empresa (logoText): ${dadosWallet.logoText || "Não definido"}`,
  );

  // ---------------------------------------------------------
  // Criando o Ingresso Hiper-Realista com Canvas
  // ---------------------------------------------------------
  logger.info(
    "Preparando a tela do Canvas para desenhar o ingresso hiper-realista...",
  );

  const largura = 380;
  const altura = 650;
  const tela = createCanvas(largura, altura);
  const pincel = tela.getContext("2d");

  // 1. PINTAR O FUNDO DO CELULAR DE PRETO (Para sumir o xadrez do PNG)
  pincel.fillStyle = "#000000";
  pincel.fillRect(0, 0, largura, altura);

  // 2. A MÁGICA DO RECORTE (Máscara do Wallet com o "Notch")
  pincel.beginPath();
  pincel.moveTo(15, 0);
  pincel.lineTo(160, 0);
  pincel.arc(190, 0, 25, Math.PI, 0, true);
  pincel.lineTo(365, 0);
  pincel.quadraticCurveTo(380, 0, 380, 15);
  pincel.lineTo(380, 635);
  pincel.quadraticCurveTo(380, 650, 365, 650);
  pincel.lineTo(15, 650);
  pincel.quadraticCurveTo(0, 650, 0, 635);
  pincel.lineTo(0, 15);
  pincel.quadraticCurveTo(0, 0, 15, 0);
  pincel.closePath();
  pincel.clip(); // Aplica a máscara

  // 3. Pintar o Fundo do Ingresso (Slate Blue)
  pincel.fillStyle = dadosWallet.backgroundColor || "#2A3441";
  pincel.fillRect(0, 0, largura, altura);

  // 4. Extrair e Colar a Logo
  try {
    const bufferLogo = zip.readFile("logo.png");
    if (bufferLogo) {
      const logoImagem = await loadImage(bufferLogo);
      pincel.drawImage(logoImagem, 20, 20, 40, 40);
    }
  } catch (error) {}

  // 5. O Cabeçalho
  pincel.fillStyle = dadosWallet.foregroundColor || "#FFFFFF";
  pincel.font = "bold 20px Arial"; // Reduzido para caber melhor
  pincel.fillText(dadosWallet.logoText || "Code My Party Teste", 75, 48);

  // 5.1 O BANNER DO EVENTO (strip.png ou background.png)
  try {
    const bufferStrip =
      zip.readFile("strip.png") || zip.readFile("background.png");
    if (bufferStrip) {
      const stripImagem = await loadImage(bufferStrip);
      // Desenha o banner atravessando o ingresso, abaixo do cabeçalho
      pincel.drawImage(stripImagem, 0, 80, largura, 110);
    } else {
      // Fundo semi-transparente caso o evento não tenha banner cadastrado
      pincel.fillStyle = "rgba(0, 0, 0, 0.2)";
      pincel.fillRect(0, 80, largura, 110);
    }
  } catch (error) {
    logger.info("Banner não encontrado no .pkpass.");
  }

  // 6. Tipografia - Labels (Acinzentados)
  pincel.fillStyle = dadosWallet.labelColor || "#8B97A2";
  pincel.font = "bold 10px Arial";
  pincel.fillText("NOME", 20, 230);
  pincel.fillText("DATA", 210, 230); // Margem empurrada para a direita
  pincel.fillText("LOCAL", 20, 300);
  pincel.fillText("ENDEREÇO", 150, 300); // Endereço alinhado à direita

  // 7. Tipografia - Valores (Textos brancos)
  pincel.fillStyle = dadosWallet.foregroundColor || "#FFFFFF";

  // Nome: Fonte menor e usando limitador de largura (170px) para NUNCA encostar na Data
  pincel.font = "18px Arial";
  pincel.fillText("Matheus Teste 3046", 20, 250, 170);

  // Data: Fonte ajustada para caber a hora
  pincel.font = "16px Arial";
  pincel.fillText("22/11/2025 às 15h", 210, 250);

  // Local
  pincel.font = "14px Arial";
  pincel.fillText("Casa Code", 20, 320);

  // Endereço: Fonte legível (12px) e dividida em duas linhas
  pincel.font = "12px Arial";
  pincel.fillText("Belvedere Mall - R. Sebastião", 150, 320);
  pincel.fillText("Fabiano Dias, 210...", 150, 335);

  // 8. O Bloco do QR Code (Caixa branca)
  pincel.fillStyle = "#FFFFFF";
  pincel.beginPath();
  pincel.roundRect(90, 390, 200, 220, 10); // Subi um pouquinho na tela
  pincel.fill();

  // 9. Extraindo o DADO e gerando o QR Code dinamicamente (Modo iPhone)
  try {
    // 1. Procuramos o dado textual do QR Code dentro do pass.json
    let textoDoIngresso = "https://codemyparty.com.br"; // Link de segurança

    // O pass.json pode guardar o código num array 'barcodes' ou no objeto 'barcode'
    if (dadosWallet.barcodes && dadosWallet.barcodes.length > 0) {
      textoDoIngresso = dadosWallet.barcodes[0].message;
    } else if (dadosWallet.barcode) {
      textoDoIngresso = dadosWallet.barcode.message;
    }

    // 2. Usamos a biblioteca para desenhar o QR Code perfeito em tempo real
    const qrBuffer = await QRCode.toBuffer(textoDoIngresso, {
      width: 180,
      margin: 1, // Borda fina
      color: {
        dark: "#000000", // Cor do QR Code
        light: "#FFFFFF", // Fundo branco
      },
    });

    // 3. Transformamos em imagem e colamos no nosso Canvas
    const qrImagem = await loadImage(qrBuffer);
    pincel.drawImage(qrImagem, 100, 400, 180, 180);
  } catch (e) {
    logger.info("Erro ao gerar QR Code dinâmico, aplicando fallback.");
    pincel.fillStyle = "#111111";
    pincel.fillRect(105, 405, 170, 170);
    pincel.fillStyle = "#FFFFFF";
    pincel.font = "bold 16px Arial";
    pincel.fillText("QR SIMULADO", 135, 490);
  }

  // 10. Texto de rodapé
  pincel.fillStyle = "#000000";
  pincel.font = "bold 16px Arial";
  pincel.textAlign = "center";
  pincel.fillText("codemyparty.com.br", 190, 595);

  // 11. Salvar Obra de Arte
  const bufferImagem = tela.toBuffer("image/png");
  fs.writeFileSync("./06_visualizacao_wallet.png", bufferImagem);
  logger.info("Apple Wallet gerado com sucesso!");

  await browser.close();
})();
