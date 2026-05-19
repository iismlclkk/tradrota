import { useState, useRef } from 'react';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState('6-');
  const [imagePreview, setImagePreview] = useState(null);
  
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  // Kamerayı Başlat
  const startCamera = async () => {
    try {
      setImagePreview(null);
      setResult(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Kamera başlatılamadı, lütfen izinleri kontrol edin veya dosya yükleme seçeneğini kullanın.");
    }
  };

  // Fotoğraf Seçildiğinde Önizleme Yap
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResult(null);
      // Kamerayı durdur (eğer açıksa)
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // İster Kameradan İster Yüklenen Resimden Analiz Başlat
  const handleAnalyze = async () => {
    let base64Image = null;

    if (imagePreview) {
      // Eğer kullanıcı galeri/dosya seçtiyse direkt base64'ü kullan
      base64Image = imagePreview;
    } else if (videoRef.current && videoRef.current.srcObject) {
      // Eğer kamera aktifse anlık ekran görüntüsünü canvas'a çek
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      base64Image = canvas.toDataURL('image/jpeg');
    } else {
      alert("Lütfen önce kamerayı açın veya bir fotoğraf yükleyin!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image, grade: selectedGrade }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      alert("Analiz sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#1a1e29', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {/* Üst Bar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', backgroundColor: '#252b3d', borderBottom: '1px solid #38435a' }}>
        <h1 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 'bold' }}>Aura AI - Rota Tasarım Paneli</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '0.9rem' }}>Hedef (UIAA):</label>
          <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)} style={{ backgroundColor: '#1a1e29', color: '#fff', border: '1px solid #556587', padding: '5px', borderRadius: '4px' }}>
            <option value="5">5</option>
            <option value="6-">6-</option>
            <option value="6">6</option>
            <option value="6+">6+</option>
            <option value="7-">7-</option>
            <option value="7">7</option>
            <option value="7+">7+</option>
            <option value="8-">8-</option>
          </select>
        </div>
      </header>

      {/* Ana Ekran Alanı */}
      <main style={{ position: 'relative', width: '100%', maxWidth: '800px', margin: '20px auto', aspectRatio: '4/3', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
        
        {/* Canlı Kamera Akışı */}
        {!imagePreview && (
          <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}

        {/* Yüklenen Fotoğraf Önizlemesi */}
        {imagePreview && (
          <img src={imagePreview} alt="Yüklenen Kaya" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        )}

        {/* Görsel Katman (SVG Rota Çizgisi) */}
        {result && result.coordinates && (
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Rota Hattı */}
            <polyline
              points={result.coordinates.map(pt => `${pt.x},${pt.y}`).join(' ')}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ strokeDasharray: '200', animation: 'dash 3s linear forwards' }}
            />
            {/* Kilit Noktası Çemberi */}
            {result.crux && (
              <>
                <circle cx={result.crux.x} cy={result.crux.y} r="4" fill="none" stroke="#ef4444" strokeWidth="1" />
                <text x={result.crux.x + 5} y={result.crux.y + 1.5} fill="#ef4444" fontSize="3" fontWeight="bold">KİLİT 1</text>
              </>
            )}
          </svg>
        )}

        {/* Yapay Zeka Bilgi Raporu */}
        {result && (
          <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(21, 27, 41, 0.9)', padding: '15px', borderRadius: '8px', border: '1px solid #38435a', width: '85%', maxWidth: '400px', fontSize: '0.85rem' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#3b82f6', borderBottom: '1px solid #38435a', paddingBottom: '4px' }}>Tasarım Raporu</h3>
            <p style={{ margin: '4px 0' }}><strong>Hedeflenen Zorluk:</strong> <span style={{ color: '#10b981' }}>UIAA {result.details?.grade || selectedGrade}</span></p>
            <p style={{ margin: '4px 0' }}><strong>Fransız / YDS Karşılığı:</strong> {result.details?.systemEquivalent || '5c / 5.9'}</p>
            <p style={{ margin: '4px 0', lineHeight: '1.3', color: '#cbd5e1' }}><strong>Tasarım Stratejisi:</strong> {result.details?.strategy || 'Yüzey analiz edildi.'}</p>
          </div>
        )}

        {/* Yükleniyor Bildirimi */}
        {loading && (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid #38435a', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1' }}>Yapay Zeka Kaya Yapısını Analiz Ediyor...</p>
          </div>
        )}
      </main>

      {/* Alt Kontrol Butonları */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', padding: '10px 20px', flexWrap: 'wrap' }}>
        <button onClick={startCamera} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
          📷 Kamerayı Aç
        </button>
        
        <button onClick={() => fileInputRef.current.click()} style={{ backgroundColor: '#8b5cf6', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
          📁 Fotoğraf Seç
        </button>
        <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />

        <button onClick={handleAnalyze} disabled={loading} style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '12px 30px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
          {loading ? 'Analiz Ediliyor...' : '⚡ Rotayı Üret'}
        </button>
      </div>

      {/* Gizli Canvas (Kamera Görüntüsünü İşlemek İçin) */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* CSS Animasyonları */}
      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes dash { to { stroke-dashoffset: 0; } }
      `}</style>
    </div>
  );
}
