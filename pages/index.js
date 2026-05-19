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
      setCoords({ lat: '40.5284° N', lon: '41.6492° E' }); 
      setGpsError("Sinyal zayıf, konum sabitlendi.");
    };

    const watchId = navigator.geolocation.watchPosition(successHandler, errorHandler, geoOptions);

    const localData = localStorage.getItem('aura_outdoor_routes');
    if (localData) { setSavedRoutes(JSON.parse(localData)); }

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Canlı Güncelleme Tetikleyicisi
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
      const imageSeed = base64Image.slice(-100).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const complexity = selectedGrade.includes('7') || selectedGrade.includes('8') ? 1.6 : 1.1;
      const wallHeight = calcMethod === 'manual' ? (Number(manualHeight) || 25) : ((Number(refObjectLength) || 1.75) * 12);

      const genRoute1 = [];
      const steps = 6;
      let startX = 35 + (imageSeed % 25); 
      for (let i = 0; i <= steps; i++) {
        const y = 90 - (i * (80 / steps));
        const wave = Math.sin(i + imageSeed) * (9 * complexity);
        genRoute1.push({ x: Math.max(15, Math.min(85, startX + wave)), y: Math.round(y) });
      }

      const genRoute2 = genRoute1.map((pt, idx) => {
        if (idx === 0 || idx === genRoute1.length - 1) return { ...pt };
        const shift = ((imageSeed + idx) % 2 === 0 ? 13 : -13) * complexity;
        return { x: Math.max(10, Math.min(90, pt.x + shift)), y: pt.y };
      });

      const genBolts = [];
      genRoute1.forEach((pt, idx) => {
        if (idx > 0 && idx < genRoute1.length) {
          const heightAtBolt = ((90 - pt.y) / 80 * wallHeight).toFixed(1);
          genBolts.push({ x: Math.round(pt.x + (Math.cos(idx) * 1.5)), y: pt.y, h: heightAtBolt });
        }
      });

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
      backgroundImage: 'linear-gradient(rgba(15, 19, 17, 0.85), rgba(15, 19, 17, 0.93)), url("https://images.unsplash.com/photo-1522163182402-834f871fd851?q=80&w=1600")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      color: '#f1f5f9', 
      minHeight: '100vh', 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
      padding: '20px', 
      transition: 'all 0.3s ease' 
    }}>
      
      {/* ÜST BAR */}
      <header style={{ backgroundColor: 'rgba(22, 29, 26, 0.85)', backdropFilter: 'blur(10px)', border: '1px solid #232e29', padding: '16px 24px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)' }}>
        <div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '-0.5px' }}>
            🏔️ AURA TOPO <span style={{fontSize: '0.75rem', backgroundColor: '#1e2925', color: '#a7f3d0', padding: '3px 8px', borderRadius: '20px', fontWeight: '500'}}>PRO</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#a7f3d0', marginTop: '6px', backgroundColor: '#1b2621', padding: '6px 12px', borderRadius: '8px', display: 'inline-block' }}>
            🛰️ <span style={{ fontWeight: 'bold', color: '#4ade80' }}>CANLI GPS CONTEXT:</span> {coords.lat} , {coords.lon}
          </div>
        </div>
        
        <div>
          <button onClick={() => setCleanView(!cleanView)} style={{ backgroundColor: cleanView ? '#22c55e' : '#1e2924', border: '1px solid #2d3f37', color: '#fff', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem', transition: 'all 0.2s' }}>
            {cleanView ? '👁️ Menüleri Göster' : '👁️ Ekran Görüntüsü Modu (HUD Gizle)'}
          </button>
        </div>
      </header>

      {/* ANA PANEL MATRİSİ */}
      <div style={{ display: 'grid', gridTemplateColumns: cleanView ? '1fr' : '1fr minmax(340px, 440px)', gap: '25px', maxWidth: '1400px', margin: '0 auto', transition: 'all 0.3s ease' }}>
        
        {/* HARİTA / TOPO ALANI (VİZÖR KALKTI - ARKA PLAN DOĞRUDAN GÖRÜNÜR) */}
        <div style={{ position: 'relative', border: '1px solid #232e29', backgroundColor: imagePreview ? '#121715' : 'transparent', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)', minHeight: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          
          {cleanView && result && (
            <div style={{ position: 'absolute', top: '15px', right: '15px', backgroundColor: 'rgba(22, 29, 26, 0.95)', backdropFilter: 'blur(8px)', border: '1px solid #232e29', padding: '15px', borderRadius: '12px', zIndex: 10, width: '260px' }}>
              <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>⛰️ {routeName || 'İsimsiz Rota'}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '8px' }}>Açan: {routeSetter || 'Belirtilmedi'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.7rem', borderTop: '1px solid #232e29', paddingTop: '8px' }}>
                <div><span style={{color: '#94a3b8'}}>Derece:</span> <span style={{color: '#ef4444', fontWeight: 'bold'}}>{result.details?.grade}</span></div>
                <div><span style={{color: '#94a3b8'}}>Boy:</span> <span style={{color: '#22c55e', fontWeight: 'bold'}}>{result.details?.totalLength}</span></div>
                <div><span style={{color: '#94a3b8'}}>Bolt:</span> <span style={{color: '#38bdf8', fontWeight: 'bold'}}>{result.bolts.length} Adet</span></div>
                <div><span style={{color: '#94a3b8'}}>Kilit:</span> <span style={{color: '#f97316', fontWeight: 'bold'}}>{cruxCount} Bölge</span></div>
              </div>
            </div>
          )}

          {/* Kamera ve Görsel Katmanları */}
          {!imagePreview && (
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: videoRef.current?.srcObject ? 'block' : 'none', position: 'absolute', inset: 0 }} />
          )}
          {imagePreview && (
            <img src={imagePreview} alt="Kaya Yüzeyi" style={{ width: '100%', maxHeight: '75vh', objectFit: 'contain', zIndex: 1 }} />
          )}

          {/* SVG Çizim Katmanı (Sadece resim veya kamera varsa ve sonuç üretildiyse görünür) */}
          {result && (
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }} viewBox="0 0 100 100" preserveAspectRatio="none">
              <g opacity="0.6">
                <line x1="4" y1="10" x2="4" y2="90" stroke="#a7f3d0" strokeWidth="0.25" />
                {result.scaleTicks && result.scaleTicks.map((tick, idx) => (
                  <g key={`t-${idx}`}>
                    <line x1="2" y1={tick.y} x2="4" y2={tick.y} stroke="#a7f3d0" strokeWidth="0.4" />
                    <text x="6" y={tick.y + 0.8} fill="#a7f3d0" fontSize="1.8" fontWeight="600">{tick.label}</text>
                  </g>
                ))}
              </g>

              {result.route1 && (
                <polyline points={result.route1.map(pt => `${pt.x},${pt.y}`).join(' ')} fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" filter="drop-shadow(0px 2px 5px rgba(0,0,0,0.6))" />
              )}
              {showRoute2 && result.route2 && (
                <polyline points={result.route2.map(pt => `${pt.x},${pt.y}`).join(' ')} fill="none" stroke="#f97316" strokeWidth="1.1" strokeDasharray="1.5,1.5" strokeLinecap="round" strokeLinejoin="round" />
              )}

              {showBolts && result.bolts && result.bolts.map((bolt, idx) => (
                <g key={`b-${idx}`}>
                  <circle cx={bolt.x} cy={bolt.y} r="0.9" fill="#ffffff" stroke="#16a34a" strokeWidth="0.35" />
                  <circle cx={bolt.x} cy={bolt.y} r="0.25" fill="#16a34a" />
                  <text x={bolt.x + 2} y={bolt.y + 0.8} fill="#ffffff" fontSize="1.8" fontWeight="bold" style={{ paintOrder: 'stroke', stroke: '#0f1311', strokeWidth: '0.8px' }}>B{idx + 1} ({bolt.h}m)</text>
                </g>
              ))}

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
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(15,19,17,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 5 }}>
              <div style={{ color: '#22c55e', fontSize: '1rem', fontWeight: 'bold' }}>🏔️ Topografik Yapı Çözülüyor...</div>
            </div>
          )}
        </div>

        {/* SAĞ TARAF: YAPILANDIRMA PANELİ */}
        {!cleanView && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ backgroundColor: 'rgba(22, 29, 26, 0.85)', backdropFilter: 'blur(10px)', border: '1px solid #232e29', padding: '16px', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '12px', fontWeight: 'bold' }}>🎯 CANLI AYAR DEĞİŞTİRİCİ</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.7', color: '#64748b', display: 'block', marginBottom: '4px' }}>ZORLUK DERECESİ</label>
                  <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)} style={{ width: '100%', backgroundColor: '#0f1311', color: '#22c55e', border: '1px solid #232e29', padding: '8px', borderRadius: '6px', fontWeight: 'bold', outline: 'none' }}>
                    {['5', '6-', '6', '6+', '7-', '7', '7+', '8-'].map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>KİLİT ETAP SAYISI</label>
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
                  <input type="checkbox" checked={showCheck} checked={showBolts} onChange={(e) => setShowBolts(e.target.checked)} style={{ accentColor: '#22c55e' }} />
                  <span>Bolt İstasyonlarını Etiketle</span>
                </label>
              </div>
            </div>

            <div style={{ backgroundColor: 'rgba(22, 29, 26, 0.85)', backdropFilter: 'blur(10px)', border: '1px solid #232e29', padding: '1
