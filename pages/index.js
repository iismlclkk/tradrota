import { useState, useRef } from 'react';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState('6-');
  const [imagePreview, setImagePreview] = useState(null);
  
  // Kontroller
  const [showRoute2, setShowRoute2] = useState(false);
  const [showBolts, setShowBolts] = useState(true);
  const [cruxCount, setCruxCount] = useState(1);
  
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = async () => {
    try {
      setImagePreview(null);
      setResult(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Kamera başlatılamadı, lütfen izinleri kontrol edin.");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResult(null);
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

  const handleAnalyze = async () => {
    let base64Image = null;

    if (imagePreview) {
      base64Image = imagePreview;
    } else if (videoRef.current && videoRef.current.srcObject) {
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
    <div style={{ backgroundColor: '#0f111a', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif', paddingBottom: '50px' }}>
      
      {/* Üst NASA Tarzı Kontrol Barı */}
      <header style={{ backgroundColor: '#161925', borderBottom: '2px solid #23293a', padding: '15px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 'bold', color: '#3b82f6', letterSpacing: '1px' }}>AURA AI // GEOLOGICAL CORD SYSTEM</h1>
          
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: '#94a3b8', marginRight: '8px' }}>HEDEF ZORLUK (UIAA):</label>
              <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)} style={{ backgroundColor: '#0f111a', color: '#fff', border: '1px solid #3b82f6', padding: '6px 12px', borderRadius: '4px', fontWeight: 'bold' }}>
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

            <div>
              <label style={{ fontSize: '0.85rem', color: '#94a3b8', marginRight: '8px' }}>KİLİT ETAP SAYISI:</label>
              <select value={cruxCount} onChange={(e) => setCruxCount(Number(e.target.value))} style={{ backgroundColor: '#0f111a', color: '#fff', border: '1px solid #ef4444', padding: '6px 12px', borderRadius: '4px', fontWeight: 'bold' }}>
                <option value={1}>1 Kilit</option>
                <option value={2}>2 Kilit</option>
                <option value={3}>3 Kilit</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Ekran Görsel Alanı */}
      <main style={{ position: 'relative', width: '100%', maxWidth: '850px', margin: '25px auto', aspectRatio: '4/3', backgroundColor: '#070a12', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.7)', border: '1px solid #23293a' }}>
        
        {!imagePreview && (
          <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}

        {imagePreview && (
          <img src={imagePreview} alt="Kaya Yüzeyi" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        )}

        {/* SVG Çizim Katmanı */}
        {result && (
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 100 100" preserveAspectRatio="none">
            
            {/* ANA ROTA */}
            {result.route1 && (
              <polyline points={result.route1.map(pt => `${pt.x},${pt.y}`).join(' ')} fill="none" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            )}

            {/* VARYANT ROTA 2 */}
            {showRoute2 && result.route2 && (
              <polyline points={result.route2.map(pt => `${pt.x},${pt.y}`).join(' ')} fill="none" stroke="#eab308" strokeWidth="1.5" strokeDasharray="3,2" strokeLinecap="round" strokeLinejoin="round" />
            )}

            {/* BOLTLAR */}
            {showBolts && result.bolts && result.bolts.map((bolt, idx) => (
              <g key={`bolt-${idx}`}>
                <rect x={bolt.x - 1.5} y={bolt.y - 1.5} width="3" height="3" fill="#10b981" rx="0.5" />
                <text x={bolt.x + 2} y={bolt.y + 1} fill="#10b981" fontSize="2.5" fontWeight="bold">B{idx + 1}</text>
              </g>
            ))}

            {/* ÇOKLU KİLİT NOKTALARI */}
            {result.cruxs && result.cruxs.slice(0, cruxCount).map((crux, idx) => (
              <g key={`crux-${idx}`}>
                <circle cx={crux.x} cy={crux.y} r="3.5" fill="none" stroke="#ef4444" strokeWidth="0.8" />
                <circle cx={crux.x} cy={crux.y} r="1" fill="#ef4444" />
                <text x={crux.x + 4.5} y={crux.y + 1} fill="#ef4444" fontSize="2.8" fontWeight="bold">KİLİT {idx + 1}</text>
              </g>
            ))}
          </svg>
        )}

        {loading && (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(7,10,18,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '15px' }}>
            <div style={{ width: '45px', height: '45px', border: '4px solid #161925', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ margin: 0, fontSize: '0.95rem', color: '#94a3b8' }}>Topoğrafya, Yüzey Yapısı ve Bolt Emniyet Derecesi Analiz Ediliyor...</p>
          </div>
        )}
      </main>

      {/* Görünüm Seçenekleri */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '25px', margin: '15px auto', maxWidth: '850px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
          <input type="checkbox" checked={showRoute2} onChange={(e) => setShowRoute2(e.target.checked)} />
          <span style={{ color: '#eab308', fontWeight: 'bold' }}>Alternatif Varyant Rota</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
          <input type="checkbox" checked={showBolts} onChange={(e) => setShowBolts(e.target.checked)} />
          <span style={{ color: '#10b981', fontWeight: 'bold' }}>Bolt Yerleşim Planı</span>
        </label>
      </div>

      {/* Medya Butonları */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', padding: '10px 20px', flexWrap: 'wrap' }}>
        <button onClick={startCamera} style={{ backgroundColor: '#161925', border: '1px solid #475569', color: '#fff', padding: '12px 24px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>📷 Kamerayı Aç</button>
        <button onClick={() => fileInputRef.current.click()} style={{ backgroundColor: '#161925', border: '1px solid #8b5cf6', color: '#a78bfa', padding: '12px 24px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>📁 Fotoğraf Yükle</button>
        <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
        <button onClick={handleAnalyze} disabled={loading} style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '12px 36px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 14px rgba(59,130,246,0.4)' }}>
          {loading ? 'HESAPLANIYOR...' : '⚡ GEOLOJİK ANALİZ VE ROTA ÜRET'}
        </button>
      </div>

      {/* YENİ ZENGİNLEŞTİRİLMİŞ TEKNİK RAPOR PANELİ */}
      {result && (
        <div style={{ maxWidth: '850px', margin: '30px auto 0 auto', padding: '0 15px' }}>
          <div style={{ backgroundColor: '#161925', borderRadius: '8px', border: '1px solid #23293a', padding: '25px' }}>
            <h2 style={{ fontSize: '1.1rem', margin: '0 0 20px 0', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #23293a', paddingBottom: '10px' }}>
              BÖLGE TOPOĞRAFYA VE KAYA ANALİZ RAPORU
            </h2>
            
            {/* Grid Kartlar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: '#0f111a', padding: '12px', borderRadius: '6px', border: '1px solid #23293a' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem', block: 'block' }}>KAYA YAPISI / FORMASYON</span>
                <p style={{ margin: '5px 0 0 0', fontSize: '1rem', fontWeight: 'bold', color: '#cbd5e1' }}>{result.details?.rockType}</p>
              </div>
              <div style={{ backgroundColor: '#0f111a', padding: '12px', borderRadius: '6px', border: '1px solid #23293a' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem', block: 'block' }}>ZORLUK DERECESİ (UIAA / FR)</span>
                <p style={{ margin: '5px 0 0 0', fontSize: '1rem', fontWeight: 'bold', color: '#10b981' }}>UIAA {result.details?.grade} ({result.details?.systemEquivalent})</p>
              </div>
              <div style={{ backgroundColor: '#0f111a', padding: '12px', borderRadius: '6px', border: '1px solid #23293a' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem', block: 'block' }}>EMNİYET / BOLTLANMA DERECESİ</span>
                <p style={{ margin: '5px 0 0 0', fontSize: '1rem', fontWeight: 'bold', color: '#eab308' }}>{result.details?.boltingDensity}</p>
              </div>
            </div>

            <div style={{ backgroundColor: '#0f111a', padding: '15px', borderRadius: '6px', border: '1px solid #23293a' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: '6px' }}>MİNİ REHBER / STRATEJİK DEĞERLENDİRME</span>
              <p style={{ margin: 0, lineHeight: '1.5', color: '#e2e8f0', fontSize: '0.9rem' }}>{result.details?.strategy}</p>
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
