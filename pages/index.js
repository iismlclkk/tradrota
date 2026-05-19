import { useState, useRef } from 'react';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState('6-');
  const [imagePreview, setImagePreview] = useState(null);
  
  // Kalibrasyon ve Katman Kontrolleri
  const [calcMethod, setCalcMethod] = useState('manual'); // manual veya reference
  const [manualHeight, setManualHeight] = useState(25); // Varsayılan 25 metre
  const [refObjectLength, setRefObjectLength] = useState(1.75); // Varsayılan partner boyu (1.75m)
  
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
      alert("Kamera bağlantısı başarısız, lütfen izinleri kontrol edin.");
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
      reader.onloadend = () => { setImagePreview(reader.result); };
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
      alert("Sistem sinyali yok: Kamera veya fotoğraf eksik.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: base64Image, 
          grade: selectedGrade,
          calcMethod,
          manualHeight: Number(manualHeight),
          refObjectLength: Number(refObjectLength)
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      alert("Veri işleme hatası.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#060913', color: '#00ffcc', minHeight: '100vh', fontFamily: '"Courier New", Courier, monospace', padding: '15px' }}>
      
      {/* Üst NASA Tarzı Kontrol Kontrol Paneli */}
      <header style={{ border: '1px solid #1f3a60', backgroundColor: '#0b132b', padding: '12px 20px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '15px', boxShadow: '0 0 15px rgba(0,255,204,0.1)' }}>
        <div>
          <div style={{ fontSize: '1.3rem', fontWeight: 'bold', letterSpacing: '2px', color: '#00ffcc' }}>
            ⚡ AURA_AI // TOPO_ENGINE_V3
          </div>
          <div style={{ fontSize: '0.65rem', color: '#5f85b6', marginTop: '3px' }}>SYS_STATUS: SCALED_ACTIVE // CALIBRATION: ONLINE</div>
        </div>
        
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <div style={{ border: '1px solid #1f3a60', padding: '5px 10px', backgroundColor: '#070c1a', borderRadius: '3px' }}>
            <label style={{ fontSize: '0.75rem', color: '#5f85b6', marginRight: '6px' }}>TARGET_GRADE:</label>
            <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)} style={{ backgroundColor: 'transparent', color: '#00ffcc', border: 'none', fontWeight: 'bold', outline: 'none', cursor: 'pointer' }}>
              {['5', '6-', '6', '6+', '7-', '7', '7+', '8-'].map(g => <option key={g} value={g} style={{backgroundColor: '#070c1a'}}>{g}</option>)}
            </select>
          </div>

          <div style={{ border: '1px solid #1f3a60', padding: '5px 10px', backgroundColor: '#070c1a', borderRadius: '3px' }}>
            <label style={{ fontSize: '0.75rem', color: '#5f85b6', marginRight: '6px' }}>CRUX_COUNT:</label>
            <select value={cruxCount} onChange={(e) => setCruxCount(Number(e.target.value))} style={{ backgroundColor: 'transparent', color: '#ff3366', border: 'none', fontWeight: 'bold', outline: 'none', cursor: 'pointer' }}>
              <option value={1} style={{backgroundColor: '#070c1a'}}>1 KİLİT</option>
              <option value={2} style={{backgroundColor: '#070c1a'}}>2 KİLİT</option>
              <option value={3} style={{backgroundColor: '#070c1a'}}>3 KİLİT</option>
            </select>
          </div>
        </div>
      </header>

      {/* Ana Grid Düzeni */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(320px, 380px)', gap: '15px', maxWidth: '1400px', margin: '0 auto', alignItems: 'start' }}>
        
        {/* SOL: Canlı HUD ve Grafik Matrisi */}
        <div style={{ position: 'relative', border: '1px solid #1f3a60', backgroundColor: '#03050a', borderRadius: '4px', overflow: 'hidden' }}>
          
          <div style={{ position: 'absolute', top: 5, left: 5, width: 10, height: 10, borderTop: '2px solid #00ffcc', borderLeft: '2px solid #00ffcc', zIndex: 2 }} />
          <div style={{ position: 'absolute', top: 5, right: 5, width: 10, height: 10, borderTop: '2px solid #00ffcc', borderRight: '2px solid #00ffcc', zIndex: 2 }} />
          
          <div style={{ aspectRatio: '4/3', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {!imagePreview && !videoRef.current?.srcObject && (
              <div style={{ color: '#1f3a60', fontSize: '0.9rem', textAlign: 'center' }}>
                [ SYSTEM IDLE // FEED NOT DETECTED ]<br/>
                <span style={{ fontSize: '0.7rem', color: '#395377' }}>Lütfen Alttan Kamera veya Dosya Girişi Sağlayın</span>
              </div>
            )}
            {!imagePreview && (
              <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: videoRef.current?.srcObject ? 'block' : 'none' }} />
            )}
            {imagePreview && (
              <img src={imagePreview} alt="Kaya Analizi" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            )}
          </div>

          {/* SVG Çizim Katmanı */}
          {result && (
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 100 100" preserveAspectRatio="none">
              
              {/* KALİBRE EDİLMİŞ METRE CETVELİ */}
              <g opacity="0.6">
                <line x1="6" y1="10" x2="6" y2="90" stroke="#00ffcc" strokeWidth="0.3" strokeDasharray="1,1" />
                {result.scaleTicks && result.scaleTicks.map((tick, idx) => (
                  <g key={`t-${idx}`}>
                    <line x1="4" y1={tick.y} x2="6" y2={tick.y} stroke="#00ffcc" strokeWidth="0.4" />
                    <text x="8" y={tick.y + 0.8} fill="#00ffcc" fontSize="1.8" fontWeight="bold">{tick.label}</text>
                  </g>
                ))}
              </g>

              {/* ANA ROTA */}
              {result.route1 && (
                <polyline points={result.route1.map(pt => `${pt.x},${pt.y}`).join(' ')} fill="none" stroke="#00b3ff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" filter="drop-shadow(0px 0px 3px #00b3ff)" />
              )}

              {/* VARYANT ROTA 2 */}
              {showRoute2 && result.route2 && (
                <polyline points={result.route2.map(pt => `${pt.x},${pt.y}`).join(' ')} fill="none" stroke="#ffcc00" strokeWidth="0.9" strokeDasharray="2,1.5" strokeLinecap="round" strokeLinejoin="round" />
              )}

              {/* BOLTLAR */}
              {showBolts && result.bolts && result.bolts.map((bolt, idx) => (
                <g key={`b-${idx}`}>
                  <rect x={bolt.x - 1.2} y={bolt.y - 1.2} width="2.4" height="2.4" fill="none" stroke="#00ffcc" strokeWidth="0.4" />
                  <circle cx={bolt.x} cy={bolt.y} r="0.4" fill="#00ffcc" />
                  <text x={bolt.x + 2} y={bolt.y + 0.8} fill="#00ffcc" fontSize="2" fontWeight="bold">B{idx + 1} ({bolt.h}m)</text>
                </g>
              ))}

              {/* KİLİT NOKTALARI */}
              {result.cruxs && result.cruxs.slice(0, cruxCount).map((crux, idx) => (
                <g key={`c-${idx}`}>
                  <circle cx={crux.x} cy={crux.y} r="3" fill="none" stroke="#ff3366" strokeWidth="0.5" strokeDasharray="1,1" />
                  <circle cx={crux.x} cy={crux.y} r="0.8" fill="#ff3366" />
                  <text x={crux.x + 4} y={crux.y + 0.8} fill="#ff3366" fontSize="2.2" fontWeight="bold">KİLİT_{idx + 1} ({crux.h}m)</text>
                </g>
              ))}
            </svg>
          )}

          {loading && (
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(3,5,10,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
              <div style={{ width: '90%', height: '1px', backgroundColor: '#00ffcc', boxShadow: '0 0 10px #00ffcc', position: 'absolute', top: 0, animation: 'scan 2s linear infinite' }} />
              <div style={{ fontSize: '0.85rem', letterSpacing: '1px', color: '#00ffcc', marginBottom: '5px' }}>&gt;&gt; RUNNING_SCALED_SCAN...</div>
              <div style={{ fontSize: '0.65rem', color: '#5f85b6' }}>Matematiksel Ölçek Modeli Aktif Ediliyor</div>
            </div>
          )}
        </div>

        {/* SAĞ PANEL: Konfigürasyon ve Gerçek Zamanlı Telemetri */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* SAHA METRAJ KALİBRASYON MERKEZİ (ÖNERİ ENTEGRASYONU) */}
          <div style={{ border: '1px solid #1f3a60', backgroundColor: '#0b132b', padding: '15px', borderRadius: '4px' }}>
            <div style={{ fontSize: '0.75rem', color: '#5f85b6', marginBottom: '10px', borderBottom: '1px solid #1f3a60', paddingBottom: '4px', fontWeight: 'bold' }}>SAHA_METRAJ_KALİBRASYONU</div>
            
            <div style={{ display: 'flex', gap: '15px', marginBottom: '12px' }}>
              <label style={{ fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input type="radio" name="calc" checked={calcMethod === 'manual'} onChange={() => setCalcMethod('manual')} style={{ accentColor: '#00ffcc' }} />
                <span>Manuel Giriş</span>
              </label>
              <label style={{ fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input type="radio" name="calc" checked={calcMethod === 'reference'} onChange={() => setCalcMethod('reference')} style={{ accentColor: '#00ffcc' }} />
                <span>Referans Nesne</span>
              </label>
            </div>

            {calcMethod === 'manual' ? (
              <div>
                <label style={{ fontSize: '0.65rem', color: '#5f85b6', display: 'block', marginBottom: '4px' }}>TAHMİNİ TOPLAM ROTA BOYU (METRE):</label>
                <input type="number" value={manualHeight} onChange={(e) => setManualHeight(e.target.value)} style={{ backgroundColor: '#03050a', color: '#00ffcc', border: '1px solid #1f3a60', padding: '6px', borderRadius: '3px', width: '100%', fontFamily: 'inherit', fontWeight: 'bold', outline: 'none' }} />
              </div>
            ) : (
              <div>
                <label style={{ fontSize: '0.65rem', color: '#5f85b6', display: 'block', marginBottom: '4px' }}>REFERANS PARTNER / NESNE BOYU (METRE):</label>
                <input type="number" step="0.01" value={refObjectLength} onChange={(e) => setRefObjectLength(e.target.value)} style={{ backgroundColor: '#03050a', color: '#00ffcc', border: '1px solid #1f3a60', padding: '6px', borderRadius: '3px', width: '100%', fontFamily: 'inherit', fontWeight: 'bold', outline: 'none' }} />
              </div>
            )}
          </div>

          {/* Gösterim Kontrolleri */}
          <div style={{ border: '1px solid #1f3a60', backgroundColor: '#0b132b', padding: '12px 15px', borderRadius: '4px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem', cursor: 'pointer', color: '#ffcc00' }}>
                <input type="checkbox" checked={showRoute2} onChange={(e) => setShowRoute2(e.target.checked)} style={{ accentColor: '#ffcc00' }} />
                <span>[ ] ALTERNATİF VARYANT ROTA</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem', cursor: 'pointer', color: '#00ffcc' }}>
                <input type="checkbox" checked={showBolts} onChange={(e) => setShowBolts(e.target.checked)} style={{ accentColor: '#00ffcc' }} />
                <span>[ ] BOLT İSTASYONLARINI GÖSTER</span>
              </label>
            </div>
          </div>

          {/* TELEMETRİ VERİ KAYDI PANELİ */}
          <div style={{ border: '1px solid #1f3a60', backgroundColor: '#070c1a', padding: '20px', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '0.8rem', color: '#00ffcc', letterSpacing: '1px', borderBottom: '1px solid #1f3a60', paddingBottom: '6px', fontWeight: 'bold' }}>
              &gt; REAL_TIME_DATA_LOG
            </div>

            {result ? (
              <>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#5f85b6' }}>KAYA_FORMASYONU</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff', marginTop: '2px' }}>{result.details?.rockType}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: '#5f85b6' }}>HESAPLANAN_ROTA_BOYU</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#00b3ff', marginTop: '2px' }}>{result.details?.totalLength}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: '#5f85b6' }}>MİNİMUM_İP_BOYU</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#eab308', marginTop: '2px' }}>{result.details?.requiredRope}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: '#5f85b6' }}>ORTALAMA_BOLT_ARALIĞI</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#00ffcc', marginTop: '2px' }}>{result.details?.avgBoltDistance}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: '#5f85b6' }}>GEREKLİ_EKSPRES_SAYISI</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#ff00ff', marginTop: '2px' }}>{result.details?.quickdrawCount} Adet</div>
                  </div>
                </div>
                <div style={{ borderTop: '1px dashed #1f3a60', paddingTop: '8px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#ff3366', fontWeight: 'bold' }}>⚠️ KRİTİK GÜVENLİK ALANI (FALL FACTOR)</div>
                  <div style={{ fontSize: '0.7rem', color: '#cbd5e1', lineHeight: '1.4', marginTop: '3px' }}>{result.details?.safetyZone}</div>
                </div>
                <div style={{ borderTop: '1px dashed #1f3a60', paddingTop: '8px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#00ffcc', fontWeight: 'bold' }}>🧗 KLİP KONFOR İNDEKSİ</div>
                  <div style={{ fontSize: '0.7rem', color: '#cbd5e1', lineHeight: '1.4', marginTop: '3px' }}>{result.details?.clipComfort}</div>
                </div>
                <div style={{ borderTop: '1px solid #1f3a60', paddingTop: '8px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#5f85b6' }}>STRATEJİK REHBER ÖZETİ</div>
                  <div style={{ fontSize: '0.75rem', color: '#a2b7d4', lineHeight: '1.4', marginTop: '4px', fontStyle: 'italic' }}>{result.details?.strategy}</div>
                </div>
              </>
            ) : (
              <div style={{ color: '#27436b', fontSize: '0.75rem', padding: '30px 0', textAlign: 'center' }}>
                [ AWAITING ANALYSIS INJECT ]<br/>
                Sinyal bekleniyor...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alt Kontrol Butonları */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '20px', flexWrap: 'wrap', maxWidth: '1400px', margin: '20px auto 0 auto' }}>
        <button onClick={startCamera} style={{ backgroundColor: '#0b132b', border: '1px solid #00ffcc', color: '#00ffcc', padding: '12px 24px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem', letterSpacing: '1px' }}>
          [ KAMERAYI AÇ ]
        </button>
        <button onClick={() => fileInputRef.current.click()} style={{ backgroundColor: '#0b132b', border: '1px solid #8b5cf6', color: '#a78bfa', padding: '12px 24px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem', letterSpacing: '1px' }}>
          [ GÖRSEL DOSYASI ENJEKTE ET ]
        </button>
        <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
        
        <button onClick={handleAnalyze} disabled={loading} style={{ backgroundColor: '#00ffcc', border: 'none', color: '#060913', padding: '12px 40px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', letterSpacing: '1px', boxShadow: '0 0 15px rgba(0,255,204,0.4)' }}>
          {loading ? 'HESAPLANIYOR...' : '⚡ GEOLOJİK TOPOĞRAFYA TARAMASINI ÇALIŞTIR'}
        </button>
      </div>

      <style jsx global>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        select option { background-color: #070c1a !important; color: #00ffcc !important; }
      `}</style>
    </div>
  );
}
