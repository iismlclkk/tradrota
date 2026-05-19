import { useState, useRef, useEffect } from 'react';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState('6-');
  const [imagePreview, setImagePreview] = useState(null);
  
  // Kalibrasyon Kontrolleri
  const [calcMethod, setCalcMethod] = useState('manual'); 
  const [manualHeight, setManualHeight] = useState(25); 
  const [refObjectLength, setRefObjectLength] = useState(1.75); 
  
  const [showRoute2, setShowRoute2] = useState(false);
  const [showBolts, setShowBolts] = useState(true);
  const [cruxCount, setCruxCount] = useState(1);
  
  // Rota Künye Bilgileri
  const [routeName, setRouteName] = useState('');
  const [routeSetter, setRouteSetter] = useState('');
  const [savedRoutes, setSavedRoutes] = useState([]);

  // TEMİZ GÖRÜNÜM (HUD GİZLE) STATE
  const [cleanView, setCleanView] = useState(false);

  // GERÇEK ZAMANLI GPS STATE
  const [coords, setCoords] = useState({ lat: 'Aranıyor...', lon: 'Aranıyor...' });
  const [gpsError, setGpsError] = useState(null);
  
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  // CANLI GPS BAĞLANTISI
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError("GPS desteklenmiyor.");
      return;
    }

    const geoOptions = { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 };
    const successHandler = (position) => {
      setCoords({
        lat: position.coords.latitude.toFixed(5) + '° N',
        lon: position.coords.longitude.toFixed(5) + '° E'
      });
      setGpsError(null);
    };

    const errorHandler = (err) => {
      setCoords({ lat: '40.5284° N', lon: '41.6492° E' }); // Varsayılan Uzundere
      setGpsError("Sinyal zayıf, konum sabitlendi.");
    };

    const watchId = navigator.geolocation.watchPosition(successHandler, errorHandler, geoOptions);

    const localData = localStorage.getItem('aura_outdoor_routes');
    if (localData) { setSavedRoutes(JSON.parse(localData)); }

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Derece veya Kilit Sayısı Değiştiğinde Sayfayı Sıfırlamadan Analizi Canlı Güncelleme
  useEffect(() => {
    if (imagePreview || (videoRef.current && videoRef.current.srcObject)) {
      // Eğer halihazırda bir analiz sonucu varsa, sessizce arkada güncelle
      if (result) {
        handleAnalyze(true); 
      }
    }
  }, [selectedGrade, cruxCount, calcMethod]);

  const startCamera = async () => {
    try {
      setImagePreview(null);
      setResult(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) { videoRef.current.srcObject = stream; }
    } catch (err) {
      alert("Kamera bağlantısı başarısız.");
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

  // isSilent: Derece değişimlerinde kullanıcıyı yormadan arka planda güncellemek için kullanılacak
  const handleAnalyze = async (isSilent = false) => {
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
      if (!isSilent) alert("Kaya görseli algılanamadı. Lütfen bir fotoğraf yükleyin.");
      return;
    }

    if (!isSilent) setLoading(true);
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
      console.error("Güncelleme hatası", err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const handleSaveRoute = () => {
    if (!result) return;
    if (!routeName.trim() || !routeSetter.trim()) {
      alert("Lütfen Rota Adı ve Rota Açıcı bilgilerini girin.");
      return;
    }

    const newRouteRecord = {
      id: Date.now(),
      name: routeName,
      setter: routeSetter,
      grade: result.details.grade,
      length: result.details.totalLength,
      bolts: result.bolts.length,
      cruxs: cruxCount,
      coords: `${coords.lat} - ${coords.lon}`,
      date: new Date().toLocaleDateString('tr-TR')
    };

    const updatedList = [newRouteRecord, ...savedRoutes];
    setSavedRoutes(updatedList);
    localStorage.setItem('aura_outdoor_routes', JSON.stringify(updatedList));
    
    setRouteName('');
    setRouteSetter('');
    alert(`"${newRouteRecord.name}" sektöre başarıyla işlendi!`);
  };

  const handleShareRoute = (route) => {
    const shareText = `🧗 CLIMBING TOPO REPORT: ${route.name.toUpperCase()}\n` +
                      `📍 Konum: ${route.coords}\n` +
                      `🛠️ Rota Açıcı: ${route.setter}\n` +
                      `📊 Zorluk Derecesi: ${route.grade}\n` +
                      `📏 Rota Boyu: ${route.length}\n` +
                      `⛓️ Emniyet: ${route.bolts} Bolt İstasyonu\n` +
                      `⚠️ Kilit Sayısı: ${route.cruxs} Bölge\n` +
                      `📅 Kayıt: ${route.date}\n` +
                      `🌿 Aura AI Topo Sektör Rehberi.`;
    
    navigator.clipboard.writeText(shareText)
      .then(() => alert(`"${route.name}" topo verileri panoya kopyalandı! WhatsApp gruplarına doğrudan yapıştırabilirsin.`))
      .catch(() => alert("Kopyalanamadı."));
  };

  const handleDeleteRoute = (id) => {
    if(confirm("Bu rotayı silmek istediğinize emin misiniz?")) {
      const updatedList = savedRoutes.filter(item => item.id !== id);
      setSavedRoutes(updatedList);
      localStorage.setItem('aura_outdoor_routes', JSON.stringify(updatedList));
    }
  };

  return (
    <div style={{ backgroundColor: '#0f1311', color: '#f1f5f9', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', padding: '20px', transition: 'all 0.3s ease' }}>
      
      {/* 1. ÜST BAR - PREMIUM DOĞA KONSEPTİ (TEMİZ GÖRÜNÜMDE DE KALIR) */}
      <header style={{ backgroundColor: '#161d1a', border: '1px solid #232e29', padding: '16px 24px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)' }}>
        <div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '-0.5px' }}>
            🏔️ AURA TOPO <span style={{fontSize: '0.75rem', backgroundColor: '#1e2925', color: '#a7f3d0', padding: '3px 8px', borderRadius: '20px', fontWeight: '500'}}>PRO</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#a7f3d0', marginTop: '6px', backgroundColor: '#1b2621', padding: '6px 12px', borderRadius: '8px', display: 'inline-block', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)' }}>
            🛰️ <span style={{ fontWeight: 'bold', color: '#4ade80' }}>CANLI GPS CONTEXT:</span> {coords.lat} , {coords.lon}
          </div>
        </div>
        
        {/* EKRAN GÖRÜNTÜSÜ ALMAK İÇİN HUD GİZLEME BUTONU (GÖZ İKONU) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => setCleanView(!cleanView)} style={{ backgroundColor: cleanView ? '#22c55e' : '#1e2924', border: '1px solid #2d3f37', color: '#fff', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            {cleanView ? '👁️ Menüleri Göster' : '👁️ Ekran Görüntüsü Modu (HUD Gizle)'}
          </button>
        </div>
      </header>

      {/* ANA PANEL MATRİSİ */}
      <div style={{ display: 'grid', gridTemplateColumns: cleanView ? '1fr' : '1fr minmax(340px, 440px)', gap: '25px', maxWidth: '1400px', margin: '0 auto', transition: 'all 0.3s ease' }}>
        
        {/* SOL TARAF: ANA TOPO VİZÖRÜ (HER İKİ MODDA DA BAŞROLDE) */}
        <div style={{ position: 'relative', border: '1px solid #232e29', backgroundColor: '#121715', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}>
          
          {/* Ekran Görüntüsü Modunda Rota Künyesini Resmin Üzerine Şık Bir Kart Olarak Bindiriyoruz */}
          {cleanView && result && (
            <div style={{ position: 'absolute', top: '15px', right: '15px', backgroundColor: 'rgba(22, 29, 26, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid #232e29', padding: '15px', borderRadius: '12px', zIndex: 10, width: '260px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' }}>
              <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>⛰️ {routeName || 'İsimsiz Rota'}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '8px' }}>Açan: {routeSetter || 'Belirtilmedi'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.7rem', borderTop: '1px solid #232e29', paddingTop: '8px' }}>
                <div><span style={{color: '#94a3b8'}}>Derece:</span> <span style={{color: '#ef4444', fontWeight: 'bold'}}>{result.details?.grade}</span></div>
                <div><span style={{color: '#94a3b8'}}>Boy:</span> <span style={{color: '#22c55e', fontWeight: 'bold'}}>{result.details?.totalLength}</span></div>
                <div><span style={{color: '#94a3b8'}}>Bolt:</span> <span style={{color: '#38bdf8', fontWeight: 'bold'}}>{result.bolts.length} Adet</span></div>
                <div><span style={{color: '#94a3b8'}}>Kilit:</span> <span style={{color: '#f97316', fontWeight: 'bold'}}>{cruxCount} Bölge</span></div>
              </div>
              <div style={{fontSize: '0.65rem', color: '#4ade80', marginTop: '8px', textAlign: 'right'}}>{coords.lat}</div>
            </div>
          )}

          <div style={{ aspectRatio: '4/3', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {!imagePreview && !videoRef.current?.srcObject && (
              <div style={{ color: '#4b5563', fontSize: '0.9rem', textAlign: 'center', padding: '40px', fontWeight: '500' }}>
                🌿 Sektör planlaması için aşağıdan bir görsel enjekte edin veya kamerayı açın.
              </div>
            )}
            {!imagePreview && (
              <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: videoRef.current?.srcObject ? 'block' : 'none' }} />
            )}
            {imagePreview && (
              <img src={imagePreview} alt="Kaya Yüzeyi" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            )}
          </div>

          {result && (
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Rehber Kitap Metre Cetveli */}
              <g opacity="0.6">
                <line x1="4" y1="10" x2="4" y2="90" stroke="#a7f3d0" strokeWidth="0.25" />
                {result.scaleTicks && result.scaleTicks.map((tick, idx) => (
                  <g key={`t-${idx}`}>
                    <line x1="2" y1={tick.y} x2="4" y2={tick.y} stroke="#a7f3d0" strokeWidth="0.4" />
                    <text x="6" y={tick.y + 0.8} fill="#a7f3d0" fontSize="1.8" fontWeight="600">{tick.label}</text>
                  </g>
                ))}
              </g>

              {/* Rota Çizgileri */}
              {result.route1 && (
                <polyline points={result.route1.map(pt => `${pt.x},${pt.y}`).join(' ')} fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" filter="drop-shadow(0px 2px 5px rgba(0,0,0,0.6))" />
              )}
              {showRoute2 && result.route2 && (
                <polyline points={result.route2.map(pt => `${pt.x},${pt.y}`).join(' ')} fill="none" stroke="#f97316" strokeWidth="1.1" strokeDasharray="1.5,1.5" strokeLinecap="round" strokeLinejoin="round" />
              )}

              {/* Bolt Noktaları */}
              {showBolts && result.bolts && result.bolts.map((bolt, idx) => (
                <g key={`b-${idx}`}>
                  <circle cx={bolt.x} cy={bolt.y} r="0.9" fill="#ffffff" stroke="#16a34a" strokeWidth="0.35" />
                  <circle cx={bolt.x} cy={bolt.y} r="0.25" fill="#16a34a" />
                  <text x={bolt.x + 2} y={bolt.y + 0.8} fill="#ffffff" fontSize="1.8" fontWeight="bold" style={{ paintOrder: 'stroke', stroke: '#0f1311', strokeWidth: '0.8px' }}>B{idx + 1} ({bolt.h}m)</text>
                </g>
              ))}

              {/* Kilit Alanları */}
              {result.cruxs && result.cruxs.slice(0, cruxCount).map((crux, idx) => (
                <g key={`c-${idx}`}>
                  <circle cx={crux.x} cy={crux.y} r="3" fill="none" stroke="#ef4444" strokeWidth="0.5" strokeDasharray="1,1" />
                  <circle cx={crux.x} cy={crux.y} r="0.7" fill="#ef4444" />
                  <text x={crux.x + 3.5} y={crux.y + 0.8} fill="#ef4444" fontSize="2" fontWeight="bold" style={{ paintOrder: 'stroke', stroke: '#0f1311', strokeWidth: '0.8px' }}>KİLİT {idx + 1} ({crux.h}m)</text>
                </g>
              ))}
            </svg>
          )}

          {loading && (
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(15,19,17,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ color: '#22c55e', fontSize: '1rem', fontWeight: 'bold', animation: 'pulse 1.5s infinite' }}>🏔️ Topoğrafik Matris Çiziliyor...</div>
            </div>
          )}
        </div>

        {/* SAĞ TARAF: AYARLAR VE YAPILANDIRMA (TEMİZ GÖRÜNÜMDE TAMAMEN GİZLENİR) */}
        {!cleanView && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.2s ease-in-out' }}>
            
            {/* Dinamik Derece ve Kontrol Seçenekleri (Silinmeyi Önleyen Alan) */}
            <div style={{ backgroundColor: '#161d1a', border: '1px solid #232e29', padding: '16px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '12px', fontWeight: 'bold', letterSpacing: '0.5px' }}>🎯 CANLI AYAR DEĞİŞTİRİCİ</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>ZORLUK DERECESİ</label>
                  <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)} style={{ width: '100%', backgroundColor: '#0f1311', color: '#22c55e', border: '1px solid #232e29', padding: '8px', borderRadius: '6px', fontWeight: 'bold', outline: 'none' }}>
                    {['5', '6-', '6', '6+', '7-', '7', '7+', '8-'].map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.7 gram', color: '#64748b', display: 'block', marginBottom: '4px' }}>KİLİT ETAP SAYISI</label>
                  <select value={cruxCount} onChange={(e) => setCruxCount(Number(e.target.value))} style={{ width: '100%', backgroundColor: '#0f1311', color: '#ef4444', border: '1px solid #232e29', padding: '8px', borderRadius: '6px', fontWeight: 'bold', outline: 'none' }}>
                    <option value={1}>1 Kilit Noktası</option>
                    <option value={2}>2 Kilit Noktası</option>
                    <option value={3}>3 Kilit Noktası</option>
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #232e29', paddingTop: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer', color: '#f97316' }}>
                  <input type="checkbox" checked={showRoute2} onChange={(e) => setShowRoute2(e.target.checked)} style={{ accentColor: '#f97316' }} />
                  <span>Alternatif Varyant Hattını Göster</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer', color: '#22c55e' }}>
                  <input type="checkbox" checked={showBolts} onChange={(e) => setShowBolts(e.target.checked)} style={{ accentColor: '#22c55e' }} />
                  <span>Bolt İstasyonlarını Etiketle</span>
                </label>
              </div>
            </div>

            {/* Kalibrasyon */}
            <div style={{ backgroundColor: '#161d1a', border: '1px solid #232e29', padding: '16px', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '10px', fontWeight: 'bold' }}>📏 SAHA METRAJ KALİBRASYONU</div>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '12px' }}>
                <label style={{ fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input type="radio" name="calc" checked={calcMethod === 'manual'} onChange={() => setCalcMethod('manual')} style={{ accentColor: '#22c55e' }} />
                  <span>Manuel Yükseklik</span>
                </label>
                <label style={{ fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input type="radio" name="calc" checked={calcMethod === 'reference'} onChange={() => setCalcMethod('reference')} style={{ accentColor: '#22c55e' }} />
                  <span>Referans Nesne</span>
                </label>
              </div>
              <input type="number" value={calcMethod === 'manual' ? manualHeight : refObjectLength} onChange={(e) => calcMethod === 'manual' ? setManualHeight(e.target.value) : setRefObjectLength(e.target.value)} style={{ backgroundColor: '#0f1311', color: '#fff', border: '1px solid #232e29', padding: '8px', borderRadius: '6px', width: '100%', fontSize: '0.85rem', outline: 'none', fontWeight: 'bold' }} />
            </div>

            {/* Rota Künyesi Giriş Alanı */}
            <div style={{ backgroundColor: '#1b2420', border: '1px solid #283830', padding: '16px', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.8rem', color: '#4ade80', marginBottom: '12px', fontWeight: 'bold' }}>📝 SEKTÖR KÜNYE TERMİNALİ</div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>ROTA ADI</label>
                <input type="text" placeholder="Örn: Limitless" value={routeName} onChange={(e) => setRouteName(e.target.value)} style={{ backgroundColor: '#0f1311', color: '#fff', border: '1px solid #232e29', padding: '8px', borderRadius: '6px', width: '100%', outline: 'none', fontSize: '0.85rem' }} />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>ROTA AÇICI (FA)</label>
                <input type="text" placeholder="Adı Soyadı" value={routeSetter} onChange={(e) => setRouteSetter(e.target.value)} style={{ backgroundColor: '#0f1311', color: '#fff', border: '1px solid #232e29', padding: '8px', borderRadius: '6px', width: '100%', outline: 'none', fontSize: '0.85rem' }} />
              </div>
              <button onClick={handleSaveRoute} disabled={!result} style={{ width: '100%', backgroundColor: result ? '#22c55e' : '#2d3732', border: 'none', color: '#fff', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: result ? 'pointer' : 'not-allowed', fontSize: '0.8rem', transition: 'all 0.2s' }}>
                💾 ROTAYI GÜNLÜĞE KAYDET
              </button>
            </div>

            {/* Teknik Rapor Çıktısı */}
            <div style={{ backgroundColor: '#161d1a', border: '1px solid #232e29', padding: '16px', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.8rem', color: '#4ade80', borderBottom: '1px solid #232e29', paddingBottom: '6px', fontWeight: 'bold', marginBottom: '10px' }}>📖 TEKNİK TOPO DETAYLARI</div>
              {result ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
                  <div><span style={{ color: '#94a3b8' }}>Formasyon:</span> <span style={{ color: '#fff', fontWeight: 'bold' }}>{result.details?.rockType}</span></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                    <div><span style={{ color: '#94a3b8' }}>Boy:</span> <span style={{ color: '#22c55e', fontWeight: 'bold' }}>{result.details?.totalLength}</span></div>
                    <div><span style={{ color: '#94a3b8' }}>İp:</span> <span style={{ color: '#f97316', fontWeight: 'bold' }}>{result.details?.requiredRope}</span></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                    <div><span style={{ color: '#94a3b8' }}>Bolt Aralığı:</span> <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{result.details?.avgBoltDistance}</span></div>
                    <div><span style={{ color: '#94a3b8' }}>Ekspres:</span> <span style={{ color: '#a855f7', fontWeight: 'bold' }}>{result.details?.quickdrawCount} Adet</span></div>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#4b5563', fontSize: '0.75rem', textAlign: 'center', padding: '10px 0' }}>Tarama bekleniyor...</div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* ALT TETİKLEYİCİ BUTONLAR (TEMİZ GÖRÜNÜMDE GİZLENİR) */}
      {!cleanView && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '25px', flexWrap: 'wrap', maxWidth: '1400px', margin: '25px auto' }}>
          <button onClick={startCamera} style={{ backgroundColor: '#161d1a', border: '1px solid #232e29', color: '#cbd5e1', padding: '12px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.8rem' }}>📷 Kamerayı Aç</button>
          <button onClick={() => fileInputRef.current.click()} style={{ backgroundColor: '#161d1a', border: '1px solid #232e29', color: '#a78bfa', padding: '12px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.8rem' }}>📁 Fotoğraf Yükle</button>
          <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
          <button onClick={() => handleAnalyze(false)} disabled={loading} style={{ backgroundColor: '#22c55e', border: 'none', color: '#fff', padding: '12px 36px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 4px 14px rgba(34,197,94,0.3)' }}>
            {loading ? 'Analiz Ediliyor...' : '🌲 GEOLOJİK TOPOGRAFYA TARAMASI'}
          </button>
        </div>
      )}

      {/* SEKTÖR DEFTERİ TABLOSU (TEMİZ GÖRÜNÜMDE GİZLENİR) */}
      {!cleanView && (
        <div style={{ maxWidth: '1400px', margin: '40px auto 0 auto', backgroundColor: '#161d1a', border: '1px solid #232e29', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '0.95rem', color: '#22c55e', fontWeight: 'bold', marginBottom: '15px', borderBottom: '1px solid #232e29', paddingBottom: '10px' }}>
            🗄️ Dijital Sektör Defteri ({savedRoutes.length} Rota Kayıtlı)
          </div>
          {savedRoutes.length === 0 ? (
            <div style={{ color: '#4b5563', fontSize: '0.8rem', textAlign: 'center', padding: '20px 0' }}>Sektör günlüğü henüz boş.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #232e29', color: '#94a3b8' }}>
                    <th style={{ padding: '10px' }}>Tarih</th>
                    <th style={{ padding: '10px' }}>Rota Adı</th>
                    <th style={{ padding: '10px' }}>Açan Dağcı</th>
                    <th style={{ padding: '10px' }}>Derece</th>
                    <th style={{ padding: '10px' }}>Boy</th>
                    <th style={{ padding: '10px' }}>Donanım</th>
                    <th style={{ padding: '10px' }}>GPS Koordinatı</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Aksiyon</th>
                  </tr>
                </thead>
                <tbody>
                  {savedRoutes.map((route) => (
                    <tr key={route.id} style={{ borderBottom: '1px solid #1c2622', color: '#cbd5e1' }}>
                      <td style={{ padding: '10px', color: '#64748b' }}>{route.date}</td>
                      <td style={{ padding: '10px', fontWeight: 'bold', color: '#fff' }}>🧗 {route.name}</td>
                      <td style={{ padding: '10px' }}>{route.setter}</td>
                      <td style={{ padding: '10px', color: '#ef4444', fontWeight: 'bold' }}>{route.grade}</td>
                      <td style={{ padding: '10px', color: '#38bdf8' }}>{route.length}</td>
                      <td style={{ padding: '10px' }}>{route.bolts} Bolt / {route.cruxs} Kilit</td>
                      <td style={{ padding: '10px', color: '#a7f3d0', fontSize: '0.75rem' }}>{route.coords}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button onClick={() => handleShareRoute(route)} style={{ backgroundColor: '#22c55e', border: 'none', color: '#fff', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: '600' }}>🔗 Topo Kartı Paylaş</button>
                          <button onClick={() => handleDeleteRoute(route.id)} style={{ backgroundColor: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.7rem' }}>Sil</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        select option { background-color: #161d1a !important; color: #fff !important; }
      `}</style>
    </div>
  );
}
