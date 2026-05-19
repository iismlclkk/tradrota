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
    const { image, grade, calcMethod, manualHeight, refObjectLength } = req.body;

    if (!image) {
      return res.status(400).json({ message: 'Görsel işlenemedi.' });
    }

    // MATEMATİKSEL ÖLÇEKLENDİRME ALGORİTMASI
    let targetTotalHeight = 25; 

    if (calcMethod === 'manual') {
      targetTotalHeight = manualHeight || 25;
    } else {
      // Referans nesneye göre ölçekleme simülasyonu
      targetTotalHeight = Math.round((refObjectLength || 1.75) * 14.3);
    }

    const scaleFactor = targetTotalHeight / 80;

    // Yükseklik Çentiklerini Dağıtma
    const scaleTicks = [];
    const step = Math.ceil(targetTotalHeight / 5);
    for (let m = 0; m <= targetTotalHeight; m += step) {
      const yPos = 90 - (m / scaleFactor);
      if (yPos >= 10) {
        scaleTicks.push({ y: parseFloat(yPos.toFixed(1)), label: `${m}m` });
      }
    }

    // Tırmanış Jargonuna Uygun Teknik Metin Şablonları (Cıvatalar Bolt Yapıldı)
    let rockType = 'Kireçtaşı (Masif Yüzey Sektörü)';
    let safetyZone = 'B1 ile B2 arası zemin çarpma riski barındırır. İp sürtünmesini engellemek adına emniyetçinin dinamik kalması hayati önem taşır.';
    let clipComfort = 'B3 ve B4 istasyonları, geniş ayak setlerinin hemen üzerinde konumlandırıldığı için klip konforu yüksek ve güvenlidir.';
    let strategy = 'Yüzeyde belirgin yatay çatlak hatları tespit edildi. Spor tırmanış konforu için 5 adet emniyet noktası ölçeklenmiştir.';

    if (grade.startsWith('7')) {
      rockType = 'Tektonik Kireçtaşı / Negatif Duvar Yapısı';
      safetyZone = 'Kilit etaba girmeden hemen önce klip yapılmalıdır. İp sürtünmesi ve negatif düşüş salınımı büyüktür.';
      clipComfort = 'B4 bolt noktası sığ bir pocket üzerindeyken klip gerektirir. Dengeli ayak hassasiyeti ister.';
    } else if (grade.startsWith('8')) {
      rockType = 'Kompakt Basalt / Pürüzsüz Ayna Yüzey';
      safetyZone = 'Üst dinamik hamle bölgesindeki düşüş faktöründe ana ip gerilimi yüksektir. Uzun ekspres kullanımı önerilir.';
      clipComfort = 'Kilit etaplardaki tüm boltlar kolların aşırı şişeceği (pump) negatif bölgelerde kalmaktadır, klip pozisyonları son derece agresiftir.';
    }

    // Grafik Koordinat Şablonu
    const route1 = [{ x: 50, y: 88 }, { x: 48, y: 70 }, { x: 54, y: 52 }, { x: 47, y: 34 }, { x: 52, y: 12 }];
    const route2 = [{ x: 50, y: 88 }, { x: 32, y: 72 }, { x: 38, y: 48 }, { x: 44, y: 30 }, { x: 52, y: 12 }];

    // Boltların ve kilitlerin yerden yükseklikleri
    const bolts = [
      { x: 49, y: 80, h: parseFloat(((90 - 80) * scaleFactor).toFixed(1)) },
      { x: 47, y: 64, h: parseFloat(((90 - 64) * scaleFactor).toFixed(1)) },
      { x: 53, y: 46, h: parseFloat(((90 - 46) * scaleFactor).toFixed(1)) },
      { x: 46, y: 28, h: parseFloat(((90 - 28) * scaleFactor).toFixed(1)) },
      { x: 51, y: 18, h: parseFloat(((90 - 18) * scaleFactor).toFixed(1)) }
    ];

    const cruxs = [
      { x: 54, y: 52, h: parseFloat(((90 - 52) * scaleFactor).toFixed(1)) },
      { x: 47, y: 34, h: parseFloat(((90 - 34) * scaleFactor).toFixed(1)) },
      { x: 48, y: 70, h: parseFloat(((90 - 70) * scaleFactor).toFixed(1)) }
    ];

    const requiredRope = `${targetTotalHeight * 2} Metre (İstasyon İniş Güvenliği Dahil)`;
    const quickdrawCount = bolts.length + 2; 
    const avgBoltDistance = `${(targetTotalHeight / bolts.length).toFixed(1)} Metre Arası`;

    return res.status(200).json({
      route1,
      route2,
      bolts,
      cruxs,
      scaleTicks,
      details: {
        grade: grade,
        systemEquivalent: grade.startsWith('8') ? '7a / 5.11d' : grade.startsWith('7') ? '6b+ / 5.11a' : '5c / 5.9',
        rockType,
        totalLength: `${targetTotalHeight} Metre`,
        requiredRope,
        quickdrawCount,
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
