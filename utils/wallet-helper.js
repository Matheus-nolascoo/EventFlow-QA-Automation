const AdmZip = require("adm-zip");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const QRCode = require("qrcode");
const logger = require("./logger");

//  1. Adicionamos as variáveis dinâmicas na porta de entrada da função
async function gerarPrintAppleWallet(
  caminhoZip,
  pastaEvidencias,
  nomeConvidado,
  nomeEvento,
  dataEvento,
  localEvento,
  enderecoEvento,
) {
  logger.info("Iniciando a autópsia do pacote e o Canvas Helper...");

  const zip = new AdmZip(caminhoZip);
  const dadosWallet = JSON.parse(zip.readAsText("pass.json"));

  // O Pintor Sênior v2.0
  const largura = 380;
  const altura = 650;
  const tela = createCanvas(largura, altura);
  const pincel = tela.getContext("2d");

  pincel.fillStyle = "#000000";
  pincel.fillRect(0, 0, largura, altura);

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
  pincel.clip();

  pincel.fillStyle = dadosWallet.backgroundColor || "#2A3441";
  pincel.fillRect(0, 0, largura, altura);

  try {
    const bufferLogo = zip.readFile("logo.png");
    if (bufferLogo) {
      const logoImagem = await loadImage(bufferLogo);
      pincel.drawImage(logoImagem, 20, 20, 40, 40);
    }
  } catch (error) {}

  pincel.fillStyle = dadosWallet.foregroundColor || "#FFFFFF";
  pincel.font = "bold 20px Arial";

  // 👇 2. Usa o nome do evento dinâmico se não vier no JSON
  pincel.fillText(dadosWallet.logoText || nomeEvento, 75, 48);

  try {
    const bufferStrip =
      zip.readFile("strip.png") || zip.readFile("background.png");
    if (bufferStrip) {
      const stripImagem = await loadImage(bufferStrip);
      pincel.drawImage(stripImagem, 0, 80, largura, 110);
    } else {
      pincel.fillStyle = "rgba(0, 0, 0, 0.2)";
      pincel.fillRect(0, 80, largura, 110);
    }
  } catch (error) {}

  pincel.fillStyle = dadosWallet.labelColor || "#8B97A2";
  pincel.font = "bold 10px Arial";
  pincel.fillText("NOME", 20, 230);
  pincel.fillText("DATA", 210, 230);
  pincel.fillText("LOCAL", 20, 300);
  pincel.fillText("ENDEREÇO", 150, 300);

  pincel.fillStyle = dadosWallet.foregroundColor || "#FFFFFF";
  pincel.font = "18px Arial";
  pincel.fillText(nomeConvidado, 20, 250, 170);

  // 👇 3. Substituímos o Hardcoded pelas variáveis!
  pincel.font = "16px Arial";
  pincel.fillText(dataEvento, 210, 250, 150);

  pincel.font = "14px Arial";
  pincel.fillText(localEvento, 20, 320, 120);

  pincel.font = "12px Arial";
  pincel.fillText(enderecoEvento, 150, 320, 210);

  pincel.fillStyle = "#FFFFFF";
  pincel.beginPath();
  pincel.roundRect(90, 390, 200, 220, 10);
  pincel.fill();

  // 9. Extraindo o DADO e gerando o QR Code dinamicamente (Modo iPhone)
  try {
    let textoDoIngresso = "https://codemyparty.com.br";

    if (dadosWallet.barcodes && dadosWallet.barcodes.length > 0) {
      textoDoIngresso = dadosWallet.barcodes[0].message;
    } else if (dadosWallet.barcode) {
      textoDoIngresso = dadosWallet.barcode.message;
    }

    const qrBuffer = await QRCode.toBuffer(textoDoIngresso, {
      width: 180,
      margin: 1,
      color: { dark: "#000000", light: "#FFFFFF" },
    });

    const qrImagem = await loadImage(qrBuffer);
    pincel.drawImage(qrImagem, 100, 400, 180, 180);
  } catch (e) {
    logger.warn("Erro ao gerar QR Code dinâmico, aplicando fallback.");
    pincel.fillStyle = "#111111";
    pincel.fillRect(105, 405, 170, 170);
    pincel.fillStyle = "#FFFFFF";
    pincel.font = "bold 16px Arial";
    pincel.fillText("QR SIMULADO", 135, 490);
  }

  // 3. Salvar na Pasta Oficial de Evidências
  const bufferImagem = tela.toBuffer("image/png");
  fs.writeFileSync(
    `${pastaEvidencias}/06_visualizacao_wallet.png`,
    bufferImagem,
  );

  // Limpeza: Apagar o arquivo .zip temporário
  fs.unlinkSync(caminhoZip);
  logger.info("Helper: Obra de arte fotorrealista gerada e salva com sucesso!");
}

module.exports = { gerarPrintAppleWallet };
