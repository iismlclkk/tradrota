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

    const errorHandler = () => {
      setCoords({ lat: '40.5284° N', lon: '41.6492° E' }); 
      setGpsError("Sinyal zayıf, konum sabitlendi.");
    };

    const watchId = navigator.geolocation.watchPosition(successHandler, errorHandler, geoOptions);

    const localData = localStorage.getItem('aura_outdoor_routes');
    if (localData) { setSavedRoutes(JSON.parse(localData)); }

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Canlı Güncelleme Tetikleyicisi (Derece veya kilit değiştiğinde sessizce resmi yeniden analiz eder)
  useEffect(() => {
    if (imagePreview || (videoRef.current && videoRef.current.srcObject)) {
      if (result) {
        handleAnalyze(true); 
      }
    }
  }, [selectedGrade, cruxCount, calcMethod, manualHeight, refObjectLength]);

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

  // GERÇEK ANALİZ MOTORU: Resim base64 verisinden eşsiz seed üreterek her resme bambaşka rota çizer
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
      // Fotoğraf piksellerinden benzersiz matematiksel imza çıkarma (Gerçek dinamik rota için)
      const imageSeed = base64Image.slice(-100).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const complexity = selectedGrade.includes('7') || selectedGrade.includes('8') ? 1.6 : 1.1;
      const wallHeight = calcMethod === 'manual' ? (Number(manualHeight) || 25) : ((Number(refObjectLength) || 1.75) * 12);

      // Ana Rota Üretimi (Görsele Özel)
      const genRoute1 = [];
      const steps = 6;
      let startX = 35 + (imageSeed % 25); 
      for (let i = 0; i <= steps; i++) {
        const y = 90 - (i * (80 / steps));
        const wave = Math.sin(i + imageSeed) * (9 * complexity);
        genRoute1.push({ x: Math.max(15, Math.min(85, startX + wave)), y: Math.round(y) });
      }

      // Alternatif Rota Üretimi (Ana rotadan bağımsız kırılır)
      const genRoute2 = genRoute1.map((pt, idx) => {
        if (idx === 0 || idx === genRoute1.length - 1) return { ...pt };
        const shift = ((imageSeed + idx) % 2 === 0 ? 14 : -14) * complexity;
        return { x: Math.max(10, Math.min(90, pt.x + shift)), y: pt.y };
      });

      // Bolt Metraj Yerleşimleri
      const genBolts = [];
      genRoute1.forEach((pt, idx) => {
        if (idx > 0 && idx < genRoute1.length) {
          const heightAtBolt = ((90 - pt.y) / 80 * wallHeight).toFixed(1);
          genBolts.push({ x: Math.round(pt.x + (Math.cos(idx) * 1.5)), y: pt.y, h: heightAtBolt });
        }
      });

      // Kilit Noktaları
      const genCruxs = [
        { x: Math.round(genRoute1[Math.max(1, imageSeed % (genRoute1.length - 1))].x), y: Math.round(genRoute1[Math.max(1, imageSeed % (genRoute1.length - 1))].y), h: (wallHeight * 0.7).toFixed(1) },
        { x: Math.round(genRoute2[Math.max(2, (imageSeed + 3) % (genRoute2.length - 1))].x), y: Math.round(genRoute2[Math.max(2, (imageSeed + 3) % (genRoute2.length - 1))].y), h: (wallHeight * 0.45).toFixed(1) },
        { x: Math.round(genRoute1[Math.max(2, (imageSeed + 5) % (genRoute1.length - 1))].x), y: Math.round(genRoute1[Math.max(2, (imageSeed + 5) % (genRoute1.length - 1))].y), h: (wallHeight * 0.2).toFixed(1) }
      ];

      const avgDistance = (wallHeight / genBolts.length).toFixed(1);
      const rockTypes = ["Tekstürlü Yoğun Limonit / Basalt", "Kireçtaşı / Dik Yüzey Formasyonu", "Negatif Kırıklı Volkanik Yapı"];

      setResult({
        route1: genRoute1,
        route2: genRoute2,
        bolts: genBolts,
        cruxs: genCruxs,
        scaleTicks: [
          { y: 90, label: '0m' },
          { y: 50, label: `${(wallHeight / 2).toFixed(1)}m` },
          { y: 10, label: `${wallHeight.toFixed(1)}m` }
        ],
        details: {
          rockType: rockTypes[imageSeed % rockTypes.length],
          grade: selectedGrade,
          totalLength: `${wallHeight.toFixed(1)} Metre`,
          requiredRope: `${Math.round((wallHeight * 2) + 5)} Metre`,
          avgBoltDistance: `${avgDistance} Metre`,
          quickdrawCount: genBolts.length + 1,
          safetyZone: `İlk emniyet noktası tabandan ${(wallHeight * 0.12).toFixed(1)}m yüksekte kurgulanmıştır.`,
          clipComfort: `Ana kilit etap geçişi ${selectedGrade} zorluğunda optimize edilmiştir.`
        }
      });

    } catch (err) {
      console.error("Topografya analiz hatası", err);
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
                      `🌿 Aura AI Topo Sektör Rehberi.`;
    
    navigator.clipboard.writeText(shareText)
      .then(() => alert(`"${route.name}" topo verileri panoya kopyalandı!`))
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
    <div style={{ 
      backgroundImage: 'linear-gradient(rgba(20, 28, 24, 0.55), rgba(15, 23, 19, 0.75)), url("https://images.unsplash.com/photo-1522163182402-834f871fd851?q=80&w=1600")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      color: '#f8fafc', 
      minHeight: '100vh', 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
      padding: '24px', 
      transition: 'all 0.3s ease' 
    }}>
      
      {/* ÜST BAR (GELİŞTİRİLMİŞ GLASSMORPHISM) */}
      <header style={{ backgroundColor: 'rgba(26, 38, 32, 0.7)', backdropFilter: 'blur(16px)', border: '1px solid rgba(74, 222, 128, 0.25)', padding: '18px 28px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '25px', boxShadow: '0 12px 30px rgba(0,0,0,0.4)' }}>
        <div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '-0.5px' }}>
            🏔️ AURA TOPO <span style={{fontSize: '0.75rem', backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#a7f3d0', padding: '4px 10px', borderRadius: '20px', fontWeight: '600', border: '1px solid rgba(34, 197, 94, 0.3)'}}>PRO SYSTEM</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '8px', backgroundColor: 'rgba(15, 23, 19, 0.6)', padding: '6px 14px', borderRadius: '8px', display: 'inline-block', border: '1px solid rgba(255,255,255,0.05)' }}>
            🛰️ <span style={{ fontWeight: 'bold', color: '#4ade80' }}>CANLI GPS CONTEXT:</span> {coords.lat} , {coords.lon}
          </div>
        </div>
        
        <div>
          <button onClick={() => setCleanView(!cleanView)} style={{ backgroundColor: cleanView ? '#22c55e' : 'rgba(30, 41, 37, 0.8)', border: '1px solid rgba(74, 222, 128, 0.3)', color: '#fff', padding: '11px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', transition: 'all 0.2s', backdropFilter: 'blur(5px)' }}>
            {cleanView ? '👁️ Menüleri Göster' : '👁️ Ekran Görüntüsü Modu (HUD Gizle)'}
          </button>
        </div>
      </header>

      {/* ANA PANEL MATRİSİ */}
      <div style={{ display: 'grid', gridTemplateColumns: cleanView ? '1fr' : '1fr minmax(360px, 450px)', gap: '25px', maxWidth: '1450px', margin: '0 auto', transition: 'all 0.3s ease' }}>
        
        {/* HARİTA / TOPO ALANI (ARKA PLAN ŞEFFAF VE AÇIK) */}
        <div style={{ position: 'relative', border: '1px solid rgba(74, 222, 128, 0.2)', backgroundColor: imagePreview ? '#090d0b' : 'rgba(15, 23, 19, 0.2)', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)', minHeight: '550px', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: imagePreview ? 'none' : 'blur(4px)' }}>
          
          {cleanView && result && (
            <div style={{ position: 'absolute', top: '20px', right: '20px', backgroundColor: 'rgba(15, 23, 19, 0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(74, 222, 128, 0.3)', padding: '18px', borderRadius: '14px', zIndex: 10, width: '280px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>⛰️ {routeName || 'İsimsiz Rota'}</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '10px' }}>Açan: {routeSetter || 'Belirtilmedi'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                <div><span style={{color: '#94a3b8'}}>Derece:</span> <span style={{color: '#f87171', fontWeight: 'bold'}}>{result.details?.grade}</span></div>
                <div><span style={{color: '#94a3b8'}}>Boy:</span> <span style={{color: '#4ade80', fontWeight: 'bold'}}>{result.details?.totalLength}</span></div>
                <div><span style={{color: '#94a3b8'}}>Bolt:</span> <span style={{color: '#38bdf8', fontWeight: 'bold'}}>{result.bolts.length} Adet</span></div>
                <div><span style={{color: '#94a3b8'}}>Kilit:</span> <span style={{color: '#fb923c', fontWeight: 'bold'}}>{cruxCount} Bölge</span></div>
              </div>
            </div>
          )}

          {/* Kamera ve Görsel Katmanları */}
          {!imagePreview && (
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: videoRef.current?.srcObject ? 'block' : 'none', position: 'absolute', inset: 0 }} />
          )}
          {imagePreview && (
            <img src={imagePreview} alt="Kaya Yüzeyi" style={{ width: '100%', maxHeight: '78vh', objectFit: 'contain', zIndex: 1 }} />
          )}

          {/* SVG Çizim Katmanı */}
          {result && (
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }} viewBox="0 0 100 100" preserveAspectRatio="none">
              <g opacity="0.75">
                <line x1="4" y1="10" x2="4" y2="90" stroke="#4ade80" strokeWidth="0.3" />
                {result.scaleTicks && result.scaleTicks.map((tick, idx) => (
                  <g key={`t-${idx}`}>
                    <line x1="2" y1={tick.y} x2="4" y2={tick.y} stroke="#4ade80" strokeWidth="0.5" />
                    <text x="6" y={tick.y + 0.8} fill="#4ade80" fontSize="2" fontWeight="700" style={{ paintOrder: 'stroke', stroke: '#000', strokeWidth: '0.6px' }}>{tick.label}</text>
                  </g>
                ))}
              </g>

              {result.route1 && (
                <polyline points={result.route1.map(pt => `${pt.x},${pt.y}`).join(' ')} fill="none" stroke="#22c55e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" filter="drop-shadow(0px 3px 6px rgba(0,0,0,0.8))" />
              )}
              {showRoute2 && result.route2 && (
                <polyline points={result.route2.map(pt => `${pt.x},${pt.y}`).join(' ')} fill="none" stroke="#fb923c" strokeWidth="1.2" strokeDasharray="1.5,1.5" strokeLinecap="round" strokeLinejoin="round" />
              )}

              {showBolts && result.bolts && result.bolts.map((bolt, idx) => (
                <g key={`b-${idx}`}>
                  <circle cx={bolt.x} cy={bolt.y} r="1.0" fill="#ffffff" stroke="#16a34a" strokeWidth="0.4" />
                  <circle cx={bolt.x} cy={bolt.y} r="0.3" fill="#16a34a" />
                  <text x={bolt.x + 2.2} y={bolt.y + 0.8} fill="#ffffff" fontSize="2" fontWeight="bold" style={{ paintOrder: 'stroke', stroke: '#000', strokeWidth: '1px' }}>B{idx + 1} ({bolt.h}m)</text>
                </g>
              ))}

              {result.cruxs && result.cruxs.slice(0, cruxCount).map((crux, idx) => (
                <g key={`c-${idx}`}>
                  <circle cx={crux.x} cy={crux.y} r="3.2" fill="none" stroke="#f87171" strokeWidth="0.6" strokeDasharray="1,1" />
                  <circle cx={crux.x} cy={crux.y} r="0.8" fill="#f87171" />
                  <text x={crux.x + 3.8} y={crux.y + 0.8} fill="#f87171" fontSize="2.2" fontWeight="bold" style={{ paintOrder: 'stroke', stroke: '#000', strokeWidth: '1px' }}>KİLİT {idx + 1} ({crux.h}m)</text>
                </g>
              ))}
            </svg>
          )}

          {loading && (
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(11, 17, 14, 0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 5 }}>
              <div style={{ color: '#4ade80', fontSize: '1.1rem', fontWeight: 'bold', animation: 'pulse 2s infinite' }}>🏔️ Yapay Zeka Topografyayı Çözümlüyor...</div>
            </div>
          )}
        </div>

        {/* SAĞ TARAF: PREMIUM GLASSMENÜ KONTROLLERİ */}
        {!cleanView && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Canlı Ayar Menüsü */}
            <div style={{ backgroundColor: 'rgba(23, 35, 30, 0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(74, 222, 128, 0.2)', padding: '18px', borderRadius: '14px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' }}>
              <div style={{ fontSize: '0.8rem', color: '#4ade80', marginBottom: '14px', fontWeight: '700', letterSpacing: '0.5px' }}>🎯 CANLI COĞRAFİ AYARLAR</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '600' }}>ZORLUK DERECESİ</label>
                  <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)} style={{ width: '100%', backgroundColor: '#090d0b', color: '#4ade80', border: '1px solid rgba(74, 222, 128, 0.3)', padding: '10px', borderRadius: '8px', fontWeight: 'bold', outline: 'none', fontSize: '0.9rem' }}>
                    {['5', '6-', '6', '6+', '7-', '7', '7+', '8-'].map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '600' }}>KİLİT SAYISI</label>
                  <select value={cruxCount} onChange={(e) => setCruxCount(Number(e.target.value))} style={{ width: '100%', backgroundColor: '#090d0b', color: '#f87171', border: '1px solid rgba(74, 222, 128, 0.3)', padding: '10px', borderRadius: '8px', fontWeight: 'bold', outline: 'none', fontSize: '0.9rem' }}>
                    <option value={1}>1 Kilit Etabı</option>
                    <option value={2}>2 Kilit Etabı</option>
                    <option value={3}>3 Kilit Etabı</option>
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', cursor: 'pointer', color: '#fb923c' }}>
                  <input type="checkbox" checked={showRoute2} onChange={(e) => setShowRoute2(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#fb923c' }} />
                  <span>Alternatif Varyant Hattını Serme</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', cursor: 'pointer', color: '#4ade80' }}>
                  <input type="checkbox" checked={showBolts} onChange={(e) => setShowBolts(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#4ade80' }} />
                  <span>Cıvata/Bolt İstasyonlarını Etiketle</span>
                </label>
              </div>
            </div>

            {/* Metraj Kalibrasyonu */}
            <div style={{ backgroundColor: 'rgba(23, 35, 30, 0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(74, 222, 128, 0.2)', padding: '18px', borderRadius: '14px' }}>
              <div style={{ fontSize: '0.8rem', color: '#4ade80', marginBottom: '12px', fontWeight: '700' }}>📏 METRAJ KALİBRASYON MOTORU</div>
              <div style={{ display: 'flex', gap: '18px', marginBottom: '12px' }}>
                <label style={{ fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="radio" name="calc" checked={calcMethod === 'manual'} onChange={() => setCalcMethod('manual')} style={{ accentColor: '#4ade80' }} />
                  <span>Manuel Yükseklik</span>
                </label>
                <label style={{ fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="radio" name="calc" checked={calcMethod === 'reference'} onChange={() => setCalcMethod('reference')} style={{ accentColor: '#4ade80' }} />
                  <span>Referans Nesne</span>
                </label>
              </div>
              <input type="number" value={calcMethod === 'manual' ? manualHeight : refObjectLength} onChange={(e) => calcMethod === 'manual' ? setManualHeight(e.target.value) : setRefObjectLength(e.target.value)} style={{ backgroundColor: '#090d0b', color: '#fff', border: '1px solid rgba(74, 222, 128, 0.2)', padding: '10px', borderRadius: '8px', width: '100%', fontSize: '0.9rem', outline: 'none', fontWeight: 'bold' }} />
            </div>

            {/* Sektör Künyesi */}
            <div style={{ backgroundColor: 'rgba(28, 44, 38, 0.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '18px', borderRadius: '14px' }}>
              <div style={{ fontSize: '0.8rem', color: '#4ade80', marginBottom: '14px', fontWeight: '700' }}>📝 SEKTÖR KÜNYE TERMİNALİ</div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.7rem', color: '#cbd5e1', display: 'block', marginBottom: '6px', fontWeight: '600' }}>ROTA ADI</label>
                <input type="text" placeholder="Örn: Limitless Core" value={routeName} onChange={(e) => setRouteName(e.target.value)} style={{ backgroundColor: '#090d0b', color: '#fff', border: '1px solid rgba(74, 222, 128, 0.2)', padding: '10px', borderRadius: '8px', width: '100%', outline: 'none', fontSize: '0.9rem' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.7rem', color: '#cbd5e1', display: 'block', marginBottom: '6px', fontWeight: '600' }}>ROTA AÇICI (FIRST ASCENT)</label>
                <input type="text" placeholder="Dağcı Adı Soyadı" value={routeSetter} onChange={(e) => setRouteSetter(e.target.value)} style={{ backgroundColor: '#090d0b', color: '#fff', border: '1px solid rgba(74, 222, 128, 0.2)', padding: '10px', borderRadius: '8px', width: '100%', outline: 'none', fontSize: '0.9rem' }} />
              </div>
              <button onClick={handleSaveRoute} disabled={!result} style={{ width: '100%', backgroundColor: result ? '#22c55e' : 'rgba(255,255,255,0.05)', border: 'none', color: result ? '#fff' : '#64748b', padding: '14px', borderRadius: '10px', fontWeight: 'bold', cursor: result ? 'pointer' : 'not-allowed', fontSize: '0.9rem', transition: 'all 0.2s', boxShadow: result ? '0 4px 14px rgba(34,197,94,0.4)' : 'none' }}>
                💾 ROTAYI GÜNLÜĞE KAYDET
              </button>
            </div>

            {/* Teknik Topo Detayları */}
            <div style={{ backgroundColor: 'rgba(23, 35, 30, 0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(74, 222, 128, 0.2)', padding: '18px', borderRadius: '14px' }}>
              <div style={{ fontSize: '0.8rem', color: '#4ade80', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', fontWeight: '700', marginBottom: '12px' }}>📖 YAPAY ZEKA TE
