const AdmZip = require("adm-zip");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const QRCode = require("qrcode");

async function gerarPrintAppleWallet(
  caminhoZip,
  pastaEvidencias,
  nomeConvidado,
) {
  console.log("🔬 Iniciando a autópsia do pacote e o Canvas Helper...");

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
  pincel.fillText(dadosWallet.logoText || "Code My Party Teste", 75, 48);

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
  pincel.fillText(nomeConvidado, 20, 250, 170); // <-- CORRIGIDO AQUI (Usa a variável da função)
  pincel.font = "16px Arial";
  pincel.fillText("22/11/2025 às 15h", 210, 250);
  pincel.font = "14px Arial";
  pincel.fillText("Casa Code", 20, 320);
  pincel.font = "12px Arial";
  pincel.fillText("Belvedere Mall - R. Sebastião", 150, 320);
  pincel.fillText("Fabiano Dias, 210...", 150, 335);

  pincel.fillStyle = "#FFFFFF";
  pincel.beginPath();
  pincel.roundRect(90, 390, 200, 220, 10);
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
    console.log("⚠️ Erro ao gerar QR Code dinâmico, aplicando fallback.");
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
  fs.unlinkSync(caminhoZip); // <-- CORRIGIDO AQUI (Variável que a função conhece)
  console.log(
    "✅ Helper: Obra de arte fotorrealista gerada e salva com sucesso!",
  );
}

// Exportando a ferramenta para o resto do projeto usar
module.exports = { gerarPrintAppleWallet };
