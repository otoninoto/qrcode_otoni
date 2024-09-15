import { useState } from 'react';
import QRCode from 'react-qr-code';
import qrcode from 'qrcode';
import jsPDF from 'jspdf';
import './App.css';

function App() {
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');
  const [qrcodes, setQrcodes] = useState([]);
  const [imagem, setImagem] = useState(null);

  const gerarQRCodeComImagem = async (valor) => {
    return new Promise((resolve) => {
      qrcode.toDataURL(valor.toString(), { width: 150, margin: 2 }, async (erro, url) => {
        if (erro) {
          return resolve({ valor, url: null });
        }
  
        if (imagem) {
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
  
          const qrImage = new Image();
          qrImage.src = url;
  
          qrImage.onload = () => {
            canvas.width = qrImage.width;
            canvas.height = qrImage.height;
            context.drawImage(qrImage, 0, 0);
  
            const logo = new Image();
            logo.src = URL.createObjectURL(imagem);
  
            logo.onload = () => {
              const logoSize = canvas.width * 0.2; 
              const x = (canvas.width - logoSize) / 2;
              const y = (canvas.height - logoSize) / 2;
  
              
              const padding = logoSize * 0.1;
              context.fillStyle = 'white'; 
              context.fillRect(x - padding, y - padding, logoSize + 2 * padding, logoSize + 2 * padding);
  
              context.drawImage(logo, x, y, logoSize, logoSize);
  
              const finalUrl = canvas.toDataURL('image/png');
              resolve({ valor, url: finalUrl });
            };
          };
        } else {
          resolve({ valor, url });
        }
      });
    });
  };


  const gerarQRCodes = async () => {
    const numInicio = parseInt(inicio, 10);
    const numFim = parseInt(fim, 10);

    if (isNaN(numInicio) || isNaN(numFim) || numInicio > numFim) {
      alert('Por favor, insira números válidos com o número inicial menor ou igual ao final.');
      return;
    }

    const promessasQRCode = Array.from(
      { length: numFim - numInicio + 1 },
      (_, i) => gerarQRCodeComImagem(numInicio + i)
    );

    const resultados = await Promise.all(promessasQRCode);
    setQrcodes(resultados);
  };

  const gerarPDFs = () => {
    const qrCodesPorLinha = 4;
    const qrCodesPorColuna = 5;
    const qrCodesPorPagina = qrCodesPorLinha * qrCodesPorColuna;
    const imgSize = 40;
    const margem = 10;
    const margemSuperior = 10;
    const margemEsquerda = 10;
    const fontSize = 12;

    let pdf = new jsPDF();
    pdf.setFontSize(fontSize);

    qrcodes.forEach((item, index) => {
      const indexDentroPagina = index % qrCodesPorPagina;

      const xPos = margemEsquerda + (indexDentroPagina % qrCodesPorLinha) * (imgSize + margem);
      const yPos = margemSuperior + Math.floor(indexDentroPagina / qrCodesPorLinha) * (imgSize + margem);

      if (indexDentroPagina === 0 && index !== 0) {
        pdf.addPage();
      }

      pdf.addImage(item.url, 'PNG', xPos, yPos, imgSize, imgSize);
      const textX = xPos + imgSize / 2;
      const textY = yPos + imgSize + 8;
      pdf.text(item.valor.toString(), textX, textY, { align: 'center' });
    });

    pdf.save('qrcodes.pdf');
  };

  const handleImageUpload = (e) => {
    setImagem(e.target.files[0]);
  };

  return (
    <div className="container">
      <h1 className="title">OTONI QR CODE GENERATOR</h1> 
      <div className="controls">
        <input
          type="number"
          className="input"
          placeholder="Número inicial"
          value={inicio}
          onChange={(e) => setInicio(e.target.value)}
        />
        <input
          type="number"
          className="input"
          placeholder="Número final"
          value={fim}
          onChange={(e) => setFim(e.target.value)}
        />
        <input
          type="file"
          className="file-input"
          accept="image/*"
          onChange={handleImageUpload}
        />
        <button className="button" onClick={gerarQRCodes}>
          Gerar Códigos QR
        </button>
        <button className="button" onClick={gerarPDFs} disabled={qrcodes.length === 0}>
          Gerar PDFs
        </button>
      </div>
      <div className="qr-container">
        {qrcodes.map((item) => (
          <div key={item.valor} className="qr-item">
            <QRCode value={item.valor.toString()} />
            <p className="qr-text">Valor: {item.valor}</p>
            <a href={item.url} download={`qrcode_${item.valor}.png`} className="qr-download">
              Baixar código QR
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
