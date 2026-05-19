import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCaptured, setIsCaptured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('Kamera Hazırlanıyor...');
  const [targetGrade, setTargetGrade] = useState('6-'); 

  useEffect(() => {
    initCamera();
  }, []);

  async function initCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: "environment" } },
        audio: false
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setStatus('Kamera Hazır');
    } catch (err) {
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = fallbackStream;
        setStatus('Ön Kamera Aktif');
      } catch (e) {
        setStatus('Kamera bulunamadı: ' + e.message);
      }
    }
  }

  const handleCaptureAndAnalyze = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    if (!isCaptured) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      video.style.display = 'none';
      setIsCaptured(true);
      
      setLoading(true);
      setStatus(`Yapay Zeka UIAA ${targetGrade} zorluğuna uygun doğal hatları simüle ediyor...`);

      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            imageWidth: canvas.width, 
            imageHeight: canvas.height,
            targetGrade: targetGrade
          })
        });
        const data = await response.json();
        setResult(data);

        drawAIResult(data.routeLine, data.cruxPoints);
        setStatus('Hedef Rota Başarıyla Oluşturuldu!');
      } catch (err) {
        setStatus('Bağlantı hatası oluştu.');
      } finally {
        setLoading(false);
      }
    } else {
      video.style.display = 'block';
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setIsCaptured(false);
      setResult(null);
      setStatus('Kamera Hazır');
    }
  };

  const drawAIResult = (routeLine, cruxPoints) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (routeLine && routeLine.length > 0) {
      ctx.beginPath();
      ctx.moveTo(routeLine[0].x, routeLine[0].y);
      for (let i = 1; i < routeLine.length; i++) {
        ctx.lineTo(routeLine[i].x, routeLine[i].y);
      }
      ctx.strokeStyle = '#3182ce';
      ctx.lineWidth = 6;
      ctx.stroke();
    }

    cruxPoints.forEach((point, index) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 18, 0, 2 * Math.PI);
      ctx.strokeStyle = '#e53e3e';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = '#e53e3e';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(`KİLİT ${index + 1}`, point.x + 22, point.y + 5);
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#1a202c', color: 'white', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#2d3748', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold' }}>
        <span>Aura AI - Rota Tasarım Paneli</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#a0aec0' }}>Hedef (UIAA):</span>
          <select 
            value={targetGrade} 
            onChange={(e) => setTargetGrade(e.target.value)}
            disabled={isCaptured}
            style={{ background: '#1a202c', color: 'white', border: '1px solid #4a5568', padding: '6px 12px', borderRadius: '4px', fontWeight: 'bold' }}
          >
            <option value="5">5</option>
            <option value="6-">6-</option>
            <option value="6">6</option>
            <option value="6+">6+</option>
            <option value="7-">7-</option>
            <option value="7">7</option>
            <option value="7+">7+</option>
            <option value="8-">8-</option>
            <option value="8">8</option>
            <option value="8+">8+</option>
          </select>
        </div>
      </div>
      
      <div style={{ flex: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000' }}>
        <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.8)', padding: '8px 12px', borderRadius: '4px', zIndex: 10, fontSize: '13px' }}>
          {status}
        </div>
        
        <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }}></video>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'absolute' }}></canvas>

        {result && (
          <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(26, 32, 44, 0.95)', padding: '20px', borderRadius: '8px', border: '1px solid #4a5568', width: '85%', maxWidth: '400px', zIndex: 30 }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#3182ce' }}>Tasarım Raporu</h3>
            <p style={{ margin: '5px 0' }}><strong>Hedeflenen Zorluk:</strong> <span style={{ color: '#38a169', fontSize: '18px', fontWeight: 'bold' }}>UIAA {result.targetGrade}</span></p>
            <p style={{ margin: '5px 0' }}><strong>Fransız / YDS Karşılığı:</strong> {result.frenchEquivalent}</p>
            <p style={{ margin: '5px 0' }}><strong>Tasarım Stratejisi:</strong> {result.strategyDescription}</p>
          </div>
        )}
      </div>

      <div style={{ background: '#2d3748', padding: '20px', display: 'flex', justifyContent: 'space-around' }}>
        <button onClick={handleCaptureAndAnalyze} disabled={loading} style={{ flex: 1, padding: '15px', background: loading ? '#4a5568' : '#3182ce', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '16px' }}>
          {loading ? "Rota Hesaplanıyor..." : (isCaptured ? "Yeni Rota Tasarla / Kamerayı Aç" : `UIAA ${targetGrade} Rota Üret`)}
        </button>
      </div>
    </div>
  );
}
