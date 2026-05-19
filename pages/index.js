import { useState, useRef, useEffect } from 'react';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState('6-');
  const [imagePreview, setImagePreview] = useState(null);
  const [calcMethod, setCalcMethod] = useState('manual'); 
  const [manualHeight, setManualHeight] = useState(25); 
  const [refObjectLength, setRefObjectLength] = useState(1.75); 
  const [showRoute2, setShowRoute2] = useState(false);
  const [showBolts, setShowBolts] = useState(true);
  const [cruxCount, setCruxCount] = useState(1);
  const [routeName, setRouteName] = useState('');
  const [routeSetter, setRouteSetter] = useState('');
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [cleanView, setCleanView] = useState(false);
  const [coords, setCoords] = useState({ lat: '40.5284° N', lon: '41.6492° E' });
  
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const localData = localStorage.getItem('aura_outdoor_routes');
    if (localData) { setSavedRoutes(JSON.parse(localData)); }
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setImagePreview(reader.result); };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async (isSilent = false) => {
    if (!imagePreview) {
      if (!isSilent) alert("Lütfen bir görsel yükleyin.");
      return;
    }
    setLoading(true);
    // Simüle edilmiş analiz motoru
    setTimeout(() => {
      setResult({
        route1: [{x:40, y:90}, {x:50, y:60}, {x:45, y:30}, {x:55, y:10}],
        bolts: [{x:50, y:60, h:12}, {x:45, y:30, h:20}],
        cruxs: [{x:45, y:30, h:20}],
        details: { rockType: "Kireçtaşı", grade: selectedGrade, totalLength: "25 Metre" }
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#0a0a0a',
      color: '#fff',
      padding: '20px'
    }}>
      <header style={{ padding: '20px', borderBottom: '1px solid #22c55e' }}>
        <h1>🏔️ AURA TOPO PRO</h1>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '20px', marginTop: '20px' }}>
        <div style={{ border: '2px dashed #22c55e', minHeight: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {imagePreview ? (
            <img src={imagePreview} style={{ maxWidth: '100%', maxHeight: '500px' }} />
          ) : (
            <p>Görsel bekleniyor...</p>
          )}
        </div>

        <div>
          <button onClick={() => fileInputRef.current.click()}>Dosya Seç</button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{display:'none'}} />
          <button onClick={() => handleAnalyze(false)}>Analiz Et</button>
        </div>
      </div>
    </div>
  );
}
