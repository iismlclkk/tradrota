import { useState, useRef } from 'react';

export default function Home() {
  const [file, setFile] = useState(null);
  const [wallHeight, setWallHeight] = useState(20); // Metre cinsinden
  const [analysis, setAnalysis] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(URL.createObjectURL(e.target.files[0]));
      setAnalysis(null);
    }
  };

  const computeAnalysis = () => {
    if (!file) return;
    
    // Rota Veri Hesaplamaları
    // Bolt mesafeleri genellikle 3-4 metre arasıdır, kilit etaplar ise yüksekliğin %60-70'indedir.
    const boltCount = Math.floor(wallHeight / 3);
    const bolts = Array.from({ length: boltCount }, (_, i) => ({
      x: 40 + Math.random() * 20, // Rota hattı çevresinde rastgele x
      y: 90 - ((i + 1) * (80 / (boltCount + 1))),
      meter: ((i + 1) * (wallHeight / (boltCount + 1))).toFixed(1)
    }));

    setAnalysis({
      grade: wallHeight > 20 ? "7A" : "6B",
      bolts: bolts,
      crux: { x: 50, y: 30, height: (wallHeight * 0.7).toFixed(1) }
    });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Topografik Analiz Motoru</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <input type="file" onChange={handleFileChange} />
        <label style={{ marginLeft: '10px' }}>
          Duvar Yüksekliği (m): 
          <input type="number" value={wallHeight} onChange={(e) => setWallHeight(e.target.value)} style={{ width: '50px', marginLeft: '5px' }} />
        </label>
        <button onClick={computeAnalysis} style={{ marginLeft: '10px' }}>Analizi Hesapla</button>
      </div>

      <div style={{ position: 'relative', display: 'inline-block' }}>
        {file && (
          <>
            <img src={file} style={{ maxWidth: '600px' }} alt="Sektör" />
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Rota Hattı */}
              <path d={`M 50 95 Q 40 60 50 30 T 50 5`} fill="none" stroke="#22c55e" strokeWidth="2" />
              
              {/* Boltlar */}
              {analysis && analysis.bolts.map((b, i) => (
                <circle key={i} cx={b.x} cy={b.y} r="1.5" fill="yellow" stroke="black" />
              ))}

              {/* Kilit Etap */}
              {analysis && (
                <rect x={analysis.crux.x - 2} y={analysis.crux.y - 2} width="4" height="4" fill="red" />
              )}
            </svg>
          </>
        )}
      </div>

      {analysis && (
        <div style={{ marginTop: '20px' }}>
          <h3>Hesaplanan Teknik Veriler:</h3>
          <p>Önerilen Derece: {analysis.grade}</p>
          <p>Bolt Sayısı: {analysis.bolts.length}</p>
          <p>Kilit Etap: {analysis.crux.height} metre civarında.</p>
        </div>
      )}
    </div>
  );
}
