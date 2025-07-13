import React, { useState, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";

// Sabit Uygulama Bilgisi (değiştirilemez)
const APP_METADATA = Object.freeze({
  name: "TradRota",
  developer: "İsmail Çolak",
  version: "1.0.0"
});

function KonumSecici({ onKonumSec }) {
  useMapEvents({
    click(e) {
      onKonumSec(e.latlng);
    }
  });
  return null;
}

export default function TradRotaForm() {
  const [form, setForm] = useState({
    rotaAdi: "",
    konum: "",
    kayaTipi: "",
    tarih: "",
    uzunluk: "",
    ipBoyu: "",
    koruma: "",
    boltlu: false,
    seviye: "orta",
    teknik: 0,
    egim: 0,
    sureklilik: 0,
    psikoloji: 0,
    hamle: 0,
    notlar: "",
    fotograf: null,
    fotoAnaliz: "",
    koordinat: null
  });

  const [kayitlar, setKayitlar] = useState([]);
  const [arama, setArama] = useState("");

  useEffect(() => {
    const localData = localStorage.getItem("rota_kayitlari");
    if (localData) {
      setKayitlar(JSON.parse(localData));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("rota_kayitlari", JSON.stringify(kayitlar));
  }, [kayitlar]);

  const handleChange = (e) => {
    const { name, value, files, type, checked } = e.target;
    if (name === "fotograf") {
      const foto = files[0];
      const analiz = "Yüzey Tahmini: slab / Teknik zorluk yüksek olabilir.";
      setForm({ ...form, fotograf: foto, fotoAnaliz: analiz });
    } else if (type === "checkbox") {
      setForm({ ...form, [name]: checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const toplamPuan =
    Number(form.teknik) +
    Number(form.egim) +
    Number(form.sureklilik) +
    Number(form.psikoloji) +
    Number(form.hamle) +
    (form.boltlu ? -1 : 0);

  const tahminiUIAA = () => {
    if (toplamPuan <= 6) return "IV–IV+";
    if (toplamPuan <= 9) return "V–V+";
    if (toplamPuan <= 12) return "VI–VI+";
    if (toplamPuan <= 15) return "VII–VII+";
    if (toplamPuan <= 18) return "VIII–VIII+";
    if (toplamPuan <= 21) return "IX–IX+";
    return "X ve üzeri";
  };

  const handleKayit = () => {
    const yeniKayit = {
      ...form,
      toplamPuan,
      uiaa: tahminiUIAA(),
      fotografURL: form.fotograf ? URL.createObjectURL(form.fotograf) : null
    };
    setKayitlar([...kayitlar, yeniKayit]);
    alert("Kayıt alındı!");
  };

  const filtrelenmisKayitlar = kayitlar.filter(k =>
    k.rotaAdi.toLowerCase().includes(arama.toLowerCase()) ||
    k.konum.toLowerCase().includes(arama.toLowerCase())
  );

  return (
    <div style={{
      padding: "24px",
      maxWidth: "800px",
      margin: "0 auto",
      background: "linear-gradient(rgba(255,255,255,0.95), rgba(255,255,255,0.95)), url('https://images.unsplash.com/photo-1580461924703-91f24e3fba5b?auto=format&fit=crop&w=1600&q=80')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      minHeight: "100vh"
    }}>
      <h1 style={{ fontSize: "28px", fontWeight: "bold", backgroundColor: "rgba(255,255,255,0.9)", padding: "12px", borderRadius: "12px", marginBottom: "12px" }}>{APP_METADATA.name}</h1>
      <p style={{ fontSize: "16px", color: "#333", backgroundColor: "rgba(255,255,255,0.8)", padding: "6px 10px", borderRadius: "8px", display: "inline-block" }}>Geliştirici: {APP_METADATA.developer} | Sürüm: {APP_METADATA.version}</p>

      <div style={{ background: "rgba(255,255,255,0.95)", padding: "20px", borderRadius: "12px", marginTop: "24px", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "grid", gap: "14px" }}>
          <input name="rotaAdi" placeholder="Rota Adı" onChange={handleChange} />
          <input name="konum" placeholder="Konum / Sektör" onChange={handleChange} />
          <select name="seviye" value={form.seviye} onChange={handleChange}>
            <option value="baslangic">Başlangıç</option>
            <option value="orta">Orta</option>
            <option value="ileri">İleri</option>
          </select>

          <input name="kayaTipi" placeholder="Kaya Tipi (kalker, granit...)" onChange={handleChange} />
          <input name="tarih" type="date" onChange={handleChange} />
          <input name="uzunluk" placeholder="Toplam Uzunluk (m)" onChange={handleChange} />
          <input name="ipBoyu" placeholder="İp Boyu Sayısı" onChange={handleChange} />
          <input name="koruma" placeholder="Gereken Koruma Tipleri (cam, takoz...)" onChange={handleChange} />

          <label><input type="checkbox" name="boltlu" onChange={handleChange} /> Boltlu Rota mı?</label>

          <input name="teknik" type="number" placeholder="Teknik Zorluk (0–10)" onChange={handleChange} />
          <input name="egim" type="number" placeholder="Eğim / Stil (0–5)" onChange={handleChange} />
          <input name="sureklilik" type="number" placeholder="Süreklilik (0–5)" onChange={handleChange} />
          <input name="psikoloji" type="number" placeholder="Psikolojik Etki (0–3)" onChange={handleChange} />
          <input name="hamle" type="number" placeholder="Hamle Özgünlüğü (0–2)" onChange={handleChange} />

          <textarea name="notlar" placeholder="Notlar / Beta" onChange={handleChange} />

          <label><strong>Kaya Fotoğrafı Yükle:</strong></label>
          <input name="fotograf" type="file" accept="image/*" onChange={handleChange} />

          {form.fotograf && (
            <div>
              <img
                src={URL.createObjectURL(form.fotograf)}
                alt="Yüklenen Kaya"
                style={{ borderRadius: "8px", padding: "8px", maxWidth: "100%" }}
              />
              <p style={{ fontStyle: "italic", marginTop: "8px" }}>{form.fotoAnaliz}</p>
            </div>
          )}

          <label><strong>Haritada Rota Noktası Seç:</strong></label>
          <MapContainer center={[39.9, 32.85]} zoom={6} style={{ height: "300px", borderRadius: "8px" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <KonumSecici onKonumSec={(koor) => setForm({ ...form, koordinat: koor })} />
            {form.koordinat && <Marker position={form.koordinat} />}
          </MapContainer>

          <div style={{ backgroundColor: "#eef2f7", padding: "12px", borderRadius: "8px" }}>
            <p><strong>Toplam Puan:</strong> {toplamPuan}</p>
            <p><strong>Tahmini UIAA Derecesi:</strong> {tahminiUIAA()}</p>
          </div>

          <button onClick={handleKayit} style={{ padding: "10px 20px", borderRadius: "8px", backgroundColor: "#2d6a4f", color: "white", border: "none" }}>Kaydı Tamamla</button>
        </div>
      </div>
    </div>
  );
}
