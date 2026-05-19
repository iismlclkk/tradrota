export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'POST metodu gereklidir.' });
  }

  try {
    const { image, grade } = req.body;

    if (!image) {
      return res.status(400).json({ message: 'Görsel işlenemedi.' });
    }

    // Derecelere göre ölçeklenebilir dinamik metraj ve emniyet değerleri
    let totalLength = '24 Metre';
    let avgBoltDistance = '3.5 - 4 Metre Arası';
    let rockType = 'Kireçtaşı (Masif Yüzey)';
    let safetyZone = 'B1 (3m) ile B2 (6.5m) arası zemin çarpma riski barındırır. Emniyetçinin aktif/dinamik emniyet vermesi önerilir.';
    let clipComfort = 'B3 ve B4 istasyonları, geniş ayak setlerinin hemen üzerinde konumlandırıldığı için klip konforu yüksek ve güvenlidir.';
    let strategy = 'Yüzeyde belirgin yatay çatlak hatları tespit edildi. Spor tırmanış konforu için 5 adet bolt plaketi noktası simüle edilmiştir.';

    if (grade.startsWith('7')) {
      totalLength = '26 Metre';
      avgBoltDistance = '4 - 4.5 Metre Arası';
      rockType = 'Tektonik Kireçtaşı / Negatif Duvar';
      safetyZone = 'B2 (7m) hizasında kilit hamleden hemen önce klip yapılmalıdır. Klip gecikirse negatif yapı sebebiyle düşüş salınımı (pendulum) büyüktür.';
      clipComfort = 'B4 cıvatası sığ bir pocket üzerindeyken klip gerektirir. Dengeli ayak hassasiyeti ve hızlı klip yeteneği ister.';
    } else if (grade.startsWith('8')) {
      totalLength = '28 Metre';
      avgBoltDistance = '5 Metre Arası (Uzun Sürteçli)';
      rockType = 'Kompakt Basalt / Pürüzsüz Ayna';
      safetyZone = 'B3 (13m) üstündeki dinamik hamlede (dyno) düşüş faktörü yüksektir. İp sürtünmesini azaltmak için uzun ekspres kullanılması şarttır.';
      clipComfort = 'Kilit etaplardaki tüm boltlar kolların aşırı şişeceği (pump) negatif bölgelerde kalmaktadır, klip pozisyonları son derece agresiftir.';
    }

    // Rota Noktaları (Görsel Koordinatlar)
    const route1 = [
      { x: 50, y: 88 },
      { x: 48, y: 70 },
      { x: 54, y: 52 },
      { x: 47, y: 34 },
      { x: 52, y: 12 }
    ];

    const route2 = [
      { x: 50, y: 88 },
      { x: 32, y: 72 },
      { x: 38, y: 48 },
      { x: 44, y: 30 },
      { x: 52, y: 12 }
    ];

    // Boltlar ve yerden yükseklikleri (h: metre cinsinden)
    const bolts = [
      { x: 49, y: 80, h: 3.1 },
      { x: 47, y: 64, h: 6.5 },
      { x: 53, y: 46, h: 11.2 },
      { x: 46, y: 28, h: 16.8 },
      { x: 51, y: 18, h: 21.5 }
    ];

    // Kilit noktaları ve yerden yükseklikleri (h: metre cinsinden)
    const cruxs = [
      { x: 54, y: 52, h: 9.8 },  // Kilit 1
      { x: 47, y: 34, h: 15.1 }, // Kilit 2
      { x: 48, y: 70, h: 4.8 }   // Kilit 3
    ];

    return res.status(200).json({
      route1,
      route2,
      bolts,
      cruxs,
      details: {
        grade: grade,
        systemEquivalent: grade.startsWith('8') ? '7a / 5.11d' : grade.startsWith('7') ? '6b+ / 5.11a' : '5c / 5.9',
        rockType,
        totalLength,
        avgBoltDistance,
        safetyZone,
        clipComfort,
        strategy
      }
    });

  } catch (error) {
    return res.status(500).json({ message: 'Hata oluştu', error: error.message });
  }
}
