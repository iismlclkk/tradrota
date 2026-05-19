import { useState, useRef, useEffect } from 'react';

export default function Home() {
  const [file, setFile] = useState(null);
  const [height, setHeight] = useState(25);
  const [grade, setGrade] = useState("6A");
  const [cruxCount, setCruxCount] = useState(1);
  const [analysis, setAnalysis] = useState(null);
  const [coords, setCoords] = useState("39.92927° N, 41.27585° E");

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(URL.createObjectURL(e.target.files[0]));
      setAnalysis(null);
    }
  };

  const runAnalysis = () => {
    if (!file) return alert("Görsel yükle!");
    
    // Teknik Hesaplama Motoru
    const boltInterval = height / 6;
    const bolts = Array.from({ length: 6 }, (_, i) => ({
      x: 40 + (Math.sin(i) * 15),
      y: 90 - (i * 12),
      dist: (i * boltInterval).toFixed(1)
    }));

    setAnalysis({
      grade,
      bolts,
      crux: { x: 50, y: 30, height: (height * 0.7).toFixed(1) },
      rock: "Tekstürlü Volkanik / Basalt",
      rope: (height * 2 + 5) + "m"
    });
  };

  return (
    <div style={{ background: '#090909', color: '#fff', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #22c55e', paddingBottom: '10px' }}>
        <h1>AURA TOPO <span style={{color: '#22c55e'}}>PRO</span></h1>
        <div>📡 GPS: {coords}</div>
      </header>

      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        {/* Sol Panel: Teknik Ayarlar */}
        <div style={{ width: '350px', background: '#111', padding: '20px', borderRadius: '10px' }}>
          <h3>ANALİZ PANELİ</h3>
          <input type="file" onChange={handleFileChange} style={{ marginBottom: '15px' }} />
          
          <label>Zorluk:</label>
          <select value={grade} onChange={(e) => setGrade(e.target.value)} style={{ width: '100%', marginBottom: '10px' }}>
            {['5', '6A', '6B', '7A', '7B', '8A'].map(g => <option key={g} value={g}>{g}</option>)}
          </select>

          <label>Yükseklik (m):</label>
          <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} style={{ width: '100%', marginBottom: '10px' }} />

          <label>Kilit Etap Sayısı:</label>
          <input type="number" value={cruxCount} onChange={(e) => setCruxCount(e.target.value)} style={{ width: '100%', marginBottom: '20px' }} />

          <button onClick={runAnalysis} style={{ width: '100%', padding: '15px', background: '#22c55e', fontWeight: 'bold' }}>
            GEOLOJİK TOPOGRAFYA TARAMASI BAŞLAT
          </button>
        </div>

        {/* Orta: Görsel ve Rota */}
        <div style={{ flex: 1, position: 'relative', border: '1px solid #333' }}>
          {file && (
            <>
              <img src={file} style={{ width: '100%' }} />
              {analysis && (
                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M 50 95 Q 30 50 50 5" fill="none" stroke="#22c55e" strokeWidth="2" />
                  {analysis.bolts.map((b, i) => <circle key={i} cx={b.x} cy={b.y} r="2" fill="yellow" />)}
                  <rect x={48} y={28} width="4" height="4" fill="red" />
                </svg>
              )}
            </>
          )}
        </div>

        {/* Sağ Panel: Teknik Rapor */}
        <div style={{ width: '300px', background: '#111', padding: '20px', borderRadius: '10px' }}>
          <h3>TEKNİK RAPOR</h3>
          {analysis ? (
            <div>
              <p>Derece: {analysis.grade}</p>
              <p>Kaya Tipi: {analysis.rock}</p>
              <p>Önerilen İp: {analysis.rope}</p>
              <p>Kilit Etap: {analysis.crux.height}m</p>
            </div>
          ) : <p>Analiz verisi bekleniyor...</p>}
        </div>
      </div>
    </div>
  );
}
